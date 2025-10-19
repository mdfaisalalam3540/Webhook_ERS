import { Worker } from "bullmq";
import axios from "axios";
import redisClient from "../utils/redis.js";
import Event from "../models/Event.js";
import Subscription from "../models/Subscription.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { HMACService } from "../services/hmacService.js";

/**
 * Webhook Delivery Worker
 * Handles actual HTTP delivery of webhooks to external endpoints
 * Implements retry logic, HMAC signing, and comprehensive logging
 */

// Create worker instance for webhook-delivery queue
const worker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId, subscriptionId, deliveryAttempt = 1 } = job.data;

    console.log(
      `Webhook delivery attempt #${deliveryAttempt} for event: ${eventId}`
    );

    // ==================== DATA VALIDATION ====================
    // Fetch event and subscription data
    const [event, subscription] = await Promise.all([
      Event.findById(eventId),
      Subscription.findById(subscriptionId),
    ]);

    // Validate that both event and subscription exist and are active
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }
    if (!subscription.isActive) {
      throw new Error(`Subscription is inactive: ${subscriptionId}`);
    }

    console.log(
      `Validated delivery: ${subscription.name} -> ${event.eventType}`
    );

    // ==================== DELIVERY LOG CREATION ====================
    // Create delivery log entry to track this attempt
    const deliveryLog = new DeliveryLog({
      eventId: event._id,
      subscriptionId: subscription._id,
      deliveryAttempt,
      status: "pending",
    });

    try {
      // ==================== HMAC SIGNATURE GENERATION ====================
      // Generate cryptographic signature for payload verification
      const signature = HMACService.generateSignature(
        event.payload,
        subscription.secret
      );

      console.log(`Generated HMAC signature for delivery: ${deliveryLog._id}`);

      // ==================== REQUEST CONFIGURATION ====================
      // Prepare HTTP headers for webhook delivery
      const headers = {
        "Content-Type": "application/json",
        "X-Algohire-Signature": signature, // HMAC signature for verification
        "X-Algohire-Event-Type": event.eventType, // Type of event
        "X-Algohire-Event-Id": event.eventId, // Public event ID
        "X-Algohire-Delivery-Id": deliveryLog._id.toString(), // Unique delivery ID
        "X-Algohire-Attempt": deliveryAttempt.toString(), // Attempt number
        "User-Agent": "Algohire-Webhook-Relay/1.0", // Identify our service
      };

      // ==================== WEBHOOK DELIVERY ====================
      // Send HTTP POST request to webhook URL
      const response = await axios.post(
        subscription.webhookUrl,
        event.payload, // Send the actual event payload
        {
          headers,
          timeout: subscription.timeout, // Use subscription-specific timeout
          maxRedirects: 2, // Allow up to 2 redirects
          validateStatus: function (status) {
            // Consider any status < 500 as success (even 4xx)
            return status < 500;
          },
        }
      );

      // ==================== SUCCESS HANDLING ====================
      // Update delivery log with success information
      deliveryLog.status = "success";
      deliveryLog.responseStatus = response.status;
      deliveryLog.responseBody = JSON.stringify(response.data).substring(
        0,
        5000
      ); // Limit size
      deliveryLog.deliveredAt = new Date();
      deliveryLog.hmacVerified = true;

      await deliveryLog.save();

      console.log(`Webhook delivered successfully: HTTP ${response.status}`);

      return {
        success: true,
        status: response.status,
        deliveryId: deliveryLog._id,
      };
    } catch (error) {
      // ==================== ERROR HANDLING ====================
      console.error(`Webhook delivery failed: ${error.message}`);

      // Update delivery log with error information
      deliveryLog.status = "failed";
      deliveryLog.error = error.message;

      // Extract response details if available
      if (error.response) {
        deliveryLog.responseStatus = error.response.status;
        deliveryLog.responseBody = JSON.stringify(
          error.response.data
        ).substring(0, 5000);
      } else if (error.request) {
        // Network error - no response received
        deliveryLog.error =
          "Network error: No response received from webhook endpoint";
      }

      await deliveryLog.save();

      // ==================== RETRY LOGIC ====================
      // Check if we should retry this delivery
      const shouldRetry = deliveryAttempt < subscription.maxRetries;

      if (shouldRetry) {
        console.log(
          `Will retry delivery (attempt ${deliveryAttempt}/${subscription.maxRetries})`
        );

        // Calculate retry delay with exponential backoff
        const retryDelay = Math.min(
          1000 * Math.pow(2, deliveryAttempt - 1),
          30000
        );
        deliveryLog.nextRetryAt = new Date(Date.now() + retryDelay);
        deliveryLog.status = "retrying";
        await deliveryLog.save();

        throw new Error(`Delivery failed, will retry: ${error.message}`);
      } else {
        console.log(`Max retries exceeded (${subscription.maxRetries})`);
        throw new Error(
          `Delivery failed after ${subscription.maxRetries} attempts: ${error.message}`
        );
      }
    }
  },
  {
    connection: redisClient,
    concurrency: 10, // Process 10 webhook deliveries simultaneously
  }
);

// ==================== WORKER EVENT HANDLERS ====================

// Handle successful job completion
worker.on("completed", (job, result) => {
  console.log(`   Webhook delivery completed: ${job.id}`);
  console.log(
    `   Status: HTTP ${result.status}, Delivery ID: ${result.deliveryId}`
  );
});

// Handle job failures
worker.on("failed", (job, err) => {
  console.error(`Webhook delivery failed: ${job?.id}`, err.message);

  // Log additional context for debugging
  if (job) {
    console.error(`   Event: ${job.data.eventId}`);
    console.error(`   Subscription: ${job.data.subscriptionId}`);
    console.error(`   Attempt: ${job.data.deliveryAttempt}`);
  }
});

// Handle worker errors
worker.on("error", (err) => {
  console.error("Webhook worker error:", err);
});

// Handle stalled jobs
worker.on("stalled", (jobId) => {
  console.warn(`Webhook delivery job stalled: ${jobId}`);
});

console.log("   Webhook delivery worker started...");
console.log("   Listening on queue: webhook-delivery");
console.log("   Concurrency: 10 deliveries");
console.log("   Timeout: Configurable per subscription");

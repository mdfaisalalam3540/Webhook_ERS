import { Worker } from "bullmq";
import redisClient from "../utils/redis.js";
import Event from "../models/Event.js";
import Subscription from "../models/Subscription.js";
import { webhookQueue } from "../utils/queue.js";

/**
 * Event Processor Worker
 * Processes incoming events and queues webhook deliveries to relevant subscriptions
 * Runs as a separate process to handle event distribution
 */

// Create worker instance for event-processing queue
const worker = new Worker(
  "event-processing",
  async (job) => {
    const { eventId, eventType } = job.data;

    console.log(`Processing event: ${eventId} (${eventType})`);

    // ==================== EVENT VALIDATION ====================
    // Verify event exists and is valid
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    console.log(`Event validated: ${event.eventId}`);

    // ==================== SUBSCRIPTION MATCHING ====================
    // Find active subscriptions interested in this event type
    const subscriptions = await Subscription.find({
      eventTypes: eventType,
      isActive: true,
    });

    console.log(
      `Found ${subscriptions.length} subscriptions for event type: ${eventType}`
    );

    // ==================== JOB CREATION ====================
    // Create webhook delivery jobs for each matching subscription
    const jobs = subscriptions.map((subscription) => ({
      name: "webhook-delivery",
      data: {
        eventId: event._id,
        subscriptionId: subscription._id,
        deliveryAttempt: 1, // First attempt
      },
      opts: {
        jobId: `${event.eventId}-${subscription._id}-${Date.now()}`, // Unique job ID
        delay: 0, // Process immediately
      },
    }));

    // ==================== BATCH QUEUEING ====================
    // Add all delivery jobs to the queue in a single operation
    if (jobs.length > 0) {
      await webhookQueue.addBulk(jobs);
      console.log(
        `Queued ${jobs.length} webhook deliveries for event ${event.eventId}`
      );
    } else {
      console.log(`No active subscriptions found for event type: ${eventType}`);
    }

    return {
      eventId: event.eventId,
      eventType,
      subscriptionsProcessed: subscriptions.length,
      deliveriesQueued: jobs.length,
    };
  },
  {
    connection: redisClient,
    concurrency: 5, // Process 5 events simultaneously
  }
);

// ==================== WORKER EVENT HANDLERS ====================

// Handle successful job completion
worker.on("completed", (job, result) => {
  console.log(`Event processing completed: ${job.id}`);
  console.log(
    `   Event: ${result.eventId}, Deliveries: ${result.deliveriesQueued}`
  );
});

// Handle job failures
worker.on("failed", (job, err) => {
  console.error(`Event processing failed: ${job?.id}`, err.message);

  // Log additional context for debugging
  if (job) {
    console.error(`   Event ID: ${job.data.eventId}`);
    console.error(`   Event Type: ${job.data.eventType}`);
  }
});

// Handle worker errors
worker.on("error", (err) => {
  console.error("Event processor worker error:", err);
});

// Handle stalled jobs
worker.on("stalled", (jobId) => {
  console.warn(`Event processing job stalled: ${jobId}`);
});

console.log("   Event processor worker started...");
console.log("   Listening on queue: event-processing");
console.log("   Concurrency: 5 jobs");

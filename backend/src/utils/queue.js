// backend/src/utils/queue.js
import { Queue } from "bullmq";
import redisClient from "./redis.js";

/**
 * ================================================================
 * BullMQ Queues Setup
 *
 * This file defines all the queues used in the backend.
 * BullMQ is a Node.js library for managing job queues with Redis.
 * Each queue handles specific tasks and supports retries, timeouts,
 * and automatic removal of old jobs.
 * ================================================================
 */

/**
 * -----------------------------
 * Webhook Delivery Queue
 * -----------------------------
 * Purpose:
 *   - Handles actual HTTP delivery of webhook events to external endpoints.
 *   - Includes retry logic with exponential backoff to handle transient failures.
 * Default Options:
 *   - removeOnComplete: keeps last 100 successful jobs (prevents memory bloat)
 *   - removeOnFail: keeps last 1000 failed jobs (for debugging and auditing)
 *   - attempts: retry a failing job up to 5 times
 *   - backoff: exponential retry (1s, 2s, 4s, 8s, 16s)
 *   - timeout: 30s per job to avoid hanging requests
 */
export const webhookQueue = new Queue("webhook-delivery", {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 1000, // Keep last 1000 failed jobs
    attempts: 5, // Maximum retry attempts per job
    backoff: {
      type: "exponential", // Delay doubles after each failure
      delay: 1000, // Initial delay = 1 second
    },
    timeout: 30000, // 30s per job before timing out
  },
});

/**
 * -----------------------------
 * Event Processing Queue
 * -----------------------------
 * Purpose:
 *   - Handles initial processing of events.
 *   - Matches events to subscriptions and enqueues webhook delivery jobs.
 * Default Options:
 *   - removeOnComplete: keeps last 50 successful processing jobs
 *   - removeOnFail: keeps last 100 failed jobs
 *   - attempts: retry up to 3 times for transient errors
 *   - backoff: fixed delay of 2 seconds between retries
 */
export const eventQueue = new Queue("event-processing", {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 50, // Keep last 50 successful jobs
    removeOnFail: 100, // Keep last 100 failed jobs
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "fixed", // Fixed delay between retries
      delay: 2000, // 2 seconds
    },
  },
});

/**
 * -----------------------------
 * Logging
 * -----------------------------
 * This helps track which queues are initialized.
 * Useful during development and debugging.
 */
console.log("BullMQ queues initialized:");
console.log(
  "   - webhook-delivery: Handles HTTP delivery to webhook endpoints"
);
console.log("   - event-processing: Handles event routing to subscriptions");

/**
 * ================================================================
 * Notes:
 * ================================================================
 * 1. Redis Connection:
 *    - Both queues share the same Redis client.
 *    - Redis client uses ioredis (supports defineCommand for BullMQ).
 *
 * 2. Job Options:
 *    - removeOnComplete: prevents database/Redis bloat by removing old jobs.
 *    - removeOnFail: allows debugging of recent failed jobs.
 *    - attempts: handles transient network errors automatically.
 *    - backoff: can be 'fixed' (constant delay) or 'exponential'.
 *
 * 3. Timeouts:
 *    - Set a reasonable timeout for each job to avoid hanging requests.
 *
 * 4. Extending:
 *    - You can add more queues here as your backend grows.
 *    - Each queue can have its own Redis connection, but sharing is fine for small apps.
 */

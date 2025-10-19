// backend/src/utils/redis.js
import IORedis from "ioredis";

/**
 * Redis Client Configuration for BullMQ
 *
 * BullMQ uses Redis as its backend for queue management.
 * This client handles:
 *   - Connection management
 *   - Event handling (errors, reconnects, disconnects)
 *   - Compatibility with BullMQ commands
 *
 * We are using "ioredis" instead of the newer "redis" package
 * because BullMQ requires a Redis client that supports defineCommand.
 *
 * Read more:
 *   - ioredis: https://github.com/luin/ioredis
 *   - BullMQ Redis requirements: https://docs.bullmq.io/guide/queues
 */

// Create a new Redis client instance
// `process.env.REDIS_URL` allows configuration via environment variables
// Fallback to localhost if not set
const redisClient = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    // Maximum time (ms) to wait for a connection before timing out
    connectTimeout: 60000,
    // Infinite retries for commands if Redis temporarily disconnects
    maxRetriesPerRequest: null,
    // Optional: automatic reconnection attempts with delay
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000); // exponential backoff capped at 2s
      return delay;
    },
  }
);

// ==================== EVENT HANDLERS ====================

// Fires when a connection error occurs
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
  // In production, you might want to implement alerting or fallback logic
});

// Fires when the client successfully connects to Redis
redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

// Fires when the client disconnects from Redis
redisClient.on("end", () => {
  console.log("Redis Client Disconnected");
});

// Fires when the client is attempting to reconnect
redisClient.on("reconnecting", () => {
  console.log("Redis Client Reconnecting...");
});

// Fires when the client is ready to receive commands
redisClient.on("ready", () => {
  console.log("Redis Client Ready to use");
});

/**
 * Export the Redis client instance
 *
 * Notes:
 *   - ioredis automatically connects when imported/used.
 *   - No need to call a separate connect() unless you want lazy connection.
 *   - This client can now safely be passed to BullMQ queues.
 */
export default redisClient;

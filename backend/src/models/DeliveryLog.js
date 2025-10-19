import mongoose from "mongoose";

/**
 * DeliveryLog Schema - Tracks webhook delivery attempts and outcomes
 * Essential for monitoring, debugging, and retry logic
 */
const deliveryLogSchema = new mongoose.Schema(
  {
    // Reference to the Event that was delivered
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // Index for finding deliveries for specific events
    },

    // Reference to the Subscription used for delivery
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true, // Index for finding deliveries for specific subscriptions
    },

    // Delivery attempt counter (1 for first attempt, increments on retries)
    deliveryAttempt: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Current status of the delivery attempt
    status: {
      type: String,
      enum: ["pending", "success", "failed", "retrying"],
      default: "pending",
      index: true, // Index for filtering by status
    },

    // HTTP response status code from webhook endpoint
    responseStatus: {
      type: Number,
    },

    // Response body from webhook endpoint (truncated if too large)
    responseBody: {
      type: String,
      maxlength: 10000, // Limit response body storage
    },

    // Error message if delivery failed
    error: {
      type: String,
      maxlength: 2000,
    },

    // Timestamp when delivery was successfully completed
    deliveredAt: {
      type: Date,
    },

    // Next retry time for failed deliveries
    nextRetryAt: {
      type: Date,
      index: true, // Index for finding deliveries ready for retry
    },

    // Flag indicating if HMAC signature was verified
    hmacVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatic Mongoose timestamps (createdAt, updatedAt)
    timestamps: true,

    // JSON transformation
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Compound indexes for common query patterns
 */
// Unique index for event-subscription pairs (prevents duplicates)
deliveryLogSchema.index({ eventId: 1, subscriptionId: 1 });

// Index for finding pending/retrying deliveries that are ready for retry
deliveryLogSchema.index({ status: 1, nextRetryAt: 1 });

// Index for dashboard queries (status with timestamp)
deliveryLogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("DeliveryLog", deliveryLogSchema);

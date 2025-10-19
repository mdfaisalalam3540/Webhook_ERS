import mongoose from "mongoose";

/**
 * Subscription Schema - Defines webhook subscription configurations
 * Subscriptions define where and how to deliver webhook notifications
 */
const subscriptionSchema = new mongoose.Schema(
  {
    // Human-readable name for the subscription
    name: {
      type: String,
      required: true,
      trim: true, // Remove whitespace from both ends
      maxlength: 100, // Prevent excessively long names
    },

    // Optional description of the subscription's purpose
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Webhook URL where events will be delivered
    webhookUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Basic URL validation
          return /^https?:\/\/.+\..+/.test(v);
        },
        message: "Invalid webhook URL format",
      },
    },

    // Array of event types this subscription is interested in
    eventTypes: [
      {
        type: String,
        required: true,
        enum: [
          "job.created",
          "candidate.applied",
          "interview.scheduled",
          "candidate.updated",
          "assessment.completed",
        ],
      },
    ],

    // HMAC secret for signing webhook payloads
    // This should NEVER be exposed in API responses (except during creation)
    secret: {
      type: String,
      required: true,
      select: false, // Never include in queries by default
    },

    // Activation status - inactive subscriptions won't receive events
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering active subscriptions
    },

    // Maximum number of delivery retry attempts
    maxRetries: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },

    // HTTP request timeout in milliseconds
    timeout: {
      type: Number,
      default: 5000, // 5 seconds
      min: 1000, // Minimum 1 second
      max: 30000, // Maximum 30 seconds
    },

    // Automatic timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Schema options
    timestamps: false, // Using custom timestamps
    toJSON: {
      transform: function (doc, ret) {
        // Transform for JSON serialization
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.secret; // Ensure secret is never serialized
        return ret;
      },
    },
  }
);

/**
 * Indexes for optimized query performance
 */
// Compound index for finding active subscriptions for specific event types
subscriptionSchema.index({ eventTypes: 1, isActive: 1 });

// Index for webhook URL (useful for debugging and analytics)
subscriptionSchema.index({ webhookUrl: 1 });

/**
 * Pre-save middleware to update the updatedAt timestamp
 */
subscriptionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Subscription model
export default mongoose.model("Subscription", subscriptionSchema);

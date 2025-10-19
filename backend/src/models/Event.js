import mongoose from "mongoose";

/**
 * Event Schema - Defines the structure for event documents in MongoDB
 * Events represent system occurrences that trigger webhook notifications
 */
const eventSchema = new mongoose.Schema(
  {
    // Unique public identifier for the event (exposed to clients)
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Create index for faster queries
    },

    // Type of event - must be one of the predefined event types
    eventType: {
      type: String,
      required: true,
      enum: [
        "job.created", // New job posting created
        "candidate.applied", // Candidate applied for a job
        "interview.scheduled", // Interview scheduled with candidate
        "candidate.updated", // Candidate profile updated
        "assessment.completed", // Candidate completed assessment
      ],
      index: true, // Index for filtering events by type
    },

    // Source module that generated the event
    sourceModule: {
      type: String,
      required: true,
      enum: ["JOBS", "CANDIDATES", "INTERVIEWS", "ASSESSMENTS"],
    },

    // Event payload containing relevant data
    // Using Mixed type to allow flexible JSON structure
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Automatic timestamp when event is created
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for sorting by creation date
    },

    // Idempotency key to prevent duplicate event processing
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    // Schema options
    timestamps: false, // We're using custom createdAt instead of Mongoose timestamps
    toJSON: {
      transform: function (doc, ret) {
        // Transform the document for JSON serialization
        ret.id = ret._id; // Add id field (alias for _id)
        delete ret._id; // Remove _id field
        delete ret.__v; // Remove version key
        return ret;
      },
    },
  }
);

/**
 * Compound indexes for common query patterns
 */
// Index for filtering by event type with date sorting
eventSchema.index({ eventType: 1, createdAt: -1 });

/**
 * Pre-save middleware (example - can be expanded)
 */
eventSchema.pre("save", function (next) {
  console.log(`Saving event: ${this.eventId} of type ${this.eventType}`);
  next();
});

// Create and export the Event model
export default mongoose.model("Event", eventSchema);

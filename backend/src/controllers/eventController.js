// Import required models and utilities
import Event from "../models/Event.js";
import Subscription from "../models/Subscription.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { eventQueue } from "../utils/queue.js";
import { v4 as uuidv4 } from "uuid";

/**
 * EventController - Handles all event-related operations
 * Includes event reception, processing, and retrieval
 */
export class EventController {
  /**
   * Receive and process incoming events from various modules
   * Implements idempotency to prevent duplicate processing
   */
  static async receiveEvent(req, res) {
    try {
      // Extract event data from request body
      const { eventType, sourceModule, payload, idempotencyKey } = req.body;

      // ==================== INPUT VALIDATION ====================
      if (!eventType || !sourceModule || !payload || !idempotencyKey) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: eventType, sourceModule, payload, idempotencyKey",
        });
      }

      // ==================== IDEMPOTENCY CHECK ====================
      // Prevent duplicate event processing using idempotency key
      const existingEvent = await Event.findOne({ idempotencyKey });
      if (existingEvent) {
        console.log(
          `Event already processed with idempotency key: ${idempotencyKey}`
        );
        return res.status(200).json({
          success: true,
          message: "Event already processed",
          eventId: existingEvent.eventId,
        });
      }

      // ==================== EVENT CREATION ====================
      // Create new event document with unique event ID
      const event = new Event({
        eventId: uuidv4(), // Generate unique identifier for the event
        eventType,
        sourceModule,
        payload,
        idempotencyKey,
      });

      // Save event to database
      await event.save();
      console.log(`Event created: ${event.eventId} (${eventType})`);

      // ==================== QUEUE PROCESSING ====================
      // Add event to processing queue for asynchronous handling
      await eventQueue.add("process-event", {
        eventId: event._id, // MongoDB ObjectId for internal reference
        eventType: event.eventType, // Event type for subscription matching
      });

      console.log(`Event queued for processing: ${event.eventId}`);

      // ==================== SUCCESS RESPONSE ====================
      // Return 202 Accepted since processing is asynchronous
      res.status(202).json({
        success: true,
        eventId: event.eventId,
        message: "Event accepted for processing",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Event reception error:", error);

      // Handle specific error types
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Invalid event data format",
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: "Duplicate event detected",
        });
      }

      // Generic server error response
      res.status(500).json({
        success: false,
        error: "Failed to process event",
      });
    }
  }

  /**
   * Retrieve paginated list of events with optional filtering
   * Supports pagination and event type filtering
   */
  static async getEvents(req, res) {
    try {
      // Extract query parameters with default values
      const { page = 1, limit = 20, eventType } = req.query;

      // Build filter object based on query parameters
      const filter = eventType ? { eventType } : {};

      // ==================== DATABASE QUERY ====================
      // Fetch events with pagination and sorting
      const events = await Event.find(filter)
        .sort({ createdAt: -1 }) // Most recent first
        .limit(parseInt(limit)) // Convert string to number
        .skip((parseInt(page) - 1) * parseInt(limit)) // Calculate skip for pagination
        .select("-__v"); // Exclude version key

      // Get total count for pagination metadata
      const total = await Event.countDocuments(filter);

      console.log(`Retrieved ${events.length} events (page ${page})`);

      // ==================== SUCCESS RESPONSE ====================
      res.json({
        success: true,
        events,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Failed to fetch events:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch events",
      });
    }
  }
}

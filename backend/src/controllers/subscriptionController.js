// Import required models and services
import Subscription from "../models/Subscription.js";
import { HMACService } from "../services/hmacService.js";

/**
 * SubscriptionController - Handles webhook subscription management
 * Includes CRUD operations for subscriptions
 */
export class SubscriptionController {
  /**
   * Create a new webhook subscription
   * Generates HMAC secret for webhook security
   */
  static async createSubscription(req, res) {
    try {
      // Extract subscription data from request body
      const { name, description, webhookUrl, eventTypes } = req.body;

      // ==================== INPUT VALIDATION ====================
      if (!name || !webhookUrl || !eventTypes || !Array.isArray(eventTypes)) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: name, webhookUrl, eventTypes (array)",
        });
      }

      if (eventTypes.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one event type must be specified",
        });
      }

      // ==================== SECRET GENERATION ====================
      // Generate unique HMAC secret for webhook signature verification
      const secret = HMACService.generateSecret();
      console.log(`Generated HMAC secret for subscription: ${name}`);

      // ==================== SUBSCRIPTION CREATION ====================
      // Create new subscription document
      const subscription = new Subscription({
        name,
        description,
        webhookUrl,
        eventTypes,
        secret, // Store the secret for HMAC signing
      });

      // Save subscription to database
      await subscription.save();
      console.log(`Subscription created: ${subscription._id} (${name})`);

      // ==================== SUCCESS RESPONSE ====================
      // Return 201 Created for successful resource creation
      res.status(201).json({
        success: true,
        subscription: {
          id: subscription._id,
          name: subscription.name,
          description: subscription.description,
          webhookUrl: subscription.webhookUrl,
          eventTypes: subscription.eventTypes,
          isActive: subscription.isActive,
          secret, // Return secret only once - client should store it securely
          createdAt: subscription.createdAt,
        },
        warning: "Store the secret securely - it will not be shown again",
      });
    } catch (error) {
      console.error("Subscription creation error:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Invalid subscription data format",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to create subscription",
      });
    }
  }

  /**
   * Retrieve all subscriptions
   * Returns list of subscriptions without sensitive secret data
   */
  static async getSubscriptions(req, res) {
    try {
      // Fetch all subscriptions, sorted by creation date (newest first)
      const subscriptions = await Subscription.find()
        .sort({ createdAt: -1 })
        .select("-secret -__v"); // Exclude secret and version key

      console.log(`Retrieved ${subscriptions.length} subscriptions`);

      res.json({
        success: true,
        subscriptions,
      });
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch subscriptions",
      });
    }
  }

  /**
   * Update an existing subscription
   * Allows partial updates of subscription properties
   */
  static async updateSubscription(req, res) {
    try {
      const { id } = req.params; // Subscription ID from URL parameter
      const updates = req.body; // Fields to update

      // ==================== UPDATE OPERATION ====================
      // Find and update subscription, return updated document
      const subscription = await Subscription.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedAt: new Date(), // Always update the timestamp
        },
        {
          new: true, // Return updated document
          runValidators: true, // Run model validators on update
        }
      ).select("-secret -__v"); // Exclude sensitive fields

      // Handle subscription not found
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: "Subscription not found",
        });
      }

      console.log(`Subscription updated: ${subscription._id}`);

      res.json({
        success: true,
        subscription,
      });
    } catch (error) {
      console.error("Failed to update subscription:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Invalid update data",
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to update subscription",
      });
    }
  }

  /**
   * Delete a subscription
   * Removes subscription from database
   */
  static async deleteSubscription(req, res) {
    try {
      const { id } = req.params;

      // Find and delete the subscription
      const subscription = await Subscription.findByIdAndDelete(id);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: "Subscription not found",
        });
      }

      console.log(`Subscription deleted: ${id}`);

      res.json({
        success: true,
        message: "Subscription deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete subscription",
      });
    }
  }
}

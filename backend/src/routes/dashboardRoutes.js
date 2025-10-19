// backend/src/routes/dashboardRoutes.js
import express from "express";
import DeliveryLog from "../models/DeliveryLog.js";
import Event from "../models/Event.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Returns overall system statistics for dashboard display
 */
router.get("/stats", async (req, res) => {
  try {
    console.log("Fetching dashboard statistics...");

    // Execute all count operations in parallel for better performance
    const [
      totalEvents,
      totalSubscriptions,
      successfulDeliveries,
      failedDeliveries,
    ] = await Promise.all([
      Event.countDocuments(),
      Subscription.countDocuments({ isActive: true }), // Only count active subscriptions
      DeliveryLog.countDocuments({ status: "success" }),
      DeliveryLog.countDocuments({ status: "failed" }),
    ]);

    // Calculate additional metrics
    const totalDeliveries = successfulDeliveries + failedDeliveries;
    const successRate =
      totalDeliveries > 0
        ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(2)
        : 0;

    console.log(
      `Dashboard stats: ${totalEvents} events, ${totalSubscriptions} subscriptions`
    );

    res.json({
      success: true,
      stats: {
        totalEvents,
        totalSubscriptions,
        successfulDeliveries,
        failedDeliveries,
        successRate: parseFloat(successRate),
        totalDeliveries,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
    });
  }
});

/**
 * GET /api/dashboard/recent-deliveries
 * Returns recent delivery attempts with pagination
 */
router.get("/recent-deliveries", async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    console.log(
      `Fetching recent deliveries (limit: ${limit}, page: ${page})...`
    );

    // Convert query parameters to numbers
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Fetch delivery logs with population and pagination
    const recentDeliveries = await DeliveryLog.find()
      .populate("eventId", "eventType eventId createdAt") // Select only needed event fields
      .populate("subscriptionId", "name webhookUrl") // Select only needed subscription fields
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limitNum)
      .skip(skip)
      .select("-__v"); // Exclude version key

    // Get total count for pagination info
    const total = await DeliveryLog.countDocuments();

    console.log(`Retrieved ${recentDeliveries.length} recent deliveries`);

    res.json({
      success: true,
      deliveries: recentDeliveries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Failed to fetch recent deliveries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent deliveries",
    });
  }
});

/**
 * POST /api/dashboard/retry/:logId
 * Retry a failed webhook delivery
 */
router.post("/retry/:logId", async (req, res) => {
  try {
    const { logId } = req.params;

    console.log(`Attempting to retry delivery: ${logId}`);

    // Find the delivery log with associated event and subscription
    const deliveryLog = await DeliveryLog.findById(logId)
      .populate("eventId")
      .populate("subscriptionId");

    if (!deliveryLog) {
      return res.status(404).json({
        success: false,
        error: "Delivery log not found",
      });
    }

    // Check if subscription is still active
    if (!deliveryLog.subscriptionId.isActive) {
      return res.status(400).json({
        success: false,
        error: "Cannot retry - subscription is inactive",
      });
    }

    // Check if maximum retries exceeded
    if (deliveryLog.deliveryAttempt >= deliveryLog.subscriptionId.maxRetries) {
      return res.status(400).json({
        success: false,
        error: "Maximum retry attempts exceeded",
      });
    }

    // Import queue here to avoid circular dependencies
    const { webhookQueue } = await import("../utils/queue.js");

    // Add retry job to queue
    await webhookQueue.add(
      "webhook-delivery",
      {
        eventId: deliveryLog.eventId._id,
        subscriptionId: deliveryLog.subscriptionId._id,
        deliveryAttempt: deliveryLog.deliveryAttempt + 1,
        isRetry: true,
      },
      {
        jobId: `retry-${deliveryLog.eventId.eventId}-${
          deliveryLog.subscriptionId._id
        }-${Date.now()}`,
      }
    );

    console.log(`Delivery retry queued: ${logId}`);

    res.json({
      success: true,
      message: "Delivery queued for retry",
      deliveryAttempt: deliveryLog.deliveryAttempt + 1,
    });
  } catch (error) {
    console.error(" Failed to retry delivery:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retry delivery",
    });
  }
});

export { router as dashboardRoutes };

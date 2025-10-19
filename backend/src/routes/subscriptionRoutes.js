import express from "express";
import { SubscriptionController } from "../controllers/subscriptionController.js";

const router = express.Router();

/**
 * POST /api/subscriptions
 * Create a new webhook subscription
 * Body: { name, description, webhookUrl, eventTypes[] }
 */
router.post("/", SubscriptionController.createSubscription);

/**
 * GET /api/subscriptions
 * Retrieve all subscriptions (without secrets)
 */
router.get("/", SubscriptionController.getSubscriptions);

/**
 * PUT /api/subscriptions/:id
 * Update an existing subscription
 * Body: { name, description, webhookUrl, eventTypes[], isActive, etc. }
 */
router.put("/:id", SubscriptionController.updateSubscription);

/**
 * DELETE /api/subscriptions/:id
 * Delete a subscription
 */
router.delete("/:id", SubscriptionController.deleteSubscription);

export { router as subscriptionRoutes };

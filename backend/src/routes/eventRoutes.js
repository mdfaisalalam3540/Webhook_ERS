import express from "express";
import { EventController } from "../controllers/eventController.js";

const router = express.Router();

/**
 * POST /api/events
 * Receive new events from system modules
 * Body: { eventType, sourceModule, payload, idempotencyKey }
 */
router.post("/", EventController.receiveEvent);

/**
 * GET /api/events
 * Retrieve paginated list of events with optional filtering
 * Query params: page, limit, eventType
 */
router.get("/", EventController.getEvents);

export { router as eventRoutes };

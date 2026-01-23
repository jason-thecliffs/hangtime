import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertEventSchema, insertParticipantSchema, insertAvailabilitySchema } from "@shared/schema";

const createEventRequestSchema = z.object({
  event: insertEventSchema,
  timeOptions: z.array(z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

const participateRequestSchema = z.object({
  participant: insertParticipantSchema.omit({ eventId: true }),
  availability: z.array(z.object({
    timeOptionId: z.number(),
    status: z.enum(["available", "maybe", "unavailable"]),
  })),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new event
  app.post("/api/events", async (req, res) => {
    try {
      const { event, timeOptions } = createEventRequestSchema.parse(req.body);
      const createdEvent = await storage.createEvent(event, timeOptions);
      res.json(createdEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Get event details by share ID
  app.get("/api/events/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const event = await storage.getEventByShareId(shareId);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Submit participant availability
  app.post("/api/events/:shareId/participate", async (req, res) => {
    try {
      const { shareId } = req.params;
      const { participant, availability } = participateRequestSchema.parse(req.body);
      
      const event = await storage.getEventByShareId(shareId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if participant with this name already exists for this event
      const existingParticipants = await storage.getParticipantsByEventId(event.id);
      const existingParticipant = existingParticipants.find(p => p.name.toLowerCase() === participant.name.toLowerCase());

      let participantId: number;
      if (existingParticipant) {
        participantId = existingParticipant.id;
      } else {
        const newParticipant = await storage.createParticipant({
          ...participant,
          eventId: event.id,
        });
        participantId = newParticipant.id;
      }

      await storage.setAvailability(participantId, availability);
      
      res.json({ success: true, participantId });
    } catch (error) {
      console.error("Error submitting availability:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

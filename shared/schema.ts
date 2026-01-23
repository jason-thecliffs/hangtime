import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration").notNull(), // e.g., "1 hour", "2 hours", "30 minutes"
  shareId: text("share_id").notNull().unique(), // unique identifier for sharing
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeOptions = pgTable("time_options", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull(),
  timeOptionId: integer("time_option_id").notNull(),
  status: text("status").notNull(), // "available", "maybe", "unavailable"
});

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  shareId: true,
  createdAt: true,
});

export const insertTimeOptionSchema = createInsertSchema(timeOptions).omit({
  id: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type TimeOption = typeof timeOptions.$inferSelect;
export type InsertTimeOption = z.infer<typeof insertTimeOptionSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

// Extended types for API responses
export type EventWithTimeOptions = Event & {
  timeOptions: TimeOption[];
};

export type TimeOptionWithAvailability = TimeOption & {
  availabilityCount: {
    available: number;
    maybe: number;
    unavailable: number;
    total: number;
  };
  participants: Array<{
    id: number;
    name: string;
    status: string;
  }>;
};

// Database relations
export const eventsRelations = relations(events, ({ many }) => ({
  timeOptions: many(timeOptions),
  participants: many(participants),
}));

export const timeOptionsRelations = relations(timeOptions, ({ one, many }) => ({
  event: one(events, {
    fields: [timeOptions.eventId],
    references: [events.id],
  }),
  availability: many(availability),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  event: one(events, {
    fields: [participants.eventId],
    references: [events.id],
  }),
  availability: many(availability),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  participant: one(participants, {
    fields: [availability.participantId],
    references: [participants.id],
  }),
  timeOption: one(timeOptions, {
    fields: [availability.timeOptionId],
    references: [timeOptions.id],
  }),
}));

export type EventWithDetails = Event & {
  timeOptions: TimeOptionWithAvailability[];
  participantCount: number;
};

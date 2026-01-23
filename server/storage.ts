import { 
  events, 
  timeOptions, 
  participants, 
  availability,
  type Event, 
  type InsertEvent,
  type TimeOption,
  type InsertTimeOption,
  type Participant,
  type InsertParticipant,
  type Availability,
  type InsertAvailability,
  type EventWithTimeOptions,
  type EventWithDetails,
  type TimeOptionWithAvailability
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Events
  createEvent(event: InsertEvent, timeOptionsList: Omit<InsertTimeOption, "eventId">[]): Promise<EventWithTimeOptions>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventByShareId(shareId: string): Promise<EventWithDetails | undefined>;
  
  // Participants
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipantsByEventId(eventId: number): Promise<Participant[]>;
  
  // Availability
  setAvailability(participantId: number, availabilityList: Omit<InsertAvailability, "participantId">[]): Promise<void>;
  getAvailabilityByTimeOption(timeOptionId: number): Promise<Availability[]>;
}

export class DatabaseStorage implements IStorage {

  async createEvent(event: InsertEvent, timeOptionsList: Omit<InsertTimeOption, "eventId">[]): Promise<EventWithTimeOptions> {
    const shareId = nanoid(10);
    
    // Insert event and get the created event
    const [newEvent] = await db
      .insert(events)
      .values({
        title: event.title,
        description: event.description || null,
        duration: event.duration,
        shareId,
      })
      .returning();

    // Insert time options
    const createdTimeOptions: TimeOption[] = [];
    for (const timeOption of timeOptionsList) {
      const [newTimeOption] = await db
        .insert(timeOptions)
        .values({
          ...timeOption,
          eventId: newEvent.id,
        })
        .returning();
      createdTimeOptions.push(newTimeOption);
    }

    return {
      ...newEvent,
      timeOptions: createdTimeOptions,
    };
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventByShareId(shareId: string): Promise<EventWithDetails | undefined> {
    const [event] = await db.select().from(events).where(eq(events.shareId, shareId));
    if (!event) return undefined;

    const eventTimeOptions = await db.select().from(timeOptions).where(eq(timeOptions.eventId, event.id));
    const eventParticipants = await db.select().from(participants).where(eq(participants.eventId, event.id));

    const timeOptionsWithAvailability: TimeOptionWithAvailability[] = [];

    for (const timeOption of eventTimeOptions) {
      const availabilityData = await db.select().from(availability).where(eq(availability.timeOptionId, timeOption.id));

      const availabilityCount = {
        available: availabilityData.filter(a => a.status === "available").length,
        maybe: availabilityData.filter(a => a.status === "maybe").length,
        unavailable: availabilityData.filter(a => a.status === "unavailable").length,
        total: availabilityData.length,
      };

      const participantsWithStatus = await Promise.all(
        availabilityData.map(async (a) => {
          const [participant] = await db.select().from(participants).where(eq(participants.id, a.participantId));
          return {
            id: a.participantId,
            name: participant?.name || "Unknown",
            status: a.status,
          };
        })
      );

      timeOptionsWithAvailability.push({
        ...timeOption,
        availabilityCount,
        participants: participantsWithStatus,
      });
    }

    return {
      ...event,
      timeOptions: timeOptionsWithAvailability,
      participantCount: eventParticipants.length,
    };
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const [newParticipant] = await db
      .insert(participants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async getParticipantsByEventId(eventId: number): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.eventId, eventId));
  }

  async setAvailability(participantId: number, availabilityList: Omit<InsertAvailability, "participantId">[]): Promise<void> {
    // Remove existing availability for this participant
    await db.delete(availability).where(eq(availability.participantId, participantId));

    // Add new availability
    if (availabilityList.length > 0) {
      const availabilityData = availabilityList.map(item => ({
        ...item,
        participantId,
      }));
      await db.insert(availability).values(availabilityData);
    }
  }

  async getAvailabilityByTimeOption(timeOptionId: number): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.timeOptionId, timeOptionId));
  }
}

export const storage = new DatabaseStorage();

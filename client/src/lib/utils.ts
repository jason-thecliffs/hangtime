import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): { dayName: string; dayNumber: string; month: string } {
  // Parse the date string properly to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate().toString();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  
  return { dayName, dayNumber, month: monthName };
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

export function getBestTimeSlotIds(timeOptions: any[]): number[] {
  if (timeOptions.length === 0) return [];

  // Check if there are any responses at all
  const totalResponses = timeOptions.reduce(
    (sum, option) => sum + option.availabilityCount.total,
    0
  );
  if (totalResponses === 0) return [];

  // Find max available count
  const maxAvailable = Math.max(
    ...timeOptions.map(option => option.availabilityCount.available)
  );

  // Filter to options matching max available
  const topAvailableOptions = timeOptions.filter(
    option => option.availabilityCount.available === maxAvailable
  );

  // Among those, find max maybe count
  const maxMaybe = Math.max(
    ...topAvailableOptions.map(option => option.availabilityCount.maybe)
  );

  // Return IDs of all options matching both max available AND max maybe
  return topAvailableOptions
    .filter(option => option.availabilityCount.maybe === maxMaybe)
    .map(option => option.id);
}

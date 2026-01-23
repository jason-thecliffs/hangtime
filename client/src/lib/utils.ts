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

export function getBestTimeSlot(timeOptions: any[]): any | null {
  if (timeOptions.length === 0) return null;
  
  return timeOptions.reduce((best, current) => {
    const currentAvailable = current.availabilityCount.available;
    const bestAvailable = best.availabilityCount.available;
    
    if (currentAvailable > bestAvailable) {
      return current;
    } else if (currentAvailable === bestAvailable) {
      // If tied, prefer the one with fewer "maybe" responses
      return current.availabilityCount.maybe < best.availabilityCount.maybe ? current : best;
    }
    return best;
  });
}

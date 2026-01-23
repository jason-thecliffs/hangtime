import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Rocket } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils";
import { TimePicker } from "@/components/ui/time-picker";

const formSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  duration: z.string().min(1, "Duration is required"),
  organizerName: z.string().min(1, "Your name is required"),
});

type TimeOption = {
  date: string;
  startTime: string;
  availability: "available" | "maybe" | "unavailable";
};

// Helper function to calculate end time based on start time and duration
const calculateEndTime = (startTime: string, duration: string): string => {
  if (!startTime) return "";
  
  const [hours, minutes] = startTime.split(':').map(Number);
  let durationMinutes = 0;
  
  switch (duration) {
    case "30 minutes":
      durationMinutes = 30;
      break;
    case "1 hour":
      durationMinutes = 60;
      break;
    case "1.5 hours":
      durationMinutes = 90;
      break;
    case "2 hours":
      durationMinutes = 120;
      break;
    case "3 hours":
      durationMinutes = 180;
      break;
    case "4 hours":
      durationMinutes = 240;
      break;
    case "5 hours":
      durationMinutes = 300;
      break;
    case "6 hours":
      durationMinutes = 360;
      break;
    case "All day":
      return "23:59";
    case "2 days":
      return "Multi-day";
    case "3 days":
      return "Multi-day";
    case "4 days":
      return "Multi-day";
    case "A week":
      return "Multi-day";
    default:
      return "";
  }
  
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

// Helper function to get the next day's date string
const getNextDay = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

// Helper function to calculate end date for multi-day events
const calculateEndDate = (startDate: string, duration: string): string => {
  if (!startDate) return "";
  
  // Parse the date string properly to avoid timezone issues
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  let daysToAdd = 0;
  
  switch (duration) {
    case "2 days":
      daysToAdd = 1; // Day 1 + Day 2 = 1 day later
      break;
    case "3 days":
      daysToAdd = 2; // Day 1 + Day 2 + Day 3 = 2 days later
      break;
    case "4 days":
      daysToAdd = 3; // Day 1 + Day 2 + Day 3 + Day 4 = 3 days later
      break;
    case "A week":
      daysToAdd = 7; // Start day + 7 more days
      break;
    default:
      return "";
  }
  
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString('en-US');
};

// Helper function to check if duration is multi-day
const isMultiDay = (duration: string): boolean => {
  return ["2 days", "3 days", "4 days", "A week"].includes(duration);
};

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([
    { date: "", startTime: "", availability: "available" }
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      organizerName: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: { event: z.infer<typeof formSchema>; timeOptions: TimeOption[] }) => {
      const response = await apiRequest("POST", "/api/events", data);
      const result = await response.json();
      return { result, originalTimeOptions: data.timeOptions, organizerName: data.event.organizerName };
    },
    onSuccess: async ({ result, originalTimeOptions, organizerName }) => {
      // Submit creator's availability
      try {
        const availabilityData = result.timeOptions.map((timeOption: { id: number }, index: number) => ({
          timeOptionId: timeOption.id,
          status: originalTimeOptions[index].availability,
        }));

        await apiRequest("POST", `/api/events/${result.shareId}/participate`, {
          participant: { name: organizerName },
          availability: availabilityData,
        });
      } catch (error) {
        console.error("Failed to submit creator availability:", error);
      }

      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      setLocation(`/event/${result.shareId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTimeOption = () => {
    const lastOption = timeOptions[timeOptions.length - 1];
    const nextDate = lastOption.date ? getNextDay(lastOption.date) : "";
    const nextStartTime = lastOption.startTime || "";
    
    setTimeOptions([...timeOptions, { date: nextDate, startTime: nextStartTime, availability: "available" }]);
  };

  const removeTimeOption = (index: number) => {
    if (timeOptions.length > 1) {
      setTimeOptions(timeOptions.filter((_, i) => i !== index));
    }
  };

  const updateTimeOption = (index: number, field: keyof TimeOption, value: string) => {
    const updated = [...timeOptions];
    updated[index][field] = value as any;
    setTimeOptions(updated);
  };

  const updateTimeOptionAvailability = (index: number, value: "available" | "maybe" | "unavailable") => {
    const updated = [...timeOptions];
    updated[index].availability = value;
    setTimeOptions(updated);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const validTimeOptions = timeOptions.filter(option => {
      if (isMultiDay(data.duration)) {
        return option.date; // Only date required for multi-day events
      } else {
        return option.date && option.startTime; // Both date and time required for single-day events
      }
    });

    if (validTimeOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one complete time option.",
        variant: "destructive",
      });
      return;
    }

    // Calculate end times based on start time and duration
    const timeOptionsWithEndTime = validTimeOptions.map(option => ({
      ...option,
      startTime: isMultiDay(data.duration) ? "09:00" : option.startTime, // Default start time for multi-day
      endTime: calculateEndTime(isMultiDay(data.duration) ? "09:00" : option.startTime, data.duration)
    }));

    createEventMutation.mutate({
      event: data,
      timeOptions: timeOptionsWithEndTime,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Plus className="text-white h-5 w-5" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Create New Event</h3>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Team Lunch, Birthday Party" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30 minutes">30 minutes</SelectItem>
                            <SelectItem value="1 hour">1 hour</SelectItem>
                            <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                            <SelectItem value="2 hours">2 hours</SelectItem>
                            <SelectItem value="3 hours">3 hours</SelectItem>
                            <SelectItem value="4 hours">4 hours</SelectItem>
                            <SelectItem value="5 hours">5 hours</SelectItem>
                            <SelectItem value="6 hours">6 hours</SelectItem>
                            <SelectItem value="All day">All day</SelectItem>
                            <SelectItem value="2 days">2 days</SelectItem>
                            <SelectItem value="3 days">3 days</SelectItem>
                            <SelectItem value="4 days">4 days</SelectItem>
                            <SelectItem value="A week">A week</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell participants what this event is about..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Organizer (Your Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Propose Date & Time Options</label>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    {timeOptions.map((option, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4 border border-neutral-100">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Date</label>
                            <Input
                              type="date"
                              value={option.date}
                              onChange={(e) => updateTimeOption(index, "date", e.target.value)}
                              className="border border-neutral-100"
                            />
                          </div>
                          {isMultiDay(form.watch("duration")) ? (
                            <div className="flex flex-col">
                              <label className="text-sm text-gray-600 mb-1">End Date</label>
                              <div className="px-3 py-2 bg-gray-50 border border-neutral-100 rounded-md text-gray-700">
                                {option.date ? calculateEndDate(option.date, form.watch("duration")) : "Select start date"}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">Start Time</label>
                                <TimePicker
                                  value={option.startTime}
                                  onChange={(value) => updateTimeOption(index, "startTime", value)}
                                  placeholder="Select start time"
                                />
                              </div>
                              {option.startTime && form.watch("duration") && (
                                <div className="flex flex-col">
                                  <label className="text-sm text-gray-600 mb-1">End Time</label>
                                  <div className="px-3 py-2 bg-gray-50 border border-neutral-100 rounded-md text-gray-700">
                                    {formatTime(calculateEndTime(option.startTime, form.watch("duration")))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex flex-col">
                            <label className="text-sm text-gray-600 mb-1">Your Availability</label>
                            <Select
                              value={option.availability}
                              onValueChange={(value) => updateTimeOptionAvailability(index, value as "available" | "maybe" | "unavailable")}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Your Availability" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="maybe">Maybe</SelectItem>
                                <SelectItem value="unavailable">Not Available</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {timeOptions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeOption(index)}
                            className="text-red-500 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTimeOption}
                      className="w-full border-2 border-dashed border-neutral-100 py-4 text-gray-500 hover:border-primary hover:text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Time Option
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-blue-700"
                    disabled={createEventMutation.isPending}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

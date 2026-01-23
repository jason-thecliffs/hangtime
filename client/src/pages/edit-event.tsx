import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Calendar, Clock, Plus, Trash2, Save, ArrowLeft } from "lucide-react";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import type { EventWithDetails } from "@shared/schema";

interface EditEventProps {
  shareId: string;
}

type TimeOption = {
  id?: number;
  date: string;
  startTime: string;
};

const editEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required"),
  timeOptions: z.array(z.object({
    id: z.number().optional(),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
  })).min(1, "At least one time option is required"),
});

export default function EditEvent({ shareId }: EditEventProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${shareId}`],
  });

  const form = useForm<z.infer<typeof editEventSchema>>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      timeOptions: [],
    },
  });

  // Load event data into form when it's available
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description ?? undefined,
        duration: event.duration,
        timeOptions: event.timeOptions.map(option => ({
          id: option.id,
          date: option.date,
          startTime: option.startTime,
        })),
      });
      setTimeOptions(event.timeOptions.map(option => ({
        id: option.id,
        date: option.date,
        startTime: option.startTime,
      })));
    }
  }, [event, form]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editEventSchema>) => {
      const response = await apiRequest("PUT", `/api/events/${shareId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Updated!",
        description: "Your event has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${shareId}`] });
      setLocation(`/event/${shareId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const addTimeOption = () => {
    const lastOption = timeOptions[timeOptions.length - 1];
    let newDate = "";
    let newTime = "09:00";

    if (lastOption) {
      const lastDate = new Date(lastOption.date);
      lastDate.setDate(lastDate.getDate() + 1);
      newDate = lastDate.toISOString().split('T')[0];
      newTime = lastOption.startTime;
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      newDate = tomorrow.toISOString().split('T')[0];
    }

    const newTimeOption: TimeOption = {
      date: newDate,
      startTime: newTime,
    };

    const updatedTimeOptions = [...timeOptions, newTimeOption];
    setTimeOptions(updatedTimeOptions);
    form.setValue("timeOptions", updatedTimeOptions);
  };

  const removeTimeOption = (index: number) => {
    const updatedTimeOptions = timeOptions.filter((_, i) => i !== index);
    setTimeOptions(updatedTimeOptions);
    form.setValue("timeOptions", updatedTimeOptions);
  };

  const updateTimeOption = (index: number, field: keyof TimeOption, value: string) => {
    const updatedTimeOptions = timeOptions.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    );
    setTimeOptions(updatedTimeOptions);
    form.setValue("timeOptions", updatedTimeOptions);
  };

  const onSubmit = (data: z.infer<typeof editEventSchema>) => {
    updateEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 mb-4">Event not found or an error occurred.</p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/event/${shareId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-600 mt-2">Update your event details and time options.</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Time Options</h3>
                    <Button type="button" onClick={addTimeOption} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {timeOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <Input
                              type="date"
                              value={option.date}
                              onChange={(e) => updateTimeOption(index, "date", e.target.value)}
                              className="w-full"
                            />
                          </div>
                          
                          {isMultiDay(form.watch("duration")) ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                                {option.date ? calculateEndDate(option.date, form.watch("duration")) : "Select start date"}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                              </label>
                              <TimePicker
                                value={option.startTime}
                                onChange={(value) => updateTimeOption(index, "startTime", value)}
                              />
                            </div>
                          )}
                        </div>

                        {timeOptions.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimeOption(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Link href={`/event/${shareId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={updateEventMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateEventMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {updateEventMutation.isPending ? "Updating..." : "Update Event"}
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
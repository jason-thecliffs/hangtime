import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Check, MessageCircleQuestion, X, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { EventWithDetails } from "@shared/schema";

interface ParticipateProps {
  shareId: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
});

export default function Participate({ shareId }: ParticipateProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [availability, setAvailability] = useState<Record<number, string>>({});

  // Helper function to check if duration is multi-day
  const isMultiDay = (duration: string): boolean => {
    return ["2 days", "3 days", "4 days", "A week"].includes(duration);
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

  // Helper function to format date range for multi-day events
  const formatDateRange = (startDate: string, duration: string): string => {
    // Parse start date properly
    const [year, month, day] = startDate.split('-').map(Number);
    const startDateObj = new Date(year, month - 1, day);
    const startFormatted = startDateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Calculate end date
    let daysToAdd = 0;
    switch (duration) {
      case "2 days": daysToAdd = 1; break;
      case "3 days": daysToAdd = 2; break;
      case "4 days": daysToAdd = 3; break;
      case "A week": daysToAdd = 7; break;
    }
    
    const endDateObj = new Date(year, month - 1, day + daysToAdd);
    const endFormatted = endDateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${shareId}`],
  });

  const submitAvailabilityMutation = useMutation({
    mutationFn: async (data: { participant: { name: string }; availability: Array<{ timeOptionId: number; status: string }> }) => {
      const response = await apiRequest("POST", `/api/events/${shareId}/participate`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Availability Submitted!",
        description: "Thank you for submitting your availability.",
      });
      // Invalidate the event cache to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/events/${shareId}`] });
      // Redirect to event view to show results
      setLocation(`/event/${shareId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const setTimeOptionAvailability = (timeOptionId: number, status: string) => {
    setAvailability(prev => ({
      ...prev,
      [timeOptionId]: status,
    }));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!event) return;

    const availabilityArray = event.timeOptions.map(option => ({
      timeOptionId: option.id,
      status: availability[option.id] || "unavailable",
    }));

    submitAvailabilityMutation.mutate({
      participant: { name: data.name },
      availability: availabilityArray,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event details...</p>
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
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-3">
                <Check className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{event.title}</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your name" 
                          className="w-full max-w-md"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 mb-6">
                  {event.timeOptions.map((option) => {
                    const currentStatus = availability[option.id];
                    
                    return (
                      <div key={option.id} className="border border-neutral-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            {isMultiDay(event.duration) ? (
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">{formatDateRange(option.date, event.duration)}</div>
                                <div className="text-sm text-gray-500">All Day</div>
                              </div>
                            ) : (
                              <>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-900">{formatDate(option.date).dayName}</div>
                                  <div className="text-2xl font-bold text-gray-900">{formatDate(option.date).dayNumber}</div>
                                  <div className="text-sm text-gray-500">{formatDate(option.date).month}</div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{formatTime(option.startTime)} - {formatTime(option.endTime)}</div>
                                  <div className="text-sm text-gray-600">{event.duration} duration</div>
                                </div>
                              </>
                            )}
                          </div>
                          <div>
                            {option.availabilityCount.available > 0 && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {option.availabilityCount.available} people available
                              </Badge>
                            )}
                            <div className="text-sm text-gray-500">
                              {option.availabilityCount.total} people responded
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            variant={currentStatus === "available" ? "default" : "outline"}
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${
                              currentStatus === "available" 
                                ? "border-success bg-success text-white hover:bg-green-600" 
                                : "border-neutral-100 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                            onClick={() => setTimeOptionAvailability(option.id, "available")}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Available
                          </Button>
                          <Button
                            type="button"
                            variant={currentStatus === "maybe" ? "default" : "outline"}
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${
                              currentStatus === "maybe" 
                                ? "border-yellow-400 bg-yellow-400 text-yellow-900 hover:bg-yellow-500" 
                                : "border-neutral-100 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                            onClick={() => setTimeOptionAvailability(option.id, "maybe")}
                          >
                            <MessageCircleQuestion className="mr-2 h-4 w-4" />
                            Maybe
                          </Button>
                          <Button
                            type="button"
                            variant={currentStatus === "unavailable" ? "default" : "outline"}
                            className={`flex-1 py-3 px-4 font-medium transition-colors ${
                              currentStatus === "unavailable" 
                                ? "border-red-500 bg-red-500 text-white hover:bg-red-600" 
                                : "border-neutral-100 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                            onClick={() => setTimeOptionAvailability(option.id, "unavailable")}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Not Available
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Save Draft
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-blue-700"
                    disabled={submitAvailabilityMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitAvailabilityMutation.isPending ? "Submitting..." : "Submit Availability"}
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

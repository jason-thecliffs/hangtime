import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, Edit, Share2, Check, Star, Copy, X } from "lucide-react";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime, getBestTimeSlot } from "@/lib/utils";
import type { EventWithDetails } from "@shared/schema";

interface EventViewProps {
  shareId: string;
}

export default function EventView({ shareId }: EventViewProps) {
  const { toast } = useToast();

  // Helper function to check if duration is multi-day
  const isMultiDay = (duration: string): boolean => {
    return ["2 days", "3 days", "4 days", "A week"].includes(duration);
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

  // Helper function to format option display text for summary table
  const formatOptionForTable = (option: any, duration: string): string => {
    if (isMultiDay(duration)) {
      return formatDateRange(option.date, duration);
    } else {
      const dateInfo = formatDate(option.date);
      return `${dateInfo.dayName} ${dateInfo.month} ${dateInfo.dayNumber} - ${formatTime(option.startTime)} to ${formatTime(option.endTime)}`;
    }
  };

  // Helper function to calculate summary statistics
  const calculateSummaryStats = (timeOptions: any[]) => {
    return timeOptions.map(option => {
      const available = option.participants.filter((p: any) => p.status === "available").length;
      const maybe = option.participants.filter((p: any) => p.status === "maybe").length;
      const unavailable = option.participants.filter((p: any) => p.status === "unavailable").length;
      const total = available + maybe + unavailable;
      
      return {
        ...option,
        stats: {
          available,
          maybe,
          unavailable,
          total
        }
      };
    }).sort((a, b) => {
      // Sort by available participants first, then by maybe responses
      if (b.stats.available !== a.stats.available) {
        return b.stats.available - a.stats.available;
      }
      return b.stats.maybe - a.stats.maybe;
    });
  };

  // Helper function to scroll to specific time option
  const scrollToTimeOption = (optionId: number) => {
    const element = document.getElementById(`time-option-${optionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${shareId}`],
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });

  const copyShareLink = () => {
    const url = `${window.location.origin}/participate/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "The event link has been copied to your clipboard.",
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

  const bestTimeSlot = getBestTimeSlot(event.timeOptions);
  const participateUrl = `${window.location.origin}/participate/${shareId}`;
  const summaryStats = calculateSummaryStats(event.timeOptions);
  const topOptions = summaryStats.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mr-3">
                  <Users className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600">{event.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium">{event.duration}</div>
              </div>
            </div>

            {/* Summary Table */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary of Top Options</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposed Option</TableHead>
                      <TableHead className="text-center">Available Participants</TableHead>
                      <TableHead className="text-center">Maybes</TableHead>
                      <TableHead className="text-center">Not Available</TableHead>
                      <TableHead className="text-center">Total Responses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topOptions.map((option, index) => (
                      <TableRow 
                        key={option.id} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => scrollToTimeOption(option.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {index === 0 && (
                              <Badge className="text-xs bg-success text-white mr-2">
                                Recommended - Best Availability
                              </Badge>
                            )}
                            <span>{formatOptionForTable(option, event.duration)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-success">
                          {option.stats.available}
                        </TableCell>
                        <TableCell className="text-center font-medium text-yellow-600">
                          {option.stats.maybe}
                        </TableCell>
                        <TableCell className="text-center font-medium text-red-500">
                          {option.stats.unavailable}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {option.stats.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Share this link with participants:</p>
                  <p className="text-blue-700 font-mono text-sm break-all">{participateUrl}</p>
                </div>
                <Button 
                  onClick={copyShareLink}
                  className="bg-blue-600 hover:bg-blue-700 ml-4"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">All Proposed Options</h4>
              
              <div className="space-y-3">
                {event.timeOptions.map((option) => {
                  const isBest = bestTimeSlot?.id === option.id;
                  
                  return (
                    <div 
                      key={option.id} 
                      id={`time-option-${option.id}`}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isBest ? 'border-2 border-success bg-green-50' : 'border-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {isBest && (
                            <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                              <Star className="text-white w-3 h-3" />
                            </div>
                          )}
                          {isMultiDay(event.duration) ? (
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">{formatDateRange(option.date, event.duration)}</div>
                              <div className="text-sm text-gray-500">All Day</div>
                            </div>
                          ) : (
                            <>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">{formatDate(option.date).dayName}</div>
                                <div className={`text-2xl font-bold ${isBest ? 'text-success' : 'text-primary'}`}>
                                  {formatDate(option.date).dayNumber}
                                </div>
                                <div className="text-sm text-gray-500">{formatDate(option.date).month}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{formatTime(option.startTime)} - {formatTime(option.endTime)}</div>
                                <div className="text-sm text-gray-600">{event.duration} duration</div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isBest && (
                            <Badge className="text-sm bg-success text-white">
                              Recommended - Best availability
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-2 bg-success rounded-full"></div>
                            <span className="text-sm font-medium">
                              {option.availabilityCount.available} available
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            out of {option.availabilityCount.total} responses
                          </div>
                        </div>
                      </div>
                      
                      {option.participants.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <div className="text-xs text-gray-500 mb-2 font-medium">Responses:</div>
                          <div className="space-y-1">
                            {option.participants.map((participant) => (
                              <div key={participant.id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{participant.name}</span>
                                <div className="flex items-center">
                                  {participant.status === "available" && (
                                    <div className="flex items-center text-success">
                                      <Check className="w-3 h-3 mr-1" />
                                      <span className="text-xs font-medium">Available</span>
                                    </div>
                                  )}
                                  {participant.status === "maybe" && (
                                    <div className="flex items-center text-yellow-600">
                                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                                      <span className="text-xs font-medium">Maybe</span>
                                    </div>
                                  )}
                                  {participant.status === "unavailable" && (
                                    <div className="flex items-center text-red-500">
                                      <X className="w-3 h-3 mr-1" />
                                      <span className="text-xs font-medium">Not Available</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
              <div className="flex space-x-3">
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </Button>
                <Button variant="outline" onClick={copyShareLink}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              {bestTimeSlot && (
                <Button className="bg-success hover:bg-green-600">
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Best Time
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

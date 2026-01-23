import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TimePicker({ value, onChange, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Scroll to 9:00 AM when popover opens
  useEffect(() => {
    if (open) {
      // Use a timeout to ensure the popover is fully rendered
      setTimeout(() => {
        const nineAmButton = document.querySelector('[data-time="09:00"]');
        if (nineAmButton) {
          nineAmButton.scrollIntoView({ 
            block: 'center',
            behavior: 'auto'
          });
        }
      }, 100);
    }
  }, [open]);

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${
            !value && "text-muted-foreground"
          }`}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <ScrollArea ref={scrollAreaRef} className="h-60 w-32">
          <div className="p-1">
            {timeOptions.map((time) => (
              <button
                key={time}
                data-time={time}
                onClick={() => handleTimeSelect(time)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground ${
                  value === time ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
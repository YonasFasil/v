import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getStatusConfig, getAllStatuses, type EventStatus } from "@shared/status-utils";

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasEvent = (day: number) => {
    // Mock event indicators - in real app this would check actual events
    const eventDays = [7, 12, 14, 18, 22];
    return eventDays.includes(day);
  };

  const getEventColor = (day: number) => {
    // Mock different event types with colors
    if (day === 7) return "bg-blue-500";
    if (day === 12) return "bg-green-500";
    if (day === 14) return "bg-orange-500";
    if (day === 18) return "bg-purple-500";
    if (day === 22) return "bg-blue-500";
    return "bg-blue-500";
  };

  const calendarDays = generateCalendarDays();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Event Calendar</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-xs font-medium text-slate-500 text-center">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  p-3 text-center text-sm cursor-pointer hover:bg-slate-50 transition-colors relative
                  ${day === null ? "text-slate-400" : ""}
                  ${isToday(day || 0) ? "bg-blue-600 text-white rounded-lg font-medium" : ""}
                  ${!isToday(day || 0) && day !== null ? "hover:bg-slate-100 rounded-lg" : ""}
                `}
              >
                {day}
                {day !== null && hasEvent(day) && (
                  <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${getEventColor(day)}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Status Legend */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            {getAllStatuses().slice(0, 4).map((status) => {
              const config = getStatusConfig(status.value);
              return (
                <div key={status.value} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-slate-600 truncate">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

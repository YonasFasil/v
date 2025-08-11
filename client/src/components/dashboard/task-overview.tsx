import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/contexts/dashboard-context";
import { CheckCircle, Clock, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { format, isToday, parseISO, isPast, isThisWeek } from "date-fns";

export function TaskOverview() {
  const { bookings } = useDashboardData();

  // Generate tasks from bookings and events
  const getTasks = () => {
    if (!bookings || !Array.isArray(bookings)) return [];
    
    const tasks: any[] = [];
    
    (bookings as any[]).forEach(booking => {
      if (!booking.date) return;
      
      let eventDate;
      try {
        eventDate = parseISO(booking.date);
      } catch {
        return;
      }
      
      // Pre-event tasks
      if (booking.status === 'confirmed') {
        tasks.push({
          id: `setup-${booking.id}`,
          title: `Setup for ${booking.eventName}`,
          description: `Prepare ${booking.spaceName} for ${booking.guestCount} guests`,
          dueDate: format(eventDate, 'yyyy-MM-dd'),
          priority: isToday(eventDate) ? 'high' : 'medium',
          status: isPast(eventDate) ? 'completed' : 'pending',
          type: 'setup',
          eventId: booking.id
        });
      }
      
      // Follow-up tasks
      if (booking.status === 'confirmed' && isPast(eventDate)) {
        tasks.push({
          id: `followup-${booking.id}`,
          title: `Follow up with ${booking.customerName}`,
          description: `Send thank you and feedback request`,
          dueDate: format(eventDate, 'yyyy-MM-dd'),
          priority: 'low',
          status: 'pending',
          type: 'followup',
          eventId: booking.id
        });
      }
      
      // Payment reminders
      if (booking.status === 'pending') {
        tasks.push({
          id: `payment-${booking.id}`,
          title: `Payment reminder: ${booking.eventName}`,
          description: `Contact ${booking.customerName} about outstanding payment`,
          dueDate: format(new Date(), 'yyyy-MM-dd'),
          priority: 'high',
          status: 'pending',
          type: 'payment',
          eventId: booking.id
        });
      }
    });

    return tasks
      .sort((a, b) => {
        // Sort by priority first, then by due date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder as any)[b.priority] - (priorityOrder as any)[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 8); // Show only top 8 tasks
  };

  const tasks = getTasks();
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && task.status === 'pending');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'setup': return Clock;
      case 'followup': return CheckCircle;
      case 'payment': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Task Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/tasks'}>
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pendingTasks.length}</div>
            <div className="text-xs text-blue-700">Pending Tasks</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{highPriorityTasks.length}</div>
            <div className="text-xs text-red-700">High Priority</div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks available</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/tasks'}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task, index) => {
              const TaskIcon = getTaskIcon(task.type);
              const isOverdue = isPast(parseISO(task.dueDate)) && task.status === 'pending';
              
              return (
                <div key={index} className={`p-3 rounded-lg border transition-colors ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TaskIcon className={`w-4 h-4 ${
                        isOverdue ? 'text-red-600' : 'text-slate-600'
                      }`} />
                      <h4 className="font-medium text-slate-900 text-sm">{task.title}</h4>
                    </div>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${
                      isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                    }`}>
                      Due: {format(parseISO(task.dueDate), 'MMM d')}
                      {isOverdue && ' (Overdue)'}
                    </span>
                    
                    {task.status === 'completed' && (
                      <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
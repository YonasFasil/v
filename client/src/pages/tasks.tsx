import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus, Clock, AlertTriangle, User, Calendar, MapPin, Users, LayoutGrid, Table as TableIcon } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useBookings } from "@/hooks/use-bookings";

// Helper functions for attractive date formatting
function formatAttractiveDateShort(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'EEE, MMM d');
}

function formatAttractiveDueDate(date: Date): string {
  const now = new Date();
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  
  const daysDiff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff >= 0 && daysDiff <= 7) {
    return `${format(date, 'EEEE')} at ${format(date, 'h:mm a')}`;
  }
  
  return `${format(date, 'EEE, MMM d')} at ${format(date, 'h:mm a')}`;
}

function formatAttractiveDateTime(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, 'MMMM d')} at ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'MMMM d')} at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'MMMM d')} at ${format(date, 'h:mm a')}`;
  }
  return `${format(date, 'EEEE, MMMM d, yyyy')} at ${format(date, 'h:mm a')}`;
}

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });
  const { data: bookings } = useBookings();
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({ 
    queryKey: ["/api/tenant/users"],
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
  
  // Debug log to see what users data looks like
  console.log("Users data:", users, "Loading:", usersLoading, "Error:", usersError);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTaskSchema.omit({ tenantId: true })),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: null,
      bookingId: "none",
      assignedTo: "none",
    }
  });

  const onSubmit = async (data: any) => {
    try {
      // Convert "none" to null for optional fields
      const taskData = {
        ...data,
        bookingId: data.bookingId === "none" ? null : data.bookingId,
        assignedTo: data.assignedTo === "none" ? null : data.assignedTo,
        dueDate: data.dueDate || null
      };
      
      await apiRequest("POST", "/api/tasks", taskData);
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowCreateForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error("Task creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      console.log("Marking task as complete:", taskId);
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, { status: "completed" });
      console.log("Update response:", response);
      await queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task marked as completed",
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    // Task statuses use different colors than event statuses
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "urgent" || priority === "high") {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  const getBookingForTask = (bookingId: string) => {
    if (!bookings || !bookingId) return null;
    return bookings.find((booking: any) => booking.id === bookingId);
  };

  const getUserForTask = (userId: string) => {
    if (!users || !userId) return null;
    return users.find((user: any) => user.id === userId);
  };

  // Filter tasks based on selected event
  const filteredTasks = tasks?.filter((task: any) => {
    if (selectedEventFilter === "all") return true;
    if (selectedEventFilter === "no-event") return !task.bookingId;
    return task.bookingId === selectedEventFilter;
  }) || [];

  // Calculate metrics based on filtered tasks
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t: any) => t.status === "completed").length;
  const pendingTasks = filteredTasks.filter((t: any) => t.status === "pending").length;
  const overdueTasks = filteredTasks.filter((t: any) => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length;

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Tasks & Team" subtitle="Manage team tasks and collaboration" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Tasks & Team" 
          subtitle="Manage team tasks and collaboration"
          action={
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.log("Form validation errors:", errors);
                  })} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter task title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Task description..." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bookingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Event (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an event..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No event</SelectItem>
                              {bookings?.map((booking: any) => (
                                <SelectItem key={booking.id} value={booking.id}>
                                  {booking.eventName} - {format(new Date(booking.eventDate), "MMM dd, yyyy")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {usersLoading ? (
                                <SelectItem value="loading" disabled>Loading users...</SelectItem>
                              ) : users?.length > 0 ? users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.role?.replace('_', ' ')})
                                </SelectItem>
                              )) : (
                                <SelectItem value="no-users" disabled>No users available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              value={field.value ? (
                                field.value instanceof Date 
                                  ? field.value.toISOString().slice(0, 16)
                                  : typeof field.value === 'string' && field.value.includes('T')
                                    ? field.value.slice(0, 16)
                                    : field.value
                              ) : ""}
                              onChange={(e) => {
                                // Convert the datetime-local string to a Date object immediately
                                field.onChange(e.target.value ? new Date(e.target.value) : null);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => console.log("Create Task button clicked")}
                      >
                        Create Task
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filter Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label htmlFor="event-filter" className="text-sm font-medium text-gray-700">Filter by Event:</Label>
                <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="no-event">Tasks without Event</SelectItem>
                    {bookings?.map((booking: any) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.eventName} - {format(new Date(booking.eventDate), "MMM dd, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-gray-700">View:</Label>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className="rounded-r-none border-r"
                  >
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="rounded-l-none"
                  >
                    <TableIcon className="w-4 h-4 mr-1" />
                    Table
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Task Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-3xl font-bold text-gray-900">{completedTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                    <p className="text-3xl font-bold text-gray-900">{overdueTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks List */}
          {!filteredTasks || filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Create your first task to get started with team collaboration.</p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                Create First Task
              </Button>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task: any) => {
                const relatedBooking = getBookingForTask(task.bookingId);
                const assignedUser = getUserForTask(task.assignedTo);
                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">{task.title}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {relatedBooking && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <div className="flex items-center text-sm text-blue-800 font-medium mb-1">
                            <Calendar className="w-4 h-4 mr-2" />
                            Related Event
                          </div>
                          <p className="text-sm font-semibold text-blue-900">{relatedBooking.eventName}</p>
                          <div className="flex items-center text-xs text-blue-700 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatAttractiveDateShort(new Date(relatedBooking.eventDate))}
                          </div>
                          <div className="flex items-center text-xs text-blue-700">
                            <Users className="w-3 h-3 mr-1" />
                            {relatedBooking.guestCount} guests
                          </div>
                        </div>
                      )}

                      {assignedUser && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <div className="flex items-center text-sm text-green-800 font-medium mb-1">
                            <User className="w-4 h-4 mr-2" />
                            Assigned To
                          </div>
                          <p className="text-sm font-semibold text-green-900">{assignedUser.name}</p>
                          <p className="text-xs text-green-700">{assignedUser.role?.replace('_', ' ')}</p>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className={`flex items-center text-sm ${
                          new Date(task.dueDate) < new Date() && task.status !== "completed"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}>
                          <Clock className="w-4 h-4 mr-2" />
                          Due {formatAttractiveDueDate(new Date(task.dueDate))}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Created {formatAttractiveDateShort(new Date(task.createdAt))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(task)}>
                          View Details
                        </Button>
                        {task.status !== "completed" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkComplete(task.id)}>
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Related Event</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task: any) => {
                    const relatedBooking = getBookingForTask(task.bookingId);
                    const assignedUser = getUserForTask(task.assignedTo);
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {relatedBooking ? (
                            <div className="text-sm">
                              <p className="font-medium">{relatedBooking.eventName}</p>
                              <p className="text-gray-600">
                                {formatAttractiveDateShort(new Date(relatedBooking.eventDate))}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">No event</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignedUser ? (
                            <div className="text-sm">
                              <p className="font-medium">{assignedUser.name}</p>
                              <p className="text-gray-600">{assignedUser.role?.replace('_', ' ')}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1 w-fit`}>
                            {getPriorityIcon(task.priority)}
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <div className={`text-sm ${
                              new Date(task.dueDate) < new Date() && task.status !== "completed"
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}>
                              {formatAttractiveDueDate(new Date(task.dueDate))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatAttractiveDateShort(new Date(task.createdAt))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(task)}>
                              View
                            </Button>
                            {task.status !== "completed" && (
                              <Button size="sm" variant="outline" onClick={() => handleMarkComplete(task.id)}>
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </main>
      </div>
      
      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Task Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-gray-600 mb-4">{selectedTask.description}</p>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} flex items-center gap-1`}>
                    {getPriorityIcon(selectedTask.priority)}
                    {selectedTask.priority}
                  </Badge>
                </div>
              </div>

              {/* Assigned User */}
              {(() => {
                const assignedUser = getUserForTask(selectedTask.assignedTo);
                return assignedUser ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Assigned To
                    </h4>
                    <div className="space-y-1">
                      <p className="font-medium text-green-900">{assignedUser.name}</p>
                      <p className="text-sm text-green-700">{assignedUser.role?.replace('_', ' ')}</p>
                      <p className="text-sm text-green-700">{assignedUser.email}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Related Event */}
              {(() => {
                const relatedBooking = getBookingForTask(selectedTask.bookingId);
                return relatedBooking ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Related Event
                    </h4>
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">{relatedBooking.eventName}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatAttractiveDateTime(new Date(relatedBooking.eventDate))}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {relatedBooking.guestCount} guests
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {relatedBooking.startTime} - {relatedBooking.endTime}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {relatedBooking.setupStyle || 'Standard'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Due Date</h4>
                  {selectedTask.dueDate ? (
                    <div className={`${
                      new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== "completed"
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}>
                      <p>{formatAttractiveDateTime(new Date(selectedTask.dueDate))}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No due date set</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Created</h4>
                  <div className="text-gray-900">
                    <p>{formatAttractiveDateTime(new Date(selectedTask.createdAt))}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                {selectedTask.status !== "completed" && (
                  <Button 
                    onClick={() => {
                      handleMarkComplete(selectedTask.id);
                      setShowDetailsModal(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

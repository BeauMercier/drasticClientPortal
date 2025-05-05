'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { getUserProfile, getDesignerTasks } from '@/lib/api/client-api';
import { DesignerTask } from '@/lib/types/task';

export default function DesignerCalendarPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DesignerTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user profile
        const userProfile = await getUserProfile();
        
        // Check role
        if (userProfile?.role !== 'designer') {
          router.push('/dashboard');
          return;
        }

        // Fetch designer's tasks
        const designerTasks = await getDesignerTasks(userProfile.id);
        setTasks(designerTasks);
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setError('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendarData();
  }, [router]);

  // Get tasks for selected date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Get tasks for selected month
  const getTasksForMonth = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getMonth() === date.getMonth() && 
             taskDate.getFullYear() === date.getFullYear();
    });
  };

  // Get badge color based on task priority
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const monthTasks = selectedDate ? getTasksForMonth(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Designer Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Component */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasTask: (date) => getTasksForDate(date).length > 0,
                }}
                modifiersStyles={{
                  hasTask: {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '50%',
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Task List for Selected Date */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateTasks.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/designer/tasks/${task.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          {task.project_id && (
                            <p className="text-sm text-gray-500">
                              Project ID: {task.project_id}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No tasks scheduled for this date
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{monthTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High Priority:</span>
                  <span className="font-medium text-red-600">
                    {monthTasks.filter(t => t.priority === 'high').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medium Priority:</span>
                  <span className="font-medium text-yellow-600">
                    {monthTasks.filter(t => t.priority === 'medium').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Priority:</span>
                  <span className="font-medium text-green-600">
                    {monthTasks.filter(t => t.priority === 'low').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
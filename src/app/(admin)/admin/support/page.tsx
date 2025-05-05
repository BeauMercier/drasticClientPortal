'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, MessageSquare, AlertCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  assignedTo?: string;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated API call
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample ticket data
        const sampleTickets: SupportTicket[] = [
          {
            id: '1',
            subject: 'Cannot access my project files',
            description: 'When I try to open my project files, I get an error message saying I don\'t have permission.',
            status: 'open',
            priority: 'high',
            createdBy: 'john.doe@example.com',
            createdAt: '2023-03-18T10:30:00Z',
            lastUpdated: '2023-03-18T10:30:00Z'
          },
          {
            id: '2',
            subject: 'Billing question about last invoice',
            description: 'I have a question about the charges on my last invoice. There seems to be an extra fee I don\'t recognize.',
            status: 'in_progress',
            priority: 'medium',
            createdBy: 'sarah.smith@company.com',
            createdAt: '2023-03-15T14:45:00Z',
            lastUpdated: '2023-03-17T09:20:00Z',
            assignedTo: 'Admin User'
          },
          {
            id: '3',
            subject: 'Need to update company information',
            description: 'We\'ve moved to a new address and I need to update our company information in the system.',
            status: 'resolved',
            priority: 'low',
            createdBy: 'mike.johnson@business.org',
            createdAt: '2023-03-10T11:15:00Z',
            lastUpdated: '2023-03-12T16:30:00Z',
            assignedTo: 'Admin User'
          },
          {
            id: '4',
            subject: 'Website design revisions needed urgently',
            description: 'Our CEO has requested urgent changes to the homepage design before our product launch tomorrow.',
            status: 'open',
            priority: 'urgent',
            createdBy: 'marketing@startup.io',
            createdAt: '2023-03-19T08:05:00Z',
            lastUpdated: '2023-03-19T08:05:00Z'
          },
          {
            id: '5',
            subject: 'Login issue with designer account',
            description: 'Our designer cannot log in to their account. We\'ve tried resetting the password but still having issues.',
            status: 'in_progress',
            priority: 'high',
            createdBy: 'tech@designfirm.co',
            createdAt: '2023-03-16T13:25:00Z',
            lastUpdated: '2023-03-18T15:10:00Z',
            assignedTo: 'Support Team'
          }
        ];
        
        setTickets(sampleTickets);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
        setError('Failed to load support tickets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'in_progress':
        return 'text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'resolved':
        return 'text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'closed':
        return 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium capitalize';
      default:
        return 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium capitalize';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'high':
        return 'text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-medium capitalize';
      case 'low':
        return 'text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium capitalize';
      default:
        return 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium capitalize';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return diffDays + ' days ago';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const filteredTickets = searchTerm
    ? tickets.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.priority.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tickets;
    
  const openTickets = filteredTickets.filter(ticket => ticket.status === 'open');
  const inProgressTickets = filteredTickets.filter(ticket => ticket.status === 'in_progress');
  const resolvedTickets = filteredTickets.filter(ticket => 
    ticket.status === 'resolved' || ticket.status === 'closed'
  );

  const urgentTickets = tickets.filter(ticket => ticket.priority === 'urgent' || ticket.priority === 'high');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 rounded-lg my-6">
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Support Tickets</h2>
        <p>{error}</p>
        <p className="mt-4">Please check your permissions or try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              All support requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting initial response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Being worked on
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              High priority issues
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <TicketsList 
            tickets={filteredTickets}
            getStatusClass={getStatusClass}
            getPriorityClass={getPriorityClass}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="open" className="space-y-4">
          <TicketsList 
            tickets={openTickets}
            getStatusClass={getStatusClass}
            getPriorityClass={getPriorityClass}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="in_progress" className="space-y-4">
          <TicketsList 
            tickets={inProgressTickets}
            getStatusClass={getStatusClass}
            getPriorityClass={getPriorityClass}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="resolved" className="space-y-4">
          <TicketsList 
            tickets={resolvedTickets}
            getStatusClass={getStatusClass}
            getPriorityClass={getPriorityClass}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TicketsListProps {
  tickets: SupportTicket[];
  getStatusClass: (status: string) => string;
  getPriorityClass: (priority: string) => string;
  formatDate: (dateString: string) => string;
}

function TicketsList({ tickets, getStatusClass, getPriorityClass, formatDate }: TicketsListProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {ticket.subject}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Submitted by {ticket.createdBy} • {formatDate(ticket.createdAt)}
                </div>
              </div>
              <div className="flex space-x-2">
                <span className={getStatusClass(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={getPriorityClass(ticket.priority)}>
                  {ticket.priority}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm mb-4">{ticket.description}</p>
            
            <div className="flex justify-between items-center text-sm">
              <div className="text-muted-foreground">
                {ticket.assignedTo 
                  ? `Assigned to: ${ticket.assignedTo}`
                  : 'Unassigned'
                }
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Assign
                </Button>
                <Button size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
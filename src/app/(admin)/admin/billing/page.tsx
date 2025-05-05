'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, PlusCircle, FileText, Download } from 'lucide-react';

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  dueDate: string;
  invoiceNumber: string;
}

export default function AdminBilling() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulated API call
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample invoice data
        const sampleInvoices: Invoice[] = [
          {
            id: '1',
            client: 'Acme Corporation',
            amount: 1200.00,
            status: 'paid',
            date: '2023-03-01',
            dueDate: '2023-03-15',
            invoiceNumber: 'INV-2023-001'
          },
          {
            id: '2',
            client: 'TechStart Inc',
            amount: 850.50,
            status: 'pending',
            date: '2023-03-10',
            dueDate: '2023-03-25',
            invoiceNumber: 'INV-2023-002'
          },
          {
            id: '3',
            client: 'Fashion Brand',
            amount: 2500.00,
            status: 'overdue',
            date: '2023-02-15',
            dueDate: '2023-03-01',
            invoiceNumber: 'INV-2023-003'
          },
          {
            id: '4',
            client: 'Marketing Pros',
            amount: 1750.00,
            status: 'paid',
            date: '2023-02-20',
            dueDate: '2023-03-06',
            invoiceNumber: 'INV-2023-004'
          },
          {
            id: '5',
            client: 'Nonprofit Org',
            amount: 500.00,
            status: 'pending',
            date: '2023-03-18',
            dueDate: '2023-04-01',
            invoiceNumber: 'INV-2023-005'
          }
        ];
        
        setInvoices(sampleInvoices);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-medium';
      case 'pending':
        return 'text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs font-medium';
      case 'overdue':
        return 'text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium';
      default:
        return 'text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-medium';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const filteredInvoices = searchTerm
    ? invoices.filter(invoice => 
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices;
    
  const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid');
  const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'pending');
  const overdueInvoices = filteredInvoices.filter(invoice => invoice.status === 'overdue');

  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingRevenue = invoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

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
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Billing Data</h2>
        <p>{error}</p>
        <p className="mt-4">Please check your permissions or try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex justify-end items-center">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} total invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices.length + overdueInvoices.length} unpaid invoices
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <InvoiceList
            invoices={filteredInvoices}
            getStatusClass={getStatusClass}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="paid">
          <InvoiceList
            invoices={paidInvoices}
            getStatusClass={getStatusClass}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <InvoiceList
            invoices={pendingInvoices}
            getStatusClass={getStatusClass}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>
        
        <TabsContent value="overdue">
          <InvoiceList
            invoices={overdueInvoices}
            getStatusClass={getStatusClass}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface InvoiceListProps {
  invoices: Invoice[];
  getStatusClass: (status: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

function InvoiceList({ invoices, getStatusClass, formatCurrency, formatDate }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium text-muted-foreground">Invoice #</th>
            <th className="p-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="p-3 text-left font-medium text-muted-foreground">Amount</th>
            <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="p-3 text-left font-medium text-muted-foreground">Due Date</th>
            <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b">
              <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
              <td className="p-3">{invoice.client}</td>
              <td className="p-3">{formatCurrency(invoice.amount)}</td>
              <td className="p-3">{formatDate(invoice.date)}</td>
              <td className="p-3">{formatDate(invoice.dueDate)}</td>
              <td className="p-3">
                <span className={getStatusClass(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td className="p-3 text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm">View</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
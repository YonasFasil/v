import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function Payments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "failed": return <AlertCircle className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "deposit": return "text-blue-600";
      case "final": return "text-green-600";
      case "refund": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  // Calculate metrics
  const totalRevenue = payments?.reduce((sum: number, payment: any) => 
    payment.status === "completed" ? sum + parseFloat(payment.amount) : sum, 0) || 0;
  
  const pendingPayments = payments?.filter((p: any) => p.status === "pending").length || 0;
  const completedPayments = payments?.filter((p: any) => p.status === "completed").length || 0;

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Payments" subtitle="Track and manage all payments" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
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
          title="Payments" 
          subtitle="Track and manage all payments"
          action={
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Process Payment
            </Button>
          }
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Payment Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600 font-medium">+8% from last month</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Payments</p>
                    <p className="text-3xl font-bold text-gray-900">{completedPayments}</p>
                    <p className="text-sm text-blue-600 font-medium">This month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingPayments}</p>
                    <p className="text-sm text-orange-600 font-medium">Awaiting processing</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {!payments || payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-600 mb-6">Payment transactions will appear here once processed.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Process First Payment
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium text-gray-600">Transaction ID</th>
                        <th className="text-left py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 font-medium text-gray-600">Type</th>
                        <th className="text-left py-3 font-medium text-gray-600">Method</th>
                        <th className="text-left py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment: any) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                          <td className="py-4">
                            <div className="font-mono text-sm">
                              {payment.transactionId || payment.id.slice(-8)}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="font-semibold text-lg">
                              ${parseFloat(payment.amount).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`capitalize ${getPaymentTypeColor(payment.paymentType)}`}>
                              {payment.paymentType}
                            </span>
                          </td>
                          <td className="py-4 capitalize">{payment.paymentMethod.replace('_', ' ')}</td>
                          <td className="py-4">
                            <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="py-4">
                            {payment.processedAt 
                              ? format(new Date(payment.processedAt), "MMM dd, yyyy")
                              : format(new Date(payment.createdAt), "MMM dd, yyyy")
                            }
                          </td>
                          <td className="py-4">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

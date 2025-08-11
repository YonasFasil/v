import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  User,
  AlertTriangle 
} from "lucide-react";

export default function ApprovalCenter() {
  const { toast } = useToast();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Fetch pending approvals
  const { data: pendingApprovals = [], isLoading: loadingPending } = useQuery({
    queryKey: ["/api/approvals/pending"],
    retry: false,
  });

  // Fetch approval history
  const { data: approvalHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["/api/tenant/approval-history"],
    retry: false,
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/approvals/${data.id}/approve`, {
        comments: data.comments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/approval-history"] });
      setSelectedApproval(null);
      setActionType(null);
      toast({
        title: "Success",
        description: "Request approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/approvals/${data.id}/reject`, {
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/approval-history"] });
      setSelectedApproval(null);
      setActionType(null);
      toast({
        title: "Success",
        description: "Request rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprovalAction = (formData: FormData) => {
    if (!selectedApproval) return;

    if (actionType === 'approve') {
      approveMutation.mutate({
        id: selectedApproval.id,
        comments: formData.get("comments") as string,
      });
    } else if (actionType === 'reject') {
      rejectMutation.mutate({
        id: selectedApproval.id,
        reason: formData.get("reason") as string,
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'apply_discount': return <DollarSign className="w-4 h-4" />;
      case 'process_refund': return <DollarSign className="w-4 h-4" />;
      case 'cancel_booking': return <XCircle className="w-4 h-4" />;
      case 'update_rates': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loadingPending) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
          <p className="text-gray-600 mt-1">Review and manage approval requests</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingApprovals.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvalHistory.filter((a: any) => 
                    a.status === 'approved' && 
                    new Date(a.updatedAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected Today</p>
                <p className="text-2xl font-bold text-red-600">
                  {approvalHistory.filter((a: any) => 
                    a.status === 'rejected' && 
                    new Date(a.updatedAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {pendingApprovals.filter((a: any) => 
                    a.action === 'process_refund' || a.reason?.includes('urgent')
                  ).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Management */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Approval History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No pending approval requests at this time.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval: any) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(approval.action)}
                            <div>
                              <p className="font-medium capitalize">
                                {approval.action.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-gray-500">
                                ID: {approval.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{approval.requesterName || 'User'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {approval.resourceId.slice(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate" title={approval.reason}>
                            {approval.reason}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            approval.action === 'process_refund' ? 'destructive' : 'secondary'
                          }>
                            {approval.action === 'process_refund' ? 'High' : 'Normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(approval.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApproval(approval);
                                    setActionType('approve');
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium">{approval.reason}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Requested by: {approval.requesterName || 'User'}
                                    </p>
                                  </div>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    handleApprovalAction(formData);
                                  }}>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="comments">Approval Comments (Optional)</Label>
                                        <Textarea 
                                          name="comments" 
                                          placeholder="Add any comments about this approval..."
                                        />
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline">
                                          Cancel
                                        </Button>
                                        <Button type="submit" disabled={approveMutation.isPending}>
                                          {approveMutation.isPending ? "Approving..." : "Approve Request"}
                                        </Button>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedApproval(approval);
                                    setActionType('reject');
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium">{approval.reason}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Requested by: {approval.requesterName || 'User'}
                                    </p>
                                  </div>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    handleApprovalAction(formData);
                                  }}>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="reason">Rejection Reason *</Label>
                                        <Textarea 
                                          name="reason" 
                                          required
                                          placeholder="Provide a reason for rejecting this request..."
                                        />
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline">
                                          Cancel
                                        </Button>
                                        <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                                          {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                                        </Button>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved/Rejected By</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalHistory.slice(0, 50).map((approval: any) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(approval.action)}
                          <div>
                            <p className="font-medium capitalize">
                              {approval.action.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {approval.reason}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{approval.requesterName || 'User'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(approval.status) as any}>
                          {approval.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{approval.approverName || 'System'}</TableCell>
                      <TableCell>
                        {approval.comments || approval.rejectionReason || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(approval.updatedAt || approval.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
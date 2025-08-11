import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Activity, 
  User, 
  Shield, 
  Database,
  Search,
  Filter,
  Download 
} from "lucide-react";

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["/api/tenant/audit-logs", limit],
    retry: false,
  });

  // Filter logs based on search and filters
  const filteredLogs = auditLogs.filter((log: any) => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resource === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'read': return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'update': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'delete': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'approve': return <div className="w-2 h-2 bg-green-600 rounded-full" />;
      case 'reject': return <div className="w-2 h-2 bg-red-600 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'read': return 'secondary';
      case 'update': return 'outline';
      case 'delete': return 'destructive';
      case 'approve': return 'default';
      case 'reject': return 'destructive';
      default: return 'secondary';
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP Address'],
      ...filteredLogs.map((log: any) => [
        new Date(log.createdAt).toISOString(),
        log.userEmail || log.userId,
        log.action,
        log.resource,
        log.details || '',
        log.ipAddress || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities and user actions</p>
        </div>
        
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditLogs.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(auditLogs.map((log: any) => log.userId)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Actions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {auditLogs.filter((log: any) => ['approve', 'reject', 'delete'].includes(log.action)).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Activities</p>
                <p className="text-2xl font-bold text-orange-600">
                  {auditLogs.filter((log: any) => 
                    new Date(log.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Database className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resource</Label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="venues">Venues</SelectItem>
                  <SelectItem value="bookings">Bookings</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="proposals">Proposals</SelectItem>
                  <SelectItem value="permissions">Permissions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Limit</Label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 entries</SelectItem>
                  <SelectItem value="50">50 entries</SelectItem>
                  <SelectItem value="100">100 entries</SelectItem>
                  <SelectItem value="250">250 entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Activity Log ({filteredLogs.length} entries)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No audit logs match your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                        <p className="text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{log.userEmail || 'System'}</p>
                          <p className="text-sm text-gray-500">{log.userId?.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <Badge variant={getActionColor(log.action) as any}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.resource}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate" title={log.details}>
                        {log.details || 'No additional details'}
                      </p>
                      {log.resourceId && (
                        <p className="text-sm text-gray-500">
                          ID: {log.resourceId.slice(0, 8)}...
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.ipAddress || 'Unknown'}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
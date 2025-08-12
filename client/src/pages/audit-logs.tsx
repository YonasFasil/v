import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, FileText, AlertTriangle, Info, Shield, Zap, Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  createdAt: string;
}

interface AuditLogStats {
  totalLogs: number;
  recentActions: number;
  errorCount: number;
  topUsers: Array<{ userId: string; count: number; userName?: string }>;
  topActions: Array<{ action: string; count: number }>;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    resourceType: "",
    severity: "",
    startDate: "",
    endDate: "",
    limit: 50,
    offset: 0
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Fetch audit logs
  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs', filters],
    retry: false,
  });

  // Fetch audit log stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AuditLogStats>({
    queryKey: ['/api/audit-logs/stats'],
    retry: false,
  });

  const handleFilterChange = (key: string, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: filterValue, offset: 0 }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, action: term, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      resourceType: "",
      severity: "",
      startDate: "",
      endDate: "",
      limit: 50,
      offset: 0
    });
    setSearchTerm("");
  };

  const refreshData = () => {
    refetchLogs();
    refetchStats();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'destructive';
      case 'WARNING':
        return 'outline';
      case 'INFO':
      default:
        return 'secondary';
    }
  };

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    // Extract browser name from user agent
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other Browser';
  };

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'booking':
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'user':
      case 'customer':
        return <User className="w-4 h-4 text-green-500" />;
      case 'venue':
      case 'space':
        return <Shield className="w-4 h-4 text-orange-500" />;
      case 'proposal':
      case 'communication':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <Zap className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor all system activities and user actions</p>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLogs}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent (24h)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentActions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.errorCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topUsers.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-actions"
              />
            </div>
            
            <Select value={filters.resourceType || "all"} onValueChange={(value) => handleFilterChange('resourceType', value)}>
              <SelectTrigger data-testid="select-resource-type">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="space">Space</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.severity || "all"} onValueChange={(value) => handleFilterChange('severity', value)}>
              <SelectTrigger data-testid="select-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              placeholder="Start Date"
              data-testid="input-start-date"
            />

            <Input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              placeholder="End Date"
              data-testid="input-end-date"
            />

            <Button onClick={clearFilters} variant="outline" data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Activity Log</h3>
          
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(log.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getResourceTypeIcon(log.resourceType)}
                          <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                        </div>
                        
                        <Badge variant={getSeverityBadgeVariant(log.severity) as any}>
                          {log.severity}
                        </Badge>
                        
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Resource: <span className="font-medium">{log.resourceType}</span>
                        {log.resourceId && <span> • ID: {log.resourceId}</span>}
                      </div>
                      
                      {log.details && (
                        <div className="text-sm bg-gray-100 dark:bg-gray-700 rounded p-2 mb-2">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {log.userId && (
                          <span>
                            <User className="w-3 h-3 inline mr-1" />
                            User: {log.userId}
                          </span>
                        )}
                        
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                        
                        <span>
                          Browser: {formatUserAgent(log.userAgent)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {logs.length === filters.limit && (
            <div className="text-center pt-4">
              <Button 
                onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                variant="outline"
                data-testid="button-load-more"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Top Actions */}
      {stats && stats.topActions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Actions</h3>
            <div className="space-y-3">
              {stats.topActions.slice(0, 8).map((item, index) => (
                <div key={item.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{item.action}</span>
                  </div>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Users</h3>
            <div className="space-y-3">
              {stats.topUsers.slice(0, 8).map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.userName || user.userId}
                    </span>
                  </div>
                  <Badge variant="outline">{user.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, Search, User, Database, Edit, Plus, Trash2 } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          actor:actor_user_id (
            handle,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesTable = tableFilter === 'all' || log.target_table === tableFilter;
    
    return matchesSearch && matchesAction && matchesTable;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <Plus className="h-3 w-3 mr-1" />;
      case 'UPDATE': return <Edit className="h-3 w-3 mr-1" />;
      case 'DELETE': return <Trash2 className="h-3 w-3 mr-1" />;
      default: return <Database className="h-3 w-3 mr-1" />;
    }
  };

  // Get unique tables and actions for filters
  const uniqueTables = [...new Set(auditLogs?.map(log => log.target_table).filter(Boolean))];
  const uniqueActions = [...new Set(auditLogs?.map(log => log.action).filter(Boolean))];

  if (isLoading) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track important system actions and changes (Last 100 entries)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {uniqueTables.map(table => (
                  <SelectItem key={table} value={table}>{table}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs List */}
          <div className="space-y-3">
            {filteredLogs?.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  {log.actor?.handle ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Database className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionColor(log.action)}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </Badge>
                    <Badge variant="outline">{log.target_table}</Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {log.actor?.handle || 'System'}
                    </span>
                    {log.actor?.email && (
                      <span className="text-xs text-muted-foreground">
                        ({log.actor.email})
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      performed {log.action.toLowerCase()} on {log.target_table}
                    </span>
                    {log.target_id && (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        ID: {log.target_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-xs">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {(!filteredLogs || filteredLogs.length === 0) && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Audit Logs Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm || actionFilter !== 'all' || tableFilter !== 'all' 
                    ? "No audit logs match your current filters. Try adjusting your search criteria."
                    : "The audit logging system is active and will start tracking actions as users interact with the platform."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

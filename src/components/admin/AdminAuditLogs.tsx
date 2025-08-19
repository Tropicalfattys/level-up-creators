
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Clock } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users (
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

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_table?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.users?.handle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action?.includes(actionFilter);
    
    return matchesSearch && matchesAction;
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Logs
        </CardTitle>
        <CardDescription>
          Track important system actions and changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="creator">Creator Actions</SelectItem>
              <SelectItem value="booking">Booking Actions</SelectItem>
              <SelectItem value="dispute">Dispute Actions</SelectItem>
              <SelectItem value="user">User Actions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <div className="space-y-2">
          {filteredLogs?.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {log.action}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    on {log.target_table}
                  </span>
                  {log.users?.handle && (
                    <span className="text-sm">
                      by {log.users.handle}
                    </span>
                  )}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Metadata: {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          
          {(!filteredLogs || filteredLogs.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

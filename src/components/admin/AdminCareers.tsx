
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Plus, Users, FileText, Eye, ExternalLink, Mail, Phone, Github, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const AdminCareers = () => {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch job applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['job-applications'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch job postings
  const { data: jobPostings = [], isLoading: postingsLoading } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('job_postings')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Update application status
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('job_applications')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Application status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateApplicationStatus.mutate({ id: applicationId, status: newStatus });
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const activeJobs = jobPostings.filter(job => job.active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Careers Management</h2>
          <p className="text-muted-foreground">
            Manage job postings, applications, and career-related content.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Active Jobs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{activeJobs.length}</div>
            <p className="text-sm text-muted-foreground">Currently posted positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Applications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{pendingApplications.length}</div>
            <p className="text-sm text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Total Applications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{applications.length}</div>
            <p className="text-sm text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>
            Review and manage incoming job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applicationsLoading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No applications yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.name}</TableCell>
                    <TableCell>{application.email}</TableCell>
                    <TableCell>{format(new Date(application.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplication(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={application.status}
                          onValueChange={(value) => handleStatusChange(application.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Details Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review the complete application information
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedApplication.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{selectedApplication.email}</p>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`mailto:${selectedApplication.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {selectedApplication.phone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{selectedApplication.phone}</p>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`tel:${selectedApplication.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Applied Date</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedApplication.created_at), 'MMMM dd, yyyy at h:mm a')}
                </p>
              </div>

              {selectedApplication.resume_url && (
                <div>
                  <Label className="text-sm font-medium">Resume/CV</Label>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Resume
                    </a>
                  </Button>
                </div>
              )}

              {selectedApplication.portfolio_url && (
                <div>
                  <Label className="text-sm font-medium">Portfolio</Label>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApplication.portfolio_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      View Portfolio
                    </a>
                  </Button>
                </div>
              )}

              {selectedApplication.github_url && (
                <div>
                  <Label className="text-sm font-medium">GitHub</Label>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApplication.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      View GitHub
                    </a>
                  </Button>
                </div>
              )}

              {selectedApplication.social_links && Object.keys(selectedApplication.social_links).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Social Links</Label>
                  <div className="space-y-2">
                    {Object.entries(selectedApplication.social_links).map(([platform, url]) => 
                      url && (
                        <div key={platform} className="flex items-center gap-2">
                          <span className="text-sm capitalize">{platform}:</span>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={url as string} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {url as string}
                            </a>
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedApplication.cover_letter && (
                <div>
                  <Label className="text-sm font-medium">Cover Letter</Label>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Label className="text-sm font-medium">Status:</Label>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedApplication.id, value);
                    setSelectedApplication({...selectedApplication, status: value});
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

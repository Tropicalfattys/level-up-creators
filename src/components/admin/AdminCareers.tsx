
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { Switch } from '@/components/ui/switch';
import { Briefcase, Plus, Users, FileText, Eye, ExternalLink, Mail, Phone, Github, Globe, Save, RefreshCw, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface JobPosting {
  id: string;
  title: string;
  role_overview: string;
  responsibilities: string[];
  qualifications: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const AdminCareers = () => {
  const isMobile = useIsMobile();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [editingJobs, setEditingJobs] = useState<Record<string, Partial<JobPosting>>>({});
  const [newJobData, setNewJobData] = useState<Partial<JobPosting>>({
    title: '',
    role_overview: '',
    responsibilities: [''],
    qualifications: [''],
    active: true,
    sort_order: 0
  });
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
    queryFn: async (): Promise<JobPosting[]> => {
      const { data, error } = await (supabase as any)
        .from('job_postings')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Convert JSON arrays to string arrays safely
      const convertedData = (data || []).map(job => ({
        ...job,
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities as string[] : [],
        qualifications: Array.isArray(job.qualifications) ? job.qualifications as string[] : []
      }));
      
      return convertedData;
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

  // Update job posting
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<JobPosting> }) => {
      const { error } = await (supabase as any)
        .from('job_postings')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast.success('Job posting updated successfully!');
      setEditingJobs({});
    },
    onError: (error) => {
      console.error('Error updating job posting:', error);
      toast.error('Failed to update job posting');
    }
  });

  // Create new job posting
  const createJobMutation = useMutation({
    mutationFn: async (jobData: Partial<JobPosting>) => {
      const { error } = await (supabase as any)
        .from('job_postings')
        .insert([jobData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast.success('Job posting created successfully!');
      setShowNewJobModal(false);
      setNewJobData({
        title: '',
        role_overview: '',
        responsibilities: [''],
        qualifications: [''],
        active: true,
        sort_order: 0
      });
    },
    onError: (error) => {
      console.error('Error creating job posting:', error);
      toast.error('Failed to create job posting');
    }
  });

  // Delete job posting (soft delete)
  const deleteJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('job_postings')
        .update({ active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast.success('Job posting deactivated successfully');
    },
    onError: (error) => {
      console.error('Error deactivating job posting:', error);
      toast.error('Failed to deactivate job posting');
    }
  });

  const handleJobInputChange = (jobId: string, field: keyof JobPosting, value: any) => {
    setEditingJobs(prev => ({
      ...prev,
      [jobId]: {
        ...prev[jobId],
        [field]: value
      }
    }));
  };

  const handleJobArrayChange = (jobId: string, field: 'responsibilities' | 'qualifications', index: number, value: string) => {
    const currentJob = jobPostings?.find(j => j.id === jobId);
    const currentArray = getCurrentJobValue({ id: jobId } as JobPosting, field) as string[] || currentJob?.[field] || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    
    handleJobInputChange(jobId, field, updatedArray);
  };

  const addJobArrayItem = (jobId: string, field: 'responsibilities' | 'qualifications') => {
    const currentJob = jobPostings?.find(j => j.id === jobId);
    const currentArray = getCurrentJobValue({ id: jobId } as JobPosting, field) as string[] || currentJob?.[field] || [];
    const updatedArray = [...currentArray, ''];
    
    handleJobInputChange(jobId, field, updatedArray);
  };

  const removeJobArrayItem = (jobId: string, field: 'responsibilities' | 'qualifications', index: number) => {
    const currentJob = jobPostings?.find(j => j.id === jobId);
    const currentArray = getCurrentJobValue({ id: jobId } as JobPosting, field) as string[] || currentJob?.[field] || [];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    
    handleJobInputChange(jobId, field, updatedArray);
  };

  const handleSaveJob = (job: JobPosting) => {
    const updates = editingJobs[job.id];
    if (!updates || Object.keys(updates).length === 0) {
      toast.error('No changes to save');
      return;
    }

    updateJobMutation.mutate({ id: job.id, updates });
  };

  const hasJobChanges = (jobId: string) => {
    return editingJobs[jobId] && Object.keys(editingJobs[jobId]).length > 0;
  };

  const getCurrentJobValue = (job: JobPosting, field: keyof JobPosting) => {
    return editingJobs[job.id]?.[field] !== undefined 
      ? editingJobs[job.id][field] 
      : job[field];
  };

  const handleNewJobArrayChange = (field: 'responsibilities' | 'qualifications', index: number, value: string) => {
    const currentArray = newJobData[field] || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    
    setNewJobData(prev => ({
      ...prev,
      [field]: updatedArray
    }));
  };

  const addNewJobArrayItem = (field: 'responsibilities' | 'qualifications') => {
    const currentArray = newJobData[field] || [];
    setNewJobData(prev => ({
      ...prev,
      [field]: [...currentArray, '']
    }));
  };

  const removeNewJobArrayItem = (field: 'responsibilities' | 'qualifications', index: number) => {
    const currentArray = newJobData[field] || [];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    
    setNewJobData(prev => ({
      ...prev,
      [field]: updatedArray
    }));
  };

  const handleCreateJob = () => {
    if (!newJobData.title || !newJobData.role_overview) {
      toast.error('Please fill in title and role overview');
      return;
    }

    // Filter out empty strings from arrays
    const cleanedData = {
      ...newJobData,
      responsibilities: (newJobData.responsibilities || []).filter(item => item.trim() !== ''),
      qualifications: (newJobData.qualifications || []).filter(item => item.trim() !== '')
    };

    createJobMutation.mutate(cleanedData);
  };

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

  if (applicationsLoading || postingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading careers data...</span>
      </div>
    );
  }

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

      {/* Job Postings Management */}
      <Card>
        <CardHeader>
          <div className={isMobile ? 'space-y-4' : 'flex items-center justify-between'}>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Postings Management
              </CardTitle>
              <CardDescription>
                Manage job postings, update content, and control visibility
              </CardDescription>
            </div>
            <Dialog open={showNewJobModal} onOpenChange={setShowNewJobModal}>
              <DialogTrigger asChild>
                <Button className={isMobile ? 'w-full' : ''}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                  <DialogDescription>
                    Add a new job posting to the careers page
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={newJobData.title || ''}
                        onChange={(e) => setNewJobData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Senior React Developer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        value={newJobData.sort_order || 0}
                        onChange={(e) => setNewJobData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role Overview</Label>
                    <Textarea
                      value={newJobData.role_overview || ''}
                      onChange={(e) => setNewJobData(prev => ({ ...prev, role_overview: e.target.value }))}
                      placeholder="Brief description of the role..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Responsibilities</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addNewJobArrayItem('responsibilities')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Responsibility
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(newJobData.responsibilities || []).map((responsibility, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                          <Input
                            value={responsibility}
                            onChange={(e) => handleNewJobArrayChange('responsibilities', index, e.target.value)}
                            placeholder="Enter responsibility"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeNewJobArrayItem('responsibilities', index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Qualifications</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addNewJobArrayItem('qualifications')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Qualification
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(newJobData.qualifications || []).map((qualification, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                          <Input
                            value={qualification}
                            onChange={(e) => handleNewJobArrayChange('qualifications', index, e.target.value)}
                            placeholder="Enter qualification"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeNewJobArrayItem('qualifications', index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newJobData.active || false}
                      onCheckedChange={(checked) => setNewJobData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label>Active (visible on careers page)</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewJobModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateJob}
                      disabled={createJobMutation.isPending}
                    >
                      {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(!jobPostings || jobPostings.length === 0) ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">No Job Postings Found</CardTitle>
                <CardDescription>
                  Create your first job posting to get started.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-6">
              {jobPostings.map((job) => {
                const currentResponsibilities = getCurrentJobValue(job, 'responsibilities') as string[] || [];
                const currentQualifications = getCurrentJobValue(job, 'qualifications') as string[] || [];
                
                return (
                  <Card key={job.id}>
                    <CardHeader className={isMobile ? "pb-3" : ""}>
                      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
                        <div>
                          <CardTitle className="text-lg">
                            {getCurrentJobValue(job, 'title') as string}
                            <span className="text-sm font-normal ml-2 text-muted-foreground">
                              (Order: {getCurrentJobValue(job, 'sort_order')})
                            </span>
                          </CardTitle>
                          <CardDescription>
                            Changes update the live careers page immediately
                          </CardDescription>
                        </div>
                        <div className={isMobile ? "flex items-center justify-between" : "flex items-center gap-2"}>
                          <Badge variant={getCurrentJobValue(job, 'active') ? "default" : "secondary"}>
                            {getCurrentJobValue(job, 'active') ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteJobMutation.mutate(job.id)}
                            disabled={deleteJobMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className={isMobile ? "space-y-3 p-4" : "space-y-4"}>
                      <div className={isMobile ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                        <div className="space-y-2">
                          <Label>Job Title</Label>
                          <Input
                            value={getCurrentJobValue(job, 'title') as string}
                            onChange={(e) => handleJobInputChange(job.id, 'title', e.target.value)}
                            placeholder="Job title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sort Order</Label>
                          <Input
                            type="number"
                            value={getCurrentJobValue(job, 'sort_order') as number}
                            onChange={(e) => handleJobInputChange(job.id, 'sort_order', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Role Overview</Label>
                        <Textarea
                          value={getCurrentJobValue(job, 'role_overview') as string}
                          onChange={(e) => handleJobInputChange(job.id, 'role_overview', e.target.value)}
                          placeholder="Brief description of the role..."
                          rows={3}
                        />
                      </div>

                      <div className={isMobile ? "space-y-2" : "space-y-3"}>
                        <div className={isMobile ? "space-y-2" : "flex items-center justify-between"}>
                          <Label>Responsibilities</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addJobArrayItem(job.id, 'responsibilities')}
                            className={isMobile ? "w-full" : ""}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Responsibility
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {currentResponsibilities.map((responsibility, index) => (
                            <div key={index} className={isMobile ? "space-y-2" : "flex items-center gap-2"}>
                              <div className={isMobile ? "flex items-center gap-2" : "flex items-center gap-2 flex-1"}>
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                <Input
                                  value={responsibility}
                                  onChange={(e) => handleJobArrayChange(job.id, 'responsibilities', index, e.target.value)}
                                  placeholder="Enter responsibility"
                                  className="flex-1"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeJobArrayItem(job.id, 'responsibilities', index)}
                                className={isMobile ? "w-full" : "flex-shrink-0"}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {currentResponsibilities.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">
                              No responsibilities added yet. Click "Add Responsibility" to get started.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={isMobile ? "space-y-2" : "space-y-3"}>
                        <div className={isMobile ? "space-y-2" : "flex items-center justify-between"}>
                          <Label>Qualifications</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addJobArrayItem(job.id, 'qualifications')}
                            className={isMobile ? "w-full" : ""}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Qualification
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {currentQualifications.map((qualification, index) => (
                            <div key={index} className={isMobile ? "space-y-2" : "flex items-center gap-2"}>
                              <div className={isMobile ? "flex items-center gap-2" : "flex items-center gap-2 flex-1"}>
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                <Input
                                  value={qualification}
                                  onChange={(e) => handleJobArrayChange(job.id, 'qualifications', index, e.target.value)}
                                  placeholder="Enter qualification"
                                  className="flex-1"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeJobArrayItem(job.id, 'qualifications', index)}
                                className={isMobile ? "w-full" : "flex-shrink-0"}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {currentQualifications.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">
                              No qualifications added yet. Click "Add Qualification" to get started.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={isMobile ? 'space-y-3 pt-4 border-t' : 'flex items-center justify-between pt-4 border-t'}>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={getCurrentJobValue(job, 'active') as boolean}
                            onCheckedChange={(checked) => handleJobInputChange(job.id, 'active', checked)}
                          />
                          <Label>Show on Careers Page</Label>
                        </div>

                        <Button
                          onClick={() => handleSaveJob(job)}
                          disabled={!hasJobChanges(job.id) || updateJobMutation.isPending}
                          size="sm"
                          className={isMobile ? 'w-full' : ''}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateJobMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>

                      {hasJobChanges(job.id) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            You have unsaved changes. Click "Save Changes" to apply them.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

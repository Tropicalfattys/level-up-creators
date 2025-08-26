import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { jobPostingSchema, validateInput } from '@/lib/validation';
import { handleSupabaseError, showErrorToast } from '@/lib/errorHandler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  Plus, 
  Users, 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Globe, 
  Github,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

interface JobPosting {
  id: string;
  title: string;
  role_overview: string;
  responsibilities: Json;
  qualifications: Json;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface JobApplication {
  id: string;
  job_posting_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  social_links: Json | null;
  cover_letter: string;
  status: string;
  created_at: string;
  job_postings?: {
    title: string;
  };
}

interface JobPostingForm {
  title: string;
  role_overview: string;
  responsibilities: string[];
  qualifications: string[];
  active: boolean;
  sort_order: number;
}

export const AdminCareers = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  const form = useForm<JobPostingForm>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: '',
      role_overview: '',
      responsibilities: [''],
      qualifications: [''],
      active: true,
      sort_order: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase
          .from('job_postings')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('job_applications')
          .select(`
            *,
            job_postings (
              title
            )
          `)
          .order('created_at', { ascending: false })
      ]);

      if (jobsResponse.error) throw jobsResponse.error;
      if (applicationsResponse.error) throw applicationsResponse.error;

      setJobPostings(jobsResponse.data || []);
      setApplications(applicationsResponse.data || []);
    } catch (error) {
      console.error('Error fetching careers data:', error);
      showErrorToast(handleSupabaseError(error as Error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJob = async (data: JobPostingForm) => {
    setSubmitting(true);
    try {
      const validation = validateInput(jobPostingSchema, data);
      if (validation.success === false) {
        showErrorToast(validation.errors.join(', '));
        return;
      }

      if (editingJob) {
        const { error } = await supabase
          .from('job_postings')
          .update({
            title: data.title,
            role_overview: data.role_overview,
            responsibilities: data.responsibilities.filter(r => r.trim()),
            qualifications: data.qualifications.filter(q => q.trim()),
            active: data.active,
            sort_order: data.sort_order
          })
          .eq('id', editingJob.id);

        if (error) throw error;
        toast.success('Job posting updated successfully');
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert({
            title: data.title,
            role_overview: data.role_overview,
            responsibilities: data.responsibilities.filter(r => r.trim()),
            qualifications: data.qualifications.filter(q => q.trim()),
            active: data.active,
            sort_order: data.sort_order
          });

        if (error) throw error;
        toast.success('Job posting created successfully');
      }

      setShowJobDialog(false);
      setEditingJob(null);
      form.reset();
      fetchData();
    } catch (error) {
      console.error('Error saving job posting:', error);
      showErrorToast(handleSupabaseError(error as Error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This will also delete all related applications.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Job posting deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting job posting:', error);
      showErrorToast(handleSupabaseError(error as Error));
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({ active: !currentStatus })
        .eq('id', jobId);

      if (error) throw error;
      toast.success(`Job posting ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling job status:', error);
      showErrorToast(handleSupabaseError(error as Error));
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating application status:', error);
      showErrorToast(handleSupabaseError(error as Error));
    }
  };

  const openJobDialog = (job?: JobPosting) => {
    if (job) {
      setEditingJob(job);
      form.reset({
        title: job.title,
        role_overview: job.role_overview,
        responsibilities: parseJsonArray(job.responsibilities),
        qualifications: parseJsonArray(job.qualifications),
        active: job.active,
        sort_order: job.sort_order
      });
    } else {
      setEditingJob(null);
      form.reset();
    }
    setShowJobDialog(true);
  };

  const parseJsonArray = (json: Json): string[] => {
    if (Array.isArray(json)) {
      return json.map(item => String(item));
    }
    return [];
  };

  const parseJsonObject = (json: Json | null): Record<string, string> => {
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const result: Record<string, string> = {};
      Object.entries(json).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          result[key] = value;
        }
      });
      return result;
    }
    return {};
  };

  const addResponsibilityField = () => {
    const current = form.getValues('responsibilities');
    form.setValue('responsibilities', [...current, '']);
  };

  const removeResponsibilityField = (index: number) => {
    const current = form.getValues('responsibilities');
    form.setValue('responsibilities', current.filter((_, i) => i !== index));
  };

  const addQualificationField = () => {
    const current = form.getValues('qualifications');
    form.setValue('qualifications', [...current, '']);
  };

  const removeQualificationField = (index: number) => {
    const current = form.getValues('qualifications');
    form.setValue('qualifications', current.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        <Button onClick={() => openJobDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Job Posting
        </Button>
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
            <div className="text-2xl font-bold mb-1">
              {jobPostings.filter(job => job.active).length}
            </div>
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
            <div className="text-2xl font-bold mb-1">
              {applications.filter(app => app.status === 'pending').length}
            </div>
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
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Job Postings</CardTitle>
              <CardDescription>
                Manage your job postings and their visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostings.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{job.title}</h3>
                          <Badge variant={job.active ? "default" : "secondary"}>
                            {job.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {job.role_overview.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(job.created_at), 'MMM d, yyyy')}
                          </span>
                          <span>{parseJsonArray(job.responsibilities).length} responsibilities</span>
                          <span>{parseJsonArray(job.qualifications).length} qualifications</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleJobStatus(job.id, job.active)}
                        >
                          {job.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openJobDialog(job)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {jobPostings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No job postings found. Create your first job posting to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>
                Review and manage job applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{application.name}</h3>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Applied for: {application.job_postings?.title}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {application.email}
                          </span>
                          {application.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {application.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(application.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={application.status}
                          onChange={(e) => handleUpdateApplicationStatus(application.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <p>{application.name}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p>{application.email}</p>
                                </div>
                                {application.phone && (
                                  <div>
                                    <Label>Phone</Label>
                                    <p>{application.phone}</p>
                                  </div>
                                )}
                                <div>
                                  <Label>Applied Date</Label>
                                  <p>{format(new Date(application.created_at), 'MMM d, yyyy')}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4">
                                {application.resume_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4 mr-1" />
                                      Resume
                                    </a>
                                  </Button>
                                )}
                                {application.portfolio_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer">
                                      <Globe className="h-4 w-4 mr-1" />
                                      Portfolio
                                    </a>
                                  </Button>
                                )}
                                {application.github_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={application.github_url} target="_blank" rel="noopener noreferrer">
                                      <Github className="h-4 w-4 mr-1" />
                                      GitHub
                                    </a>
                                  </Button>
                                )}
                              </div>

                              {application.social_links && Object.keys(parseJsonObject(application.social_links)).length > 0 && (
                                <div>
                                  <Label>Social Links</Label>
                                  <div className="flex gap-2 mt-1">
                                    {Object.entries(parseJsonObject(application.social_links)).map(([platform, link]) => 
                                      link && (
                                        <Button key={platform} variant="outline" size="sm" asChild>
                                          <a href={link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            {platform}
                                          </a>
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <Label>Cover Letter</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm whitespace-pre-wrap">{application.cover_letter}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications received yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Posting Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmitJob)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="e.g. Full-Stack Developer"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  {...form.register('sort_order', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_overview">Role Overview *</Label>
              <Textarea
                id="role_overview"
                {...form.register('role_overview')}
                placeholder="Describe the role and its purpose..."
                rows={4}
              />
              {form.formState.errors.role_overview && (
                <p className="text-sm text-destructive">{form.formState.errors.role_overview.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Responsibilities *</Label>
              {form.watch('responsibilities').map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    {...form.register(`responsibilities.${index}`)}
                    placeholder="Enter a responsibility..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeResponsibilityField(index)}
                    disabled={form.getValues('responsibilities').length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResponsibilityField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Responsibility
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Qualifications *</Label>
              {form.watch('qualifications').map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    {...form.register(`qualifications.${index}`)}
                    placeholder="Enter a qualification..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQualificationField(index)}
                    disabled={form.getValues('qualifications').length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQualificationField}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Qualification
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                {...form.register('active')}
                className="h-4 w-4"
              />
              <Label htmlFor="active">Active (visible to applicants)</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowJobDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingJob ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingJob ? 'Update Job' : 'Create Job'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

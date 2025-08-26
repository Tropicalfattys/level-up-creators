
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Users, FileText, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

interface JobApplication {
  id: string;
  job_posting_id: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  cover_letter: string | null;
  social_links: any;
  status: string;
  created_at: string;
  job_postings?: {
    title: string;
  };
}

interface JobFormData {
  title: string;
  role_overview: string;
  responsibilities: string;
  qualifications: string;
  active: boolean;
  sort_order: number;
}

export const AdminCareers = () => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormData, setJobFormData] = useState<JobFormData>({
    title: '',
    role_overview: '',
    responsibilities: '',
    qualifications: '',
    active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch job postings
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .order('sort_order', { ascending: true });

      if (jobsError) throw jobsError;

      // Fetch job applications with job posting titles
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      setJobPostings(jobsData || []);
      setApplications(applicationsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load careers data');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const jobData = {
        title: jobFormData.title,
        role_overview: jobFormData.role_overview,
        responsibilities: jobFormData.responsibilities.split('\n').filter(r => r.trim()),
        qualifications: jobFormData.qualifications.split('\n').filter(q => q.trim()),
        active: jobFormData.active,
        sort_order: jobFormData.sort_order
      };

      let error;
      if (editingJob) {
        const { error: updateError } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', editingJob.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('job_postings')
          .insert(jobData);
        error = insertError;
      }

      if (error) throw error;

      toast.success(editingJob ? 'Job posting updated successfully' : 'Job posting created successfully');
      
      setShowJobForm(false);
      setEditingJob(null);
      setJobFormData({
        title: '',
        role_overview: '',
        responsibilities: '',
        qualifications: '',
        active: true,
        sort_order: 0
      });
      
      fetchData();

    } catch (error) {
      console.error('Error saving job posting:', error);
      toast.error('Failed to save job posting');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

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
      toast.error('Failed to delete job posting');
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
      toast.error('Failed to update application status');
    }
  };

  const startEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      role_overview: job.role_overview,
      responsibilities: job.responsibilities.join('\n'),
      qualifications: job.qualifications.join('\n'),
      active: job.active,
      sort_order: job.sort_order
    });
    setShowJobForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
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
        <Button 
          className="flex items-center gap-2"
          onClick={() => setShowJobForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add Job Posting
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Job Postings Management */}
      <Card>
        <CardHeader>
          <CardTitle>Job Postings</CardTitle>
          <CardDescription>Manage active and inactive job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobPostings.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{job.title}</h4>
                    <Badge variant={job.active ? "default" : "secondary"}>
                      {job.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.role_overview.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditJob(job)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Job Applications</CardTitle>
          <CardDescription>Review and manage incoming applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{application.name}</h4>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {application.email} • Applied for: {application.job_postings?.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied on {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
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
                      {selectedApplication && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Name</Label>
                              <p>{selectedApplication.name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Email</Label>
                              <p>{selectedApplication.email}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Phone</Label>
                              <p>{selectedApplication.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Status</Label>
                              <select
                                value={selectedApplication.status}
                                onChange={(e) => handleUpdateApplicationStatus(selectedApplication.id, e.target.value)}
                                className="w-full p-2 border rounded"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="interviewed">Interviewed</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                          
                          {selectedApplication.resume_url && (
                            <div>
                              <Label className="font-semibold">Resume</Label>
                              <a 
                                href={selectedApplication.resume_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                View Resume <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                          
                          {selectedApplication.portfolio_url && (
                            <div>
                              <Label className="font-semibold">Portfolio</Label>
                              <a 
                                href={selectedApplication.portfolio_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                View Portfolio <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                          
                          {selectedApplication.github_url && (
                            <div>
                              <Label className="font-semibold">GitHub</Label>
                              <a 
                                href={selectedApplication.github_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline"
                              >
                                View GitHub <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                          
                          {selectedApplication.cover_letter && (
                            <div>
                              <Label className="font-semibold">Cover Letter</Label>
                              <p className="mt-1 p-3 bg-muted rounded text-sm">
                                {selectedApplication.cover_letter}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Form Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? 'Edit Job Posting' : 'Add New Job Posting'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJobSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={jobFormData.title}
                onChange={(e) => setJobFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="role_overview">Role Overview</Label>
              <Textarea
                id="role_overview"
                value={jobFormData.role_overview}
                onChange={(e) => setJobFormData(prev => ({ ...prev, role_overview: e.target.value }))}
                required
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
              <Textarea
                id="responsibilities"
                value={jobFormData.responsibilities}
                onChange={(e) => setJobFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                placeholder="Develop and maintain both frontend and backend systems&#10;Integrate blockchain payment and escrow flows&#10;Write clean, secure, and scalable code"
                required
                rows={5}
              />
            </div>
            
            <div>
              <Label htmlFor="qualifications">Qualifications (one per line)</Label>
              <Textarea
                id="qualifications"
                value={jobFormData.qualifications}
                onChange={(e) => setJobFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                placeholder="Strong experience with Node.js, TypeScript, and React&#10;Familiarity with web3.js, ethers.js, or other blockchain libraries&#10;Experience with SQL/NoSQL databases"
                required
                rows={5}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={jobFormData.sort_order}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={jobFormData.active}
                  onChange={(e) => setJobFormData(prev => ({ ...prev, active: e.target.checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowJobForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingJob ? 'Update' : 'Create'} Job Posting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

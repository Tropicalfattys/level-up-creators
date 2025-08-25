
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Link, FileText, ExternalLink, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProofLink {
  url: string;
  label: string;
}

interface ProofSubmissionProps {
  bookingId: string;
  currentProof?: {
    link?: string;
    fileUrl?: string;
    links?: ProofLink[];
  };
  onSubmitProof: (proofData: { links: ProofLink[]; file: File | null; notes: string }) => void;
  isSubmitting: boolean;
}

export const ProofSubmission = ({ 
  bookingId, 
  currentProof, 
  onSubmitProof, 
  isSubmitting 
}: ProofSubmissionProps) => {
  // Initialize with current proof links or default structure
  const initialLinks = currentProof?.links || (currentProof?.link ? [{ url: currentProof.link, label: 'Social Proof' }] : [{ url: '', label: '' }]);
  
  const [proofLinks, setProofLinks] = useState<ProofLink[]>(initialLinks.length > 0 ? initialLinks : [{ url: '', label: '' }]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');

  const handleSubmit = () => {
    // Filter out empty links
    const validLinks = proofLinks.filter(link => link.url.trim() && link.label.trim());
    
    if (validLinks.length === 0 && !proofFile && !proofNotes.trim()) {
      return;
    }
    
    onSubmitProof({
      links: validLinks,
      file: proofFile,
      notes: proofNotes.trim()
    });
    
    // Reset form after submission
    setProofLinks([{ url: '', label: '' }]);
    setProofFile(null);
    setProofNotes('');
  };

  const addLinkField = () => {
    setProofLinks([...proofLinks, { url: '', label: '' }]);
  };

  const removeLinkField = (index: number) => {
    if (proofLinks.length > 1) {
      setProofLinks(proofLinks.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index: number, field: 'url' | 'label', value: string) => {
    const updated = [...proofLinks];
    updated[index][field] = value;
    setProofLinks(updated);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const hasValidLinks = proofLinks.some(link => link.url.trim() && link.label.trim() && isValidUrl(link.url));
  const canSubmit = hasValidLinks || proofFile || proofNotes.trim();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Proof of Work</CardTitle>
          <Badge variant="outline" className="text-xs">Required for Delivery</Badge>
        </div>
        <CardDescription>
          Submit proof that you've completed the work. Add links to your posts, upload files, or provide detailed notes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Proof Display */}
        {(currentProof?.links?.length || currentProof?.link || currentProof?.fileUrl) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                Proof Submitted
              </Badge>
            </div>
            
            {/* Show current links */}
            {currentProof.links?.map((link, index) => (
              <div key={index} className="flex items-center gap-2 mb-1">
                <ExternalLink className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{link.label}:</span>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm truncate"
                >
                  {link.url}
                </a>
              </div>
            ))}
            
            {/* Legacy single link support */}
            {currentProof.link && !currentProof.links?.length && (
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="h-4 w-4 text-green-600" />
                <a 
                  href={currentProof.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm truncate"
                >
                  {currentProof.link}
                </a>
              </div>
            )}
            
            {currentProof.fileUrl && (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                <a 
                  href={currentProof.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Uploaded File
                </a>
              </div>
            )}
          </div>
        )}

        {/* Multiple Proof Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Proof Links
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLinkField}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add More Links
            </Button>
          </div>
          
          {proofLinks.map((link, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Link #{index + 1}</span>
                {proofLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLinkField(index)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Platform/Type (e.g., Twitter Post, YouTube Video, Instagram Story)"
                  value={link.label}
                  onChange={(e) => updateLink(index, 'label', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="url"
                  placeholder="https://twitter.com/yourpost or https://youtube.com/watch?v=..."
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  className={link.url && !isValidUrl(link.url) ? 'border-red-300' : ''}
                />
                {link.url && !isValidUrl(link.url) && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Please enter a valid URL
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <p className="text-xs text-muted-foreground">
            Add links to your social media posts, videos, articles, or any other proof of work completion
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor={`proof-file-${bookingId}`} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File (Screenshots, Documents, etc.)
          </Label>
          <Input
            id={`proof-file-${bookingId}`}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mov"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
          />
          {proofFile && (
            <div className="text-xs text-green-600">
              Selected: {proofFile.name} ({Math.round(proofFile.size / 1024)}KB)
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max 50MB. Supported: Images, PDFs, Documents, Videos, Archives
          </p>
        </div>

        {/* Proof Notes */}
        <div className="space-y-2">
          <Label htmlFor={`proof-notes-${bookingId}`} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Additional Notes (Optional)
          </Label>
          <Textarea
            id={`proof-notes-${bookingId}`}
            placeholder="Describe what you've completed, any additional context, or instructions for the client..."
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Provide context about your work or instructions for the client
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2 border-t">
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting || proofLinks.some(link => link.url && !isValidUrl(link.url))}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Submit Proof
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
          <strong>Examples:</strong> Twitter posts, YouTube videos, Instagram stories, LinkedIn articles, 
          blog posts, GitHub commits, live streams, or any other public proof of your completed work.
        </div>
      </CardContent>
    </Card>
  );
};

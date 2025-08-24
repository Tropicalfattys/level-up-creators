
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Link, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProofSubmissionProps {
  bookingId: string;
  currentProof?: {
    link?: string;
    fileUrl?: string;
  };
  onSubmitProof: (proofData: { link: string; file: File | null; notes: string }) => void;
  isSubmitting: boolean;
}

export const ProofSubmission = ({ 
  bookingId, 
  currentProof, 
  onSubmitProof, 
  isSubmitting 
}: ProofSubmissionProps) => {
  const [proofLink, setProofLink] = useState(currentProof?.link || '');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');

  const handleSubmit = () => {
    if (!proofLink.trim() && !proofFile && !proofNotes.trim()) {
      return;
    }
    
    onSubmitProof({
      link: proofLink.trim(),
      file: proofFile,
      notes: proofNotes.trim()
    });
    
    // Reset form after submission
    setProofLink('');
    setProofFile(null);
    setProofNotes('');
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const canSubmit = proofLink.trim() || proofFile || proofNotes.trim();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Proof of Work</CardTitle>
          <Badge variant="outline" className="text-xs">Required for Delivery</Badge>
        </div>
        <CardDescription>
          Submit proof that you've completed the work. This could be links to your posts, screenshots, or files.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Proof Display */}
        {(currentProof?.link || currentProof?.fileUrl) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                Proof Submitted
              </Badge>
            </div>
            {currentProof.link && (
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

        {/* Proof Link Input */}
        <div className="space-y-2">
          <Label htmlFor={`proof-link-${bookingId}`} className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            External Link (Twitter, LinkedIn, etc.)
          </Label>
          <Input
            id={`proof-link-${bookingId}`}
            type="url"
            placeholder="https://twitter.com/yourpost or https://linkedin.com/post"
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
            className={proofLink && !isValidUrl(proofLink) ? 'border-red-300' : ''}
          />
          {proofLink && !isValidUrl(proofLink) && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="h-3 w-3" />
              Please enter a valid URL
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Link to your post, tweet, LinkedIn update, or any public proof of work
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
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
          />
          {proofFile && (
            <div className="text-xs text-green-600">
              Selected: {proofFile.name} ({Math.round(proofFile.size / 1024)}KB)
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Max 10MB. Supported: Images, PDFs, Documents, Archives
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
            disabled={!canSubmit || isSubmitting || (proofLink && !isValidUrl(proofLink))}
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
          <strong>Tip:</strong> Strong proof of work increases client satisfaction and helps build your reputation. 
          Include links to public posts, screenshots of completed work, or detailed explanations.
        </div>
      </CardContent>
    </Card>
  );
};

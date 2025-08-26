
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/contact/ContactForm';
import { Info } from 'lucide-react';

export const AdminContactUs = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Contact Us Form Preview</h2>
        <p className="text-muted-foreground">
          Admin preview of the public contact form for testing and verification purposes.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Admin Testing Notes</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• This is the same form that public users see on the Contact page</li>
                <li>• Messages submitted here will be stored in the contact_messages table</li>
                <li>• Use the "Contacts" tab to view and manage submitted messages</li>
                <li>• Test form validation and submission flow from admin perspective</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactForm />
    </div>
  );
};

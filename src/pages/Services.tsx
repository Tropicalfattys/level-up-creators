
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Services() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Services</h1>
        <p className="text-muted-foreground">
          Create and manage your service offerings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Services</CardTitle>
              <CardDescription>
                Services you offer to clients on the platform
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven't created any services yet
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

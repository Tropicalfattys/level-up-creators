import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border">
            <CardContent className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Terms of Service
              </h1>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-6">
                <p className="text-lg leading-relaxed">
                  These terms of service govern your use of our platform and services.
                </p>
                
                <p className="leading-relaxed">
                  This is a placeholder terms of service page. The complete terms and conditions will be available here soon.
                </p>
                
                <p className="leading-relaxed">
                  By using our platform, you agree to comply with these terms and conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;
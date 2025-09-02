import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border">
            <CardContent className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Privacy Policy
              </h1>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-6">
                <p className="text-lg leading-relaxed">
                  Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.
                </p>
                
                <p className="leading-relaxed">
                  This is a placeholder privacy policy page. The complete privacy policy will be available here soon.
                </p>
                
                <p className="leading-relaxed">
                  We are committed to protecting your privacy and ensuring transparency in how we handle your data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
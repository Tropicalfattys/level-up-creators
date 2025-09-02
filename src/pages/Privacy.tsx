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
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Effective Date: August 1, 2025</p>
                  <p>Last Updated: August 19, 2025</p>
                </div>
                
                <p className="text-lg leading-relaxed">
                  This Privacy Policy describes how LeveledUp ("we," "our," "us") collects, uses, and protects your personal information when you use our Services.
                </p>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed"><strong>Account Information:</strong> Email address, username, and wallet address when you register.</p>
                    <p className="leading-relaxed"><strong>Payment Information:</strong> Cryptocurrency wallet addresses and transaction data (we do not store private keys).</p>
                    <p className="leading-relaxed"><strong>Content Information:</strong> Communications with Creators, service requests, and dispute submissions.</p>
                    <p className="leading-relaxed"><strong>Device & Usage Data:</strong> IP address, browser type, and log files for security and analytics.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. How We Use Information</h2>
                  <p className="leading-relaxed">We use collected data to:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Provide and maintain the Services.</p>
                    <p className="leading-relaxed">Facilitate escrow payments and service delivery.</p>
                    <p className="leading-relaxed">Prevent fraud, abuse, and illegal activities.</p>
                    <p className="leading-relaxed">Resolve disputes and enforce our Terms of Service.</p>
                    <p className="leading-relaxed">Comply with applicable legal obligations.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. Data Sharing</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We do not sell or rent your personal data to third parties.</p>
                    <p className="leading-relaxed">We may share information with:</p>
                    <div className="pl-6 space-y-2">
                      <p className="leading-relaxed">Creators (only what's needed to complete a service request).</p>
                      <p className="leading-relaxed">Service providers (hosting, analytics, security partners).</p>
                      <p className="leading-relaxed">Legal authorities (when required by law).</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. Cryptocurrency Transactions</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Payments are conducted on blockchain networks.</p>
                    <p className="leading-relaxed">Transaction data (including wallet addresses) is public and outside our control.</p>
                    <p className="leading-relaxed">Users are responsible for safeguarding their wallet credentials.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Cookies & Tracking</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We use cookies and similar technologies to maintain sessions, improve security, and enhance user experience.</p>
                    <p className="leading-relaxed">You can disable cookies in your browser, but some features may not function properly.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Data Security</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We use industry-standard encryption and security measures.</p>
                    <p className="leading-relaxed">However, no online system is completely secure. You use the Services at your own risk.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Data Retention</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We retain account and transaction data as long as necessary to provide Services or comply with law.</p>
                    <p className="leading-relaxed">You may request account deletion at any time.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. Children's Privacy</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Our Services are not intended for children under 18.</p>
                    <p className="leading-relaxed">We do not knowingly collect data from children.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. International Users</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Data may be stored and processed in countries other than your own.</p>
                    <p className="leading-relaxed">By using the Services, you consent to such transfers.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Changes to Privacy Policy</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We may update this Privacy Policy periodically.</p>
                    <p className="leading-relaxed">Material changes will be posted on our website with a new "Last Updated" date.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. Contact Information</h2>
                  <p className="leading-relaxed">For privacy questions or requests:</p>
                  <div className="pl-4">
                    <p>Email: privacy@ruleveledup.live</p>
                    <p>Website: https://ruleveledup.live</p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
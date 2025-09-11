import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const Privacy = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      <div className={isMobile ? "w-full px-0 py-16" : "container mx-auto px-4 py-16"}>
        <div className={isMobile ? "w-full" : "max-w-4xl mx-auto"}>
          <Card className="bg-card border-border">
            <CardContent className={isMobile ? "px-4 py-8" : "p-8 md:p-12"}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Privacy Policy
              </h1>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-6">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Effective Date: August 1, 2025</p>
                  <p>Last Updated: September 4th, 2025</p>
                </div>
                
                <p className="text-lg leading-relaxed">
                  Leveled Up ("we," "our," "us") operates the website https://ruleveledup.live ("Platform") and provides a creator–client marketplace service. We value your privacy and are committed to protecting your personal data in compliance with global privacy laws, including the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other applicable laws worldwide.
                </p>
                
                <p className="leading-relaxed">
                  By accessing or using our Platform, you agree to the terms of this Privacy Policy.
                </p>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
                  <p className="leading-relaxed">We collect the following categories of information when you use our Platform:</p>
                  <div className="pl-6 space-y-3">
                    <div>
                      <p className="leading-relaxed font-semibold">Account Information</p>
                      <div className="pl-4 space-y-1">
                        <p className="leading-relaxed">• Username, email address, password.</p>
                        <p className="leading-relaxed">• Profile details you upload (photos, videos, descriptions).</p>
                        <p className="leading-relaxed">• Reviews and public feedback you leave.</p>
                      </div>
                    </div>
                    <div>
                      <p className="leading-relaxed font-semibold">Financial Information</p>
                      <div className="pl-4 space-y-1">
                        <p className="leading-relaxed">• Up to five payout wallet addresses (encrypted and never shared).</p>
                        <p className="leading-relaxed">• Payment transaction details (handled securely via third-party providers).</p>
                      </div>
                    </div>
                    <div>
                      <p className="leading-relaxed font-semibold">Usage Data</p>
                      <div className="pl-4 space-y-1">
                        <p className="leading-relaxed">• Activity within client dashboards and creator dashboards.</p>
                        <p className="leading-relaxed">• Services booked, canceled, or completed.</p>
                        <p className="leading-relaxed">• Analytics for performance improvement and feature development.</p>
                      </div>
                    </div>
                    <div>
                      <p className="leading-relaxed font-semibold">Device & Technical Data</p>
                      <div className="pl-4 space-y-1">
                        <p className="leading-relaxed">• Browser type & operating system.</p>
                        <p className="leading-relaxed">• Log files and cookies for security, analytics, and optimization.</p>
                      </div>
                    </div>
                    <div>
                      <p className="leading-relaxed font-semibold">Generated & Uploaded Content</p>
                      <div className="pl-4 space-y-1">
                        <p className="leading-relaxed">• Any content (photos, videos, text, reviews) uploaded to profiles is considered public and may be used by us for advertising, promotion, or marketing purposes.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
                  <p className="leading-relaxed">We use collected data to:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">1. Provide, operate, and improve our services.</p>
                    <p className="leading-relaxed">2. Process secure payments and escrow transactions.</p>
                    <p className="leading-relaxed">3. Track and analyze usage patterns to enhance user experience.</p>
                    <p className="leading-relaxed">4. Protect against fraud, abuse, and violations of law.</p>
                    <p className="leading-relaxed">5. Comply with KYC/AML (Know Your Customer / Anti-Money Laundering) obligations if required by law enforcement.</p>
                    <p className="leading-relaxed">6. Market and promote creators and the Platform, including reusing uploaded photos, videos, and reviews in advertising.</p>
                    <p className="leading-relaxed">7. Train or optimize features using AI-based analytics tools (OpenAI, DeepMind, etc.), limited to non-sensitive, anonymized, or aggregated data.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. Legal Basis for Processing (GDPR Compliance)</h2>
                  <p className="leading-relaxed">Under the GDPR, we process your personal data based on the following legal grounds:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">• <strong>Contractual necessity:</strong> to provide the services you request.</p>
                    <p className="leading-relaxed">• <strong>Legitimate interests:</strong> to analyze and improve the Platform, prevent fraud, and promote security.</p>
                    <p className="leading-relaxed">• <strong>Consent:</strong> when you upload content for public display or agree to marketing use.</p>
                    <p className="leading-relaxed">• <strong>Legal obligations:</strong> to comply with AML, fraud prevention, or law enforcement requirements.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. Data Sharing & Disclosure</h2>
                  <p className="leading-relaxed">We do not sell or rent personal data to third parties.</p>
                  <p className="leading-relaxed">We may share limited data in these cases:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">• <strong>Service Providers:</strong> For secure payments, hosting, and analytics.</p>
                    <p className="leading-relaxed">• <strong>Law Enforcement:</strong> If legally required under valid court orders or applicable law.</p>
                    <p className="leading-relaxed">• <strong>Business Operations:</strong> In case of merger, acquisition, or sale of assets.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Data Retention</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">• We retain data only as long as necessary to fulfill the purposes outlined in this policy.</p>
                    <p className="leading-relaxed">• Wallet addresses and payment records are encrypted and retained only as needed for compliance and bookkeeping.</p>
                    <p className="leading-relaxed">• Public content (photos, videos, reviews) may be retained indefinitely for promotional purposes, unless deletion is specifically requested.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
                  <p className="leading-relaxed">Depending on your location, you have the following rights:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">• <strong>Access:</strong> Request a copy of your data.</p>
                    <p className="leading-relaxed">• <strong>Correction:</strong> Fix inaccuracies in your information.</p>
                    <p className="leading-relaxed">• <strong>Deletion:</strong> Request deletion of your data ("Right to be Forgotten").</p>
                    <p className="leading-relaxed">• <strong>Restriction:</strong> Limit how we process your data.</p>
                    <p className="leading-relaxed">• <strong>Portability:</strong> Request your data in a portable format.</p>
                    <p className="leading-relaxed">• <strong>Opt-Out:</strong> Decline use of data for targeted marketing or analytics.</p>
                  </div>
                  <p className="leading-relaxed">To exercise these rights, submit a request via our in-app contact form. We will respond within 30 days as required by law.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Data Security</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">• All sensitive information (wallet addresses, transactions) is encrypted at rest and in transit.</p>
                    <p className="leading-relaxed">• Escrow services follow industry-standard security best practices.</p>
                    <p className="leading-relaxed">• We regularly monitor and audit our systems for vulnerabilities.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. Children's Privacy</h2>
                  <p className="leading-relaxed">Our Platform is not intended for use by individuals under 18 years of age. We do not knowingly collect data from minors. If we become aware of such collection, we will delete the data promptly.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. International Data Transfers</h2>
                  <p className="leading-relaxed">Your information may be stored or processed in servers outside of your country, including the United States or the European Union. We ensure adequate safeguards for international transfers as required by GDPR and other laws.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. AI & Third-Party Integrations</h2>
                  <p className="leading-relaxed">We may use AI and analytics services to improve platform performance. Data shared with these services is limited to non-sensitive information (such as product reviews, usage analytics). We do not share private wallet data or sensitive identifiers with AI providers.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. Changes to This Privacy Policy</h2>
                  <p className="leading-relaxed">We may update this Privacy Policy periodically. Updated versions will be posted with a new "Last Updated" date. Continued use of the Platform constitutes acceptance of changes.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">12. Contact Information</h2>
                  <p className="leading-relaxed">If you have questions or requests regarding this Privacy Policy, please contact us via the in-app Contact form</p>
                  <div className="pl-4">
                    <p>Website: <a href="https://ruleveledup.live" className="text-primary hover:underline">https://ruleveledup.live</a></p>
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
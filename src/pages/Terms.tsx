import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const Terms = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background">
      <div className={isMobile ? "w-full px-0 py-16" : "container mx-auto px-4 py-16"}>
        <div className={isMobile ? "w-full" : "max-w-4xl mx-auto"}>
          <Card className="bg-card border-border">
            <CardContent className={isMobile ? "px-4 py-8" : "p-8 md:p-12"}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Terms of Service
              </h1>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-6">
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Effective Date: August 15, 2025</p>
                  <p>Last Updated: August 30, 2025</p>
                </div>
                
                <p className="text-lg leading-relaxed">
                  Welcome to LeveledUp ("we," "our," "us"). By accessing or using our platform, mobile applications, websites, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree, you may not use the Services.
                </p>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Overview of the Services</h2>
                  <p className="leading-relaxed">
                    LeveledUp provides a marketplace for personalized content, shoutouts, and other services offered by creators (the "Creators") to their fans or customers ("Users"). The platform enables Users to:
                  </p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Browse and purchase Creator services (video shoutouts, live calls, social media engagements, etc.).</p>
                    <p className="leading-relaxed">Pay for services using supported cryptocurrency.</p>
                    <p className="leading-relaxed">Use our integrated escrow system for secure transactions.</p>
                    <p className="leading-relaxed">Interact with Creators primarily via social media channels (Twitter/X, Instagram, YouTube, TikTok, and others).</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. Eligibility</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">You must be at least 18 years old to use the Services.</p>
                    <p className="leading-relaxed">By using the Services, you represent and warrant that you have the legal capacity to enter into these Terms.</p>
                    <p className="leading-relaxed">Creators may be subject to additional verification requirements.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. Accounts</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Users must create an account to access certain features.</p>
                    <p className="leading-relaxed">You agree to provide accurate, current, and complete information during registration and to update it as necessary.</p>
                    <p className="leading-relaxed">You are responsible for safeguarding your account credentials and for all activity under your account.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. Creator Services</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Creators are independent contractors, not employees of LeveledUp.</p>
                    <p className="leading-relaxed">LeveledUp does not control, edit, or endorse Creator content.</p>
                    <p className="leading-relaxed">Users understand that Creator content may vary in style, quality, and format.</p>
                    <p className="leading-relaxed">Delivery timelines are provided by Creators; delays may occur.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Payment Protection System</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Payments are processed exclusively in supported cryptocurrencies (see current list in the app).</p>
                    <p className="leading-relaxed">User funds are held in our Payment Protect System until the Creator delivers the agreed-upon service.</p>
                    <p className="leading-relaxed">Once a service is marked as delivered and accepted, funds are released to the Creator.</p>
                    <p className="leading-relaxed">Disputes will be handled via LeveledUp's dispute resolution process (see Section 10).</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Refunds</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Refunds are not guaranteed once a Creator has delivered the service.</p>
                    <p className="leading-relaxed">If a Creator fails to deliver, Users may request a refund through our dispute resolution process.</p>
                    <p className="leading-relaxed">Refunds will be returned in cryptocurrency, subject to blockchain transaction fees.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Acceptable Use</h2>
                  <p className="leading-relaxed">You agree not to:</p>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">Use the Services for unlawful purposes or in violation of applicable laws.</p>
                    <p className="leading-relaxed">Harass, abuse, or exploit Creators or Users.</p>
                    <p className="leading-relaxed">Upload, share, or promote offensive, obscene, or harmful content.</p>
                    <p className="leading-relaxed">Attempt to bypass or interfere with our payment protection system or payment system.</p>
                    <p className="leading-relaxed">Misrepresent your identity or impersonate others.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. Intellectual Property</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">All content created by Creators belongs to them unless explicitly transferred.</p>
                    <p className="leading-relaxed">Users may not resell, redistribute, or commercially exploit Creator content without permission.</p>
                    <p className="leading-relaxed">LeveledUp retains ownership of its trademarks, logos, software, and platform content.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We may suspend or terminate your account if you violate these Terms.</p>
                    <p className="leading-relaxed">You may stop using the Services at any time.</p>
                    <p className="leading-relaxed">Termination does not affect any ongoing obligations (e.g., pending payments, disputes).</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Dispute Resolution</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">If a User disputes a Creator's delivery, the matter will first be reviewed by LeveledUp's internal team.</p>
                    <p className="leading-relaxed">Our decision is final with respect to our payment protection system releases and refunds.</p>
                    <p className="leading-relaxed">Further disputes may be subject to arbitration (see Governing Law below).</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. Disclaimer of Warranties</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">The Services are provided "as is" and "as available."</p>
                    <p className="leading-relaxed">We do not guarantee uninterrupted or error-free service.</p>
                    <p className="leading-relaxed">LeveledUp does not guarantee the outcome, quality, or timeliness of Creator services.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">12. Limitation of Liability</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">To the maximum extent permitted by law, LeveledUp is not liable for indirect, incidental, special, consequential, or punitive damages.</p>
                    <p className="leading-relaxed">Our total liability for any claim shall not exceed the amount paid by the User for the disputed transaction.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">13. Governing Law</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">These Terms are governed by the laws of United States, EU, & Australia.</p>
                    <p className="leading-relaxed">Any disputes shall be resolved through binding arbitration in [Insert Location].</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">14. Changes to Terms</h2>
                  <div className="pl-6 space-y-2">
                    <p className="leading-relaxed">We may update these Terms from time to time.</p>
                    <p className="leading-relaxed">Continued use of the Services after updates constitutes acceptance of the revised Terms.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">15. Contact Information</h2>
                  <p className="leading-relaxed">For questions, concerns, or complaints:</p>
                  <div className="pl-4">
                    <p>Email: support@ruleveledup.live</p>
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

export default Terms;
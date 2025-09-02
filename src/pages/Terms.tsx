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
                <div className="text-sm text-muted-foreground mb-4">
                  <p>Effective Date: [Insert Date]</p>
                  <p>Last Updated: [Insert Date]</p>
                </div>
                
                <p className="text-lg leading-relaxed">
                  Welcome to LeveledUp ("we," "our," "us"). By accessing or using our platform, mobile applications, websites, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree, you may not use the Services.
                </p>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">1. Overview of the Services</h2>
                  <p className="leading-relaxed">
                    LeveledUp provides a marketplace for personalized content, shoutouts, and other services offered by creators (the "Creators") to their fans or customers ("Users"). The platform enables Users to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Browse and purchase Creator services (video shoutouts, live calls, social media engagements, etc.).</li>
                    <li>Pay for services using supported cryptocurrency.</li>
                    <li>Use our integrated escrow system for secure transactions.</li>
                    <li>Interact with Creators primarily via social media channels (Twitter/X, Instagram, YouTube, TikTok, and others).</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">2. Eligibility</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must be at least 18 years old to use the Services.</li>
                    <li>By using the Services, you represent and warrant that you have the legal capacity to enter into these Terms.</li>
                    <li>Creators may be subject to additional verification requirements.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">3. Accounts</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Users must create an account to access certain features.</li>
                    <li>You agree to provide accurate, current, and complete information during registration and to update it as necessary.</li>
                    <li>You are responsible for safeguarding your account credentials and for all activity under your account.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">4. Creator Services</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Creators are independent contractors, not employees of LeveledUp.</li>
                    <li>LeveledUp does not control, edit, or endorse Creator content.</li>
                    <li>Users understand that Creator content may vary in style, quality, and format.</li>
                    <li>Delivery timelines are provided by Creators; delays may occur.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">5. Payments and Escrow</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Payments are processed exclusively in supported cryptocurrencies (see current list in the app).</li>
                    <li>User funds are held in escrow until the Creator delivers the agreed-upon service.</li>
                    <li>Once a service is marked as delivered and accepted, funds are released to the Creator.</li>
                    <li>Disputes will be handled via LeveledUp's dispute resolution process (see Section 10).</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">6. Refunds</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Refunds are not guaranteed once a Creator has delivered the service.</li>
                    <li>If a Creator fails to deliver, Users may request a refund through our dispute resolution process.</li>
                    <li>Refunds will be returned in cryptocurrency, subject to blockchain transaction fees.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">7. Acceptable Use</h2>
                  <p className="leading-relaxed">You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Services for unlawful purposes or in violation of applicable laws.</li>
                    <li>Harass, abuse, or exploit Creators or Users.</li>
                    <li>Upload, share, or promote offensive, obscene, or harmful content.</li>
                    <li>Attempt to bypass or interfere with our escrow or payment system.</li>
                    <li>Misrepresent your identity or impersonate others.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">8. Intellectual Property</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All content created by Creators belongs to them unless explicitly transferred.</li>
                    <li>Users may not resell, redistribute, or commercially exploit Creator content without permission.</li>
                    <li>LeveledUp retains ownership of its trademarks, logos, software, and platform content.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We may suspend or terminate your account if you violate these Terms.</li>
                    <li>You may stop using the Services at any time.</li>
                    <li>Termination does not affect any ongoing obligations (e.g., pending payments, disputes).</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">10. Dispute Resolution</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>If a User disputes a Creator's delivery, the matter will first be reviewed by LeveledUp's internal team.</li>
                    <li>Our decision is final with respect to escrow releases and refunds.</li>
                    <li>Further disputes may be subject to arbitration (see Governing Law below).</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">11. Disclaimer of Warranties</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The Services are provided "as is" and "as available."</li>
                    <li>We do not guarantee uninterrupted or error-free service.</li>
                    <li>LeveledUp does not guarantee the outcome, quality, or timeliness of Creator services.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">12. Limitation of Liability</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To the maximum extent permitted by law, LeveledUp is not liable for indirect, incidental, special, consequential, or punitive damages.</li>
                    <li>Our total liability for any claim shall not exceed the amount paid by the User for the disputed transaction.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">13. Governing Law</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>These Terms are governed by the laws of [Insert Jurisdiction].</li>
                    <li>Any disputes shall be resolved through binding arbitration in [Insert Location].</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">14. Changes to Terms</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We may update these Terms from time to time.</li>
                    <li>Continued use of the Services after updates constitutes acceptance of the revised Terms.</li>
                  </ul>
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FAQ = () => {
  const faqItems = [
    {
      question: "How does payment and escrow work?",
      answer: "All payments are securely held in escrow until services are rendered. Once the creator delivers the service, funds are automatically released within 3 days unless a dispute is raised.\n\nIf a dispute is submitted, our admin team will review the case and make a fair ruling. There is currently no fee for dispute resolution during our beta launch."
    },
    {
      question: "What are the platform fees?",
      answer: "Leveled Up charges a flat 15% platform fee. This covers escrow management, blockchain transaction costs, and secure payouts to creators.\n\nCreators keep 85% of their earnings.\nThere are no additional fees for clients booking services or creators listing services."
    },
    {
      question: "Is messaging free on Leveled Up?",
      answer: "Yes. Unlike other platforms, messaging is completely free. Clients and creators can communicate without any charges."
    },
    {
      question: "What blockchains do you support?",
      answer: "Currently, Leveled Up supports:\n• Ethereum (ETH)\n• Solana (SOL)\n• Binance Smart Chain (BSC)\n• Sui (SUI)\n• Cardano (ADA)\n\nWe are continuously adding support for more blockchains to give creators and clients more flexibility."
    },
    {
      question: "Do you support credit card payments?",
      answer: "Not yet. At this time, Leveled Up is crypto-only. However, we are actively working on Stripe integration to enable secure credit and debit card payments in the future."
    },
    {
      question: "How secure is Leveled Up?",
      answer: "Security is a top priority. All funds are managed through encrypted escrow smart contracts, and all communication between clients and creators is fully secured. We never share or sell your data."
    },
    {
      question: "What happens if there's a dispute?",
      answer: "If a client or creator raises a dispute, our admin team will step in to review the details. Both parties will have the opportunity to provide evidence. The funds will only be released once a final ruling is made. The platform keeps the 15% fee no matter which way the dispute is ruled. So if the dispute is ruled in favor of the client and a refund is granted, they will only receive back 85% of the funds in question."
    },
    {
      question: "How quickly do creators get paid?",
      answer: "After a service is marked complete and no disputes are raised, funds are released within 3 days directly to the creator's wallet."
    },
    {
      question: "Are there any hidden costs?",
      answer: "No. The only fee is the 15% platform fee. There are no fees for messaging, listing, or booking services."
    },
    {
      question: "Who can join Leveled Up?",
      answer: "• Creators: Crypto influencers, experts, and personalities offering shoutouts, AMAs, consultations, or other services.\n• Clients: Anyone looking to book a creator using cryptocurrency."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--gradient-from))] to-[hsl(var(--gradient-to))] bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Leveled Up
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {faqItems.map((item, index) => (
            <Card key={index} className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  {index + 1}. {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.answer}
                </div>
              </CardContent>
              {index < faqItems.length - 1 && (
                <div className="px-6 pb-6">
                  <Separator className="bg-border" />
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="mt-12 border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-card-foreground">
              Still have questions?
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Can't find the answer you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Contact Support
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;

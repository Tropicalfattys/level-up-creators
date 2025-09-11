
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FAQ = () => {
  const faqItems = [
    {
      question: "How does secure payment protection work?",
      answer: "All payments are securely held in our secure payment protection system until services are rendered. Once the creator delivers the service, funds are automatically released within 3 days unless a dispute is raised.\n\nIf a dispute is submitted, our dispute resolution system will review the case and make a fair ruling. There is no extra fee for dispute resolution (15% platform still collected)."
    },
    {
      question: "What are the platform fees?",
      answer: "Leveled Up charges a flat 15% platform fee. This covers the payment protection and dispute resolution service and management, blockchain transaction costs, and secure payouts to creators.\n\nCreators keep 85% of their earnings.\nThere are no additional fees for clients booking services or creators listing services."
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
      answer: "Security is a top priority. All funds are managed through our encrypted platform, and all communication between clients and creators is fully secured. We never share or sell your data."
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
      answer: "Creators: Crypto influencers, experts, and personalities offering shoutouts, AMAs, consultations, or other services.\nClients: Anyone looking to book a creator using cryptocurrency."
    },
    {
      question: "What is influencer marketing?",
      answer: "Influencer marketing is a digital marketing strategy that involves collaborating with individuals, known as influencers, who have a dedicated and engaged following on social media platforms and other online channels. These influencers can impact their followers' purchasing decisions due to their credibility and authority in specific niches or industries. Brands partner with influencers to promote their products or services authentically, build social proof, and leverage their influence to reach a larger and more targeted audience."
    },
    {
      question: "How does influencer marketing work?",
      answer: "Influencer marketing operates by identifying suitable influencers for your brand, establishing a partnership, and creating and distributing content through the influencer's channels. This content can take various forms, including sponsored posts, reviews, tutorials, or endorsements. The influencer shares this content with their audience, effectively introducing your brand or product to a potentially receptive and engaged audience. The key to successful influencer marketing lies in crafting authentic and relevant content that resonates with both the influencer's followers and your brand's message."
    },
    {
      question: "Why is influencer marketing important?",
      answer: "Influencer marketing is important because it enables brands to connect with their target audience in a more genuine and engaging manner. Unlike traditional advertising, influencer marketing feels less intrusive and more trustworthy, as recommendations come from a trusted source. It helps build brand awareness, improve credibility, drive traffic, boost sales, and foster lasting customer relationships."
    },
    {
      question: "How can I find the right influencers for my brand?",
      answer: "Start by identifying your target audience and the platforms they use. Then, use the LeveledUp influencer marketing platform to search for influencers within your niche. Use the filters for price & category and other available filters to narrow down relevant influencers as much as possible. Once you find an influencer offering services that you're interested in working with, you can simply purchase one of their pre-defined content packages, or send them a message to ask them to create a custom service and offer it directly through their profile for you to purchase."
    },
    {
      question: "What are the benefits of influencer marketing for my brand?",
      answer: "Influencer marketing helps expand your brand's reach, build trust and credibility through social proof, drive conversions, and can be more cost-effective than some traditional marketing methods. Additionally, influencer marketing allows you to tap into highly targeted and engaged audiences that may be challenging to reach through other means."
    },
    {
      question: "How much does influencer marketing cost?",
      answer: "The cost of influencer marketing varies widely depending on factors such as the influencer's reach, niche, and engagement rates. Micro-influencers with smaller followings may charge less than macro-influencers or celebrities. Some influencers may work on a per-post basis, while others prefer ongoing partnerships. If you have a budget in mind, consider using the price filters found in LeveledUp's search tool to narrow down the influencers that fit within your budget, this will save you time during the influencer discovery process."
    },
    {
      question: "How do I measure the success of an influencer marketing campaign?",
      answer: "To measure the success of an influencer marketing campaign, you can track key performance indicators (KPIs) such as click-through rates, conversions, and return on investment (ROI). Typically, this tracking would be done through your own means, such as a discount code or unique link that is used to track the influencer's impact on your side. Keep in mind that a large part of influencer marketing is social proof and social awareness, so many viewers may see your product and navigate to your website through other methods besides clicking the influencer's link directly. Additionally, you can gather feedback from the influencer and analyze audience sentiment to gauge the campaign's impact on brand perception."
    },
    {
      question: "What are the common mistakes to avoid in influencer marketing?",
      answer: "Common mistakes in influencer marketing include failing to define clear campaign objectives and expectations and neglecting to communicate changes in objectives, timelines, and other aspects that affect the outcome of the campaign. Another major downfall to many influencer marketing campaigns is the expectation that every campaign is going to hit your KPIs when in reality, brands should focus on collecting feedback and data so that they can constantly iterate on campaign objectives and angles until they hit their desired KPIs. It is heavily recommended you use the \"FREE\" chat function prior to and while engaging services from ANY creator to ensure your goals are clear!"
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

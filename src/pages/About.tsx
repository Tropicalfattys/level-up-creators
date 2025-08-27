
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card border-border">
            <CardContent className="p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                About Us
              </h1>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-6">
                <p className="text-lg leading-relaxed">
                  We didn't start this platform because we wanted another flashy crypto app.
                  We started it because we were tired.
                </p>
                
                <p className="leading-relaxed">
                  Tired of watching project founders throw money at self-proclaimed "influencers" who promised the world and delivered nothing. Tired of seeing creators with real reach and talent get buried under waves of scammers selling bot traffic, fake engagement, and broken promises. And most of all, tired of the endless cycle of wasted marketing budgets that helped no one—except the middlemen.
                </p>
                
                <p className="leading-relaxed">
                  So we did something about it.
                </p>
                
                <p className="leading-relaxed">
                  A handful of us—full-stack devs, front-end builders, network engineers, and product thinkers—came together after working on different Web3 projects. What connected us was the same frustration: the crypto space deserved a better system for connecting creators with clients. A system that was transparent, safe, and fair for both sides.
                </p>
                
                <p className="leading-relaxed">
                  That's how this platform was born.
                </p>
                
                <p className="leading-relaxed">
                  At its core, it's simple: creators can list their services openly, clients can book them directly, and both sides are protected by the cheapest, most efficient escrow possible. No inflated fees. No shady middlemen. No games. Just a straight line between the people offering value and the people willing to pay for it.
                </p>
                
                <p className="leading-relaxed">
                  We run lean by design. The platform only takes the bare minimum needed to keep things moving, because it wasn't created to feed some faceless corporation. It was created for the community—by community members who got tired of being taken advantage of.
                </p>
                
                <p className="leading-relaxed">
                  This is our way of changing how crypto marketing works.
                </p>
                
                <div className="space-y-2 font-medium">
                  <p>No more wasted money.</p>
                  <p>No more fake numbers.</p>
                  <p>No more scams.</p>
                </div>
                
                <p className="leading-relaxed">
                  Just real creators, real clients, and real results.
                </p>
                
                <p className="text-lg font-semibold text-primary">
                  Welcome to the future of booking in crypto.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Book, 
  User, 
  Search, 
  ShoppingCart, 
  MessageCircle, 
  Settings, 
  Share2, 
  Bell, 
  Shield, 
  CreditCard,
  Star,
  Crown,
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Video,
  DollarSign,
  Globe
} from "lucide-react";

const Documentation = () => {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Book,
      subsections: [
        { id: "platform-overview", title: "Platform Overview" },
        { id: "account-setup", title: "Account Setup & Verification" },
        { id: "supported-chains", title: "Supported Blockchains" }
      ]
    },
    {
      id: "browsing-booking",
      title: "Browsing & Booking",
      icon: Search,
      subsections: [
        { id: "browse-creators", title: "Browse Creators" },
        { id: "creator-tiers", title: "Creator Tiers" },
        { id: "booking-process", title: "Booking Process" },
        { id: "payment-flow", title: "Payment Flow" }
      ]
    },
    {
      id: "client-dashboard",
      title: "Client Dashboard",
      icon: User,
      subsections: [
        { id: "booking-statuses", title: "Booking Statuses" },
        { id: "payment-retry", title: "Payment Retry Process" },
        { id: "auto-release", title: "3-Day Auto-Release" },
        { id: "reviews-disputes", title: "Reviews & Disputes" }
      ]
    },
    {
      id: "creator-dashboard",
      title: "Creator Dashboard",
      icon: Crown,
      subsections: [
        { id: "services-management", title: "Services Management" },
        { id: "booking-management", title: "Booking Management" },
        { id: "earnings-payouts", title: "Earnings & Payouts" },
        { id: "video-intro", title: "Video Intro (Pro Tier)" }
      ]
    },
    {
      id: "messaging",
      title: "Messaging System",
      icon: MessageCircle,
      subsections: [
        { id: "chat-features", title: "Chat Features" },
        { id: "file-sharing", title: "File Sharing" },
        { id: "admin-support", title: "Admin Support" }
      ]
    },
    {
      id: "profile-settings",
      title: "Profile Settings",
      icon: Settings,
      subsections: [
        { id: "profile-fields", title: "Profile Fields" },
        { id: "social-media", title: "Social Media Links" },
        { id: "payout-wallets", title: "Payout Wallets" },
        { id: "verification-process", title: "Verification Process" }
      ]
    },
    {
      id: "referrals",
      title: "Referral System",
      icon: Share2,
      subsections: [
        { id: "how-referrals-work", title: "How Referrals Work" },
        { id: "sharing-links", title: "Sharing Referral Links" },
        { id: "cash-out", title: "Cash-Out Process" }
      ]
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      subsections: [
        { id: "booking-notifications", title: "Booking Notifications" },
        { id: "payment-notifications", title: "Payment Notifications" },
        { id: "system-notifications", title: "System Notifications" }
      ]
    },
    {
      id: "security",
      title: "Security & Safety",
      icon: Shield,
      subsections: [
        { id: "payment-protection", title: "Payment Protection" },
        { id: "dispute-resolution", title: "Dispute Resolution" },
        { id: "platform-fees", title: "Platform Fees" }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "getting-started":
        return (
          <div className="space-y-8">
            <div id="platform-overview">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                Platform Overview
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to our cryptocurrency-powered creator marketplace! This platform connects clients with verified creators who offer various services including video messages, live AMAs, tweet campaigns, product reviews, and how-to videos.
                </p>
                <p>
                  Our platform operates on a secure payment protection system where payments are held for 3 days after delivery, ensuring both clients and creators are protected throughout the transaction process.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Key Features
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Cryptocurrency payments only (USDC)</li>
                    <li>• Real-time messaging between clients and creators</li>
                    <li>• Secure payment protection system with 3-day protection period</li>
                    <li>• Creator tiers with different benefits and features</li>
                    <li>• Referral system with $1 credit per successful signup</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="account-setup">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Account Setup & Verification
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Getting started is simple! You can sign up using your email, or connect with Google, GitHub, or Twitter/X for faster registration.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">For Clients</h4>
                    <ol className="space-y-1 text-sm">
                      <li>1. Create your account</li>
                      <li>2. Complete your profile</li>
                      <li>3. Add payout wallet addresses</li>
                      <li>4. Start browsing creators!</li>
                    </ol>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">For Creators</h4>
                    <ol className="space-y-1 text-sm">
                      <li>1. Create your account</li>
                      <li>2. Apply to become a creator</li>
                      <li>3. Wait for admin approval</li>
                      <li>4. Set up your services and start earning!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div id="supported-chains">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-primary" />
                Supported Blockchains
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our platform currently supports USDC payments on multiple blockchain networks:
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Ethereum", desc: "Most established network", wallet: "MetaMask" },
                    { name: "Solana", desc: "Fast and low-cost", wallet: "Phantom" },
                    { name: "BSC (Binance)", desc: "Popular alternative", wallet: "MetaMask" },
                    { name: "Cardano", desc: "Eco-friendly option", wallet: "Supported wallets" },
                    { name: "SUI", desc: "Next-gen blockchain", wallet: "SUI Wallet" }
                  ].map((chain) => (
                    <div key={chain.name} className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium">{chain.name}</h4>
                      <p className="text-sm text-muted-foreground">{chain.desc}</p>
                      <p className="text-xs mt-1">Wallet: {chain.wallet}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "browsing-booking":
        return (
          <div className="space-y-8">
            <div id="browse-creators">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2 text-primary" />
                Browse Creators
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Discover amazing creators and their services using our powerful search and filtering tools.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Search & Filter Options</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Search by creator name or service type</li>
                    <li>• Filter by blockchain (Ethereum, Solana, BSC, etc.)</li>
                    <li>• Price range filtering</li>
                    <li>• Delivery time preferences</li>
                    <li>• Creator ratings and reviews</li>
                    <li>• Creator tier levels (Basic, Plus, Pro)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="creator-tiers">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2 text-primary" />
                Creator Tiers
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Creators are organized into three tiers, each with different benefits and features:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Badge variant="secondary" className="mr-2">Basic</Badge>
                      <span className="text-sm">Free</span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li>• Standard listing</li>
                      <li>• Basic profile features</li>
                      <li>• Text-based services</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Badge variant="outline" className="mr-2">Plus</Badge>
                      <span className="text-sm">$25 USDC</span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li>• Priority search placement</li>
                      <li>• Enhanced profile</li>
                      <li>• More service options</li>
                      <li>• Analytics access</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Badge className="mr-2">Pro</Badge>
                      <span className="text-sm">$50 USDC</span>
                    </div>
                    <ul className="space-y-1 text-sm">
                      <li>• Video intro upload</li>
                      <li>• Featured listing on homepage</li>
                      <li>• Top priority placement</li>
                      <li>• Rush job capabilities</li>
                      <li>• Featured creator badge</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="booking-process">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                Booking Process
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Booking a creator's service is straightforward and secure:
                </p>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Select Service", desc: "Choose the service you want from the creator's profile" },
                    { step: 2, title: "Review Details", desc: "Check price, delivery time, and service description" },
                    { step: 3, title: "Connect Wallet", desc: "Connect your cryptocurrency wallet (MetaMask, Phantom, etc.)" },
                    { step: 4, title: "Make Payment", desc: "Send exact USDC amount to secure payment protection system" },
                    { step: 5, title: "Chat Opens", desc: "Real-time chat automatically opens with the creator" },
                    { step: 6, title: "Delivery", desc: "Creator delivers your service within agreed timeframe" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="payment-flow">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Payment Flow
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  All payments are made using USDC cryptocurrency and held in secure payment protection system:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                    Payment Security
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Funds held in secure payment protection system until delivery</li>
                    <li>• 3-day protection period after delivery</li>
                    <li>• Automatic release if no disputes</li>
                    <li>• Full refund available for valid disputes</li>
                    <li>• Transaction hash recorded for verification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "client-dashboard":
        return (
          <div className="space-y-8">
            <div id="booking-statuses">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Booking Statuses
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Track your bookings through their entire lifecycle:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { status: "Paid", icon: CheckCircle, color: "text-green-500", desc: "Payment confirmed, creator notified" },
                    { status: "In Progress", icon: Clock, color: "text-blue-500", desc: "Creator is working on your request" },
                    { status: "Delivered", icon: FileText, color: "text-orange-500", desc: "Work completed, awaiting your review" },
                    { status: "Accepted", icon: CheckCircle, color: "text-green-500", desc: "You approved the delivery" },
                    { status: "Disputed", icon: AlertCircle, color: "text-red-500", desc: "Issue raised, admin reviewing" },
                    { status: "Released", icon: DollarSign, color: "text-green-500", desc: "Payment released to creator" }
                  ].map((item) => (
                    <div key={item.status} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <item.icon className={`h-4 w-4 mr-2 ${item.color}`} />
                        <h4 className="font-medium">{item.status}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="payment-retry">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-primary" />
                Payment Retry Process
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If a payment fails or gets rejected, you can easily retry:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What Happens When Payment Fails</h4>
                  <ol className="space-y-1 text-sm">
                    <li>1. You'll see a "Payment Rejected" notification</li>
                    <li>2. A "Retry Payment" button will appear</li>
                    <li>3. Click to connect wallet and try again</li>
                    <li>4. After resubmission, wait for verification</li>
                    <li>5. You'll be notified of the new payment status</li>
                  </ol>
                </div>
              </div>
            </div>

            <div id="auto-release">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                3-Day Auto-Release System
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our payment protection system automatically releases funds after 3 days to ensure creators get paid promptly:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How It Works</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• After creator marks work as delivered, 3-day timer starts</li>
                    <li>• You have 3 days to accept or dispute the delivery</li>
                    <li>• If no action taken, funds automatically release to creator</li>
                    <li>• You'll receive notifications at 24hrs, 12hrs, and 1hr remaining</li>
                    <li>• Even after auto-release, you can still leave a review</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="reviews-disputes">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-primary" />
                Reviews & Disputes
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      Reviews
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Leave reviews after delivery acceptance</li>
                      <li>• Rate creators 1-5 stars</li>
                      <li>• Write detailed feedback</li>
                      <li>• Helps other clients make decisions</li>
                      <li>• Creators can also review clients</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Disputes
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Open dispute if delivery doesn't meet expectations</li>
                      <li>• Must be opened within 3 days of delivery</li>
                      <li>• Admin team reviews all evidence</li>
                      <li>• Possible outcomes: refund, release, or partial</li>
                      <li>• All communications are recorded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "creator-dashboard":
        return (
          <div className="space-y-8">
            <div id="services-management">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                Services Management
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  As an approved creator, you can create and manage multiple services:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Service Types You Can Offer</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <ul className="space-y-1">
                      <li>• Personalized video messages</li>
                      <li>• Live AMA sessions</li>
                      <li>• Social media campaigns</li>
                      <li>• Product reviews</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• How-to tutorials</li>
                      <li>• Consultation calls</li>
                      <li>• Custom content creation</li>
                      <li>• And much more!</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Setting Up Services</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Set your own prices in USDC</li>
                    <li>• Choose delivery timeframes (1-30 days)</li>
                    <li>• Select which blockchain for payments</li>
                    <li>• Write detailed service descriptions</li>
                    <li>• Set service availability on/off</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="booking-management">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Booking Management
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Manage your bookings efficiently through the creator dashboard:
                </p>
                <div className="space-y-3">
                  {[
                    { step: "New Booking", desc: "Client pays, chat opens, you're notified" },
                    { step: "Work on Request", desc: "Communicate with client, work on deliverable" },
                    { step: "Upload Delivery", desc: "Upload your completed work to secure storage" },
                    { step: "Mark as Delivered", desc: "Notify client and start 3-day release timer" },
                    { step: "Get Paid", desc: "Receive payment after client accepts or 3 days pass" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.step}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="earnings-payouts">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Earnings & Payouts
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Track your earnings and set up payout wallets for each supported blockchain:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Earnings Breakdown</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• You receive 85% of each booking</li>
                      <li>• Platform takes 15% service fee</li>
                      <li>• Blockchain fees paid by clients</li>
                      <li>• Real-time earnings tracking</li>
                      <li>• Monthly earnings reports</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payout Setup</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Add wallet addresses for each chain</li>
                      <li>• Ethereum wallet for ETH bookings</li>
                      <li>• Solana wallet for SOL bookings</li>
                      <li>• Separate wallets for BSC, Cardano, SUI</li>
                      <li>• Manual payouts processed by admin</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="video-intro">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Video className="h-5 w-5 mr-2 text-primary" />
                Video Intro (Pro Tier)
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Pro tier creators can upload video introductions to showcase their personality and services:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Video Requirements</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Maximum 2 minutes duration</li>
                    <li>• High quality (720p minimum recommended)</li>
                    <li>• Professional presentation encouraged</li>
                    <li>• Introduce yourself and your services</li>
                    <li>• Show your personality and expertise</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Benefits</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Displayed prominently on your profile</li>
                    <li>• Higher conversion rates from visitors</li>
                    <li>• Build trust with potential clients</li>
                    <li>• Featured placement on homepage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "messaging":
        return (
          <div className="space-y-8">
            <div id="chat-features">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                Chat Features
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Real-time messaging keeps you connected with creators throughout your booking:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Chat Capabilities</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Real-time messaging</li>
                      <li>• File attachments and media sharing</li>
                      <li>• Read receipts and typing indicators</li>
                      <li>• Message history preservation</li>
                      <li>• Mobile-friendly interface</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">When Chats Open</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Automatically after successful payment</li>
                      <li>• Both parties get instant notification</li>
                      <li>• Accessible from dashboard "Messages" tab</li>
                      <li>• Remains active until booking complete</li>
                      <li>• Chat history preserved for reference</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="file-sharing">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                File Sharing
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Share files, images, and documents securely through the chat system:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Supported File Types</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <ul className="space-y-1">
                      <li>• Images (JPG, PNG, GIF)</li>
                      <li>• Documents (PDF, DOC, TXT)</li>
                      <li>• Videos (MP4, MOV, AVI)</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Audio files (MP3, WAV)</li>
                      <li>• Archive files (ZIP, RAR)</li>
                      <li>• Maximum 50MB per file</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="admin-support">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Admin Support
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our admin team can join any conversation to provide support and resolve issues:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">When Admins Get Involved</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Dispute resolution requests</li>
                    <li>• Payment verification issues</li>
                    <li>• Policy violation reports</li>
                    <li>• Technical support needs</li>
                    <li>• General platform questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile-settings":
        return (
          <div className="space-y-8">
            <div id="profile-fields">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Profile Fields
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Complete your profile to build trust and showcase your identity:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Display name (publicly visible)</li>
                      <li>• Profile bio/description</li>
                      <li>• Profile picture upload</li>
                      <li>• Location (optional)</li>
                      <li>• Languages spoken</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Creator Fields</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Professional headline</li>
                      <li>• Category/specialty</li>
                      <li>• Years of experience</li>
                      <li>• Certifications</li>
                      <li>• Notable achievements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="social-media">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                Social Media Links
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Connect your social media accounts to build credibility and showcase your online presence:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Supported Platforms</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <ul className="space-y-1">
                      <li>• Twitter/X (highly recommended)</li>
                      <li>• YouTube channel</li>
                      <li>• Instagram profile</li>
                      <li>• LinkedIn profile</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• TikTok account</li>
                      <li>• Telegram channel</li>
                      <li>• Discord server</li>
                      <li>• Personal website</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="payout-wallets">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-primary" />
                Payout Wallets
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Set up wallet addresses for receiving payments on different blockchains:
                </p>
                <div className="space-y-3">
                  {[
                    { chain: "Ethereum", desc: "For ETH network USDC payments", example: "0x742d..." },
                    { chain: "Solana", desc: "For Solana USDC payments", example: "9WzDXw..." },
                    { chain: "BSC", desc: "For Binance Smart Chain payments", example: "0x742d..." },
                    { chain: "Cardano", desc: "For Cardano network payments", example: "addr1..." },
                    { chain: "SUI", desc: "For SUI network payments", example: "0x12a4..." }
                  ].map((wallet) => (
                    <div key={wallet.chain} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{wallet.chain}</h4>
                          <p className="text-sm text-muted-foreground">{wallet.desc}</p>
                        </div>
                        <code className="text-xs bg-background px-2 py-1 rounded">{wallet.example}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="verification-process">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                Verification Process
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Get verified to build trust and unlock additional features:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Identity Verification</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Upload government ID</li>
                      <li>• Take selfie for comparison</li>
                      <li>• Admin review (1-3 business days)</li>
                      <li>• Get verified badge on profile</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Social Verification</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Link active social media accounts</li>
                      <li>• Minimum follower requirements may apply</li>
                      <li>• Account age and activity considered</li>
                      <li>• Enhanced profile credibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "referrals":
        return (
          <div className="space-y-8">
            <div id="how-referrals-work">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2 text-primary" />
                How Referrals Work
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Earn $1 in platform credits for every successful referral! Share your unique link and help grow our community.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">How to Earn</h4>
                    <ol className="space-y-1 text-sm">
                      <li>1. Share your unique referral link</li>
                      <li>2. Friend signs up using your link</li>
                      <li>3. They complete account verification</li>
                      <li>4. You earn $1 credit automatically</li>
                      <li>5. Credits appear in your account</li>
                    </ol>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Credit Usage</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Use credits for booking services</li>
                      <li>• Cash out when you reach minimum</li>
                      <li>• Credits never expire</li>
                      <li>• Track earnings in dashboard</li>
                      <li>• Real-time balance updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="sharing-links">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                Sharing Referral Links
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Multiple ways to share your referral link and maximize your earnings:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Sharing Options</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <ul className="space-y-1">
                      <li>• Direct link copying</li>
                      <li>• Twitter/X sharing</li>
                      <li>• Facebook sharing</li>
                      <li>• LinkedIn sharing</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Telegram sharing</li>
                      <li>• Email invitations</li>
                      <li>• QR code generation</li>
                      <li>• Custom referral codes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="cash-out">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Cash-Out Process
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Convert your earned credits to cryptocurrency when you're ready to cash out:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Cash-Out Requirements</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Minimum $10 balance required</li>
                      <li>• Verified account needed</li>
                      <li>• Valid wallet address on file</li>
                      <li>• Processing takes 1-3 business days</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Cash-Out Process</h4>
                    <ol className="space-y-1 text-sm">
                      <li>1. Click "Cash Out" in referrals section</li>
                      <li>2. Choose blockchain for payout</li>
                      <li>3. Confirm wallet address</li>
                      <li>4. Submit cash-out request</li>
                      <li>5. Receive USDC to your wallet</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-8">
            <div id="booking-notifications">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                Booking Notifications
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Stay informed about your bookings with real-time notifications:
                </p>
                <div className="space-y-3">
                  {[
                    { type: "New Booking", desc: "When someone books your service", icon: CheckCircle },
                    { type: "Payment Confirmed", desc: "When payment is verified and booking is active", icon: DollarSign },
                    { type: "Delivery Submitted", desc: "When creator marks work as delivered", icon: FileText },
                    { type: "Auto-Release Warning", desc: "24hrs, 12hrs, and 1hr before auto-release", icon: Clock },
                    { type: "Review Received", desc: "When you receive a new review", icon: Star },
                    { type: "Dispute Opened", desc: "When a dispute is raised on your booking", icon: AlertCircle }
                  ].map((notif) => (
                    <div key={notif.type} className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
                      <notif.icon className="h-5 w-5 mt-0.5 text-primary" />
                      <div>
                        <h4 className="font-medium">{notif.type}</h4>
                        <p className="text-sm text-muted-foreground">{notif.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="payment-notifications">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Payment Notifications
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Critical payment-related notifications ensure you never miss important updates:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Payment Alert Types</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Payment verification in progress</li>
                    <li>• Payment confirmed and booking activated</li>
                    <li>• Payment failed or rejected notifications</li>
                    <li>• Retry payment reminders</li>
                    <li>• Payout processed confirmations</li>
                    <li>• Refund issued notifications</li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="system-notifications">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                System Notifications
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Important platform updates and account-related notifications:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Account Notifications</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Account verification updates</li>
                      <li>• Creator application status</li>
                      <li>• Profile approval confirmations</li>
                      <li>• Security alerts</li>
                      <li>• Login from new devices</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Platform Updates</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• New features announcements</li>
                      <li>• Maintenance notifications</li>
                      <li>• Policy changes</li>
                      <li>• New blockchain integrations</li>
                      <li>• Community updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8">
            <div id="payment-protection">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Payment Protection
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our secure payment protection system protects both clients and creators throughout every transaction:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">For Clients</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Funds held in secure payment protection system</li>
                      <li>• Payment only released after delivery</li>
                      <li>• 3-day review period guaranteed</li>
                      <li>• Full refund for valid disputes</li>
                      <li>• No upfront payments to creators</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">For Creators</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Guaranteed payment after delivery</li>
                      <li>• Auto-release after 3 days if no disputes</li>
                      <li>• Protection against chargebacks</li>
                      <li>• Transparent fee structure (15%)</li>
                      <li>• Admin mediation for disputes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div id="dispute-resolution">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                Dispute Resolution
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Fair and transparent dispute resolution process protects all parties:
                </p>
                <div className="space-y-3">
                  {[
                    { step: "Dispute Opened", desc: "Client or creator opens dispute within 3 days of delivery" },
                    { step: "Evidence Collection", desc: "Both parties provide evidence and explanations" },
                    { step: "Admin Review", desc: "Experienced admin team reviews all evidence impartially" },
                    { step: "Resolution Decision", desc: "Fair decision made: full refund, full release, or partial split" },
                    { step: "Action Executed", desc: "Funds distributed according to admin decision" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.step}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="platform-fees">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Platform Fees
              </h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Transparent fee structure with no hidden costs:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      Client Fees
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>0%</strong> platform fees</li>
                      <li>• Only pay blockchain transaction fees</li>
                      <li>• Usually $1-5 depending on network</li>
                      <li>• No hidden charges or markups</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                      Creator Fees
                    </h4>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>15%</strong> platform fee</li>
                      <li>• Keep 85% of every booking</li>
                      <li>• No blockchain fees (paid by clients)</li>
                      <li>• Transparent fee calculation</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Fee Example</h4>
                  <p className="text-sm">
                    For a $100 USDC booking: Client pays $100 + blockchain fees (~$2-5). 
                    Creator receives $85 USDC. Platform keeps $15 USDC.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Section</h3>
            <p className="text-muted-foreground">Choose a topic from the navigation to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Book className="h-8 w-8 mr-3 text-primary" />
            Documentation
          </h1>
          <p className="text-muted-foreground">
            Complete guide to using our cryptocurrency creator marketplace
          </p>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Topics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="p-4 space-y-2">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <button
                          onClick={() => setActiveSection(section.id)}
                          className={`flex items-center w-full p-2 text-left rounded-lg transition-colors ${
                            activeSection === section.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <section.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="text-sm font-medium">{section.title}</span>
                        </button>
                        
                        {activeSection === section.id && section.subsections && (
                          <div className="ml-6 mt-1 space-y-1">
                            {section.subsections.map((subsection) => (
                              <a
                                key={subsection.id}
                                href={`#${subsection.id}`}
                                className="block p-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {subsection.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {renderContent()}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
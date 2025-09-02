
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex flex-wrap justify-center gap-8 text-sm">
          <Link 
            to="/about" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link 
            to="/browse" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse Creators
          </Link>
          <Link 
            to="/become-creator" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Become a Creator
          </Link>
          <Link 
            to="/careers" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Careers
          </Link>
          <Link 
            to="/faq" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          <Link 
            to="/contact" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
          <Link 
            to="/privacy" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link 
            to="/terms" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
};

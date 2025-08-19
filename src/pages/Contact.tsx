
import { ContactForm } from '@/components/contact/ContactForm';

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a question, need support, or want to provide feedback? 
          We're here to help and would love to hear from you.
        </p>
      </div>
      <ContactForm />
    </div>
  );
};

export default Contact;

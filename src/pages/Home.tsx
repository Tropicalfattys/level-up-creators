import React from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/layout/Hero';
import { Testimonials } from '@/components/layout/Testimonials';
import { FAQ } from '@/components/layout/FAQ';

const Home = () => {
  return (
    <div>
      <Hero />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">About</Link></li>
                <li><Link to="/careers" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li><Link to="/browse?category=trading" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Trading</Link></li>
                <li><Link to="/browse?category=nft" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">NFTs</Link></li>
                <li><Link to="/browse?category=defi" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">DeFi</Link></li>
                <li><Link to="/browse?category=gaming" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Gaming</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Browse</h3>
              <ul className="space-y-2">
                <li><Link to="/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Browse Creators</Link></li>
                <li><Link to="/become-creator" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Become a Creator</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Help</h3>
              <ul className="space-y-2">
                <li><Link to="/faq" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">FAQ</Link></li>
                <li><Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Twitter</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">LinkedIn</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              &copy; {new Date().getFullYear()} Your Company. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

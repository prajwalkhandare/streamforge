import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-darker py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-400">
          <div>
            <h4 className="text-white mb-3 font-semibold">About</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-3 font-semibold">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-3 font-semibold">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white transition">Cookie Preferences</a></li>
              <li><a href="#" className="hover:text-white transition">Corporate Info</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-3 font-semibold">Social</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-500 text-xs mt-8 pt-4 border-t border-gray-800">
          © 2024 StreamForge. All rights reserved. Built by Prajwal Khandare
        </div>
      </div>
    </footer>
  );
};

export default Footer;
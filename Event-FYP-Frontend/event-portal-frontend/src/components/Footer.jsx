import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
        {/* Logo + Description */}
        <div>
          <Link to="/" className="flex items-center gap-3">
            <span
              className="text-5xl font-bold relative"
              style={{ fontFamily: "Great Vibes, cursive" }}
            >
              <span className="text-[#9B59B6]">Event</span>
              <span className="text-yellow-500">ora</span>
              <span className="absolute left-0 bottom-0 w-full h-0.75 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
            </span>
          </Link>

          <p className="text-white/70 leading-relaxed">
            Your all-in-one campus event management platform.
            Discover, organize, and connect with ease.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Quick Links</h3>

          <ul className="space-y-3 text-white/70">
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Home</li>
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Events</li>
            <li className="hover:text-[#FFE66D] transition cursor-pointer">About</li>
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Contact</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Support</h3>

          <ul className="space-y-3 text-white/70">
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Help Center</li>
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Privacy Policy</li>
            <li className="hover:text-[#FFE66D] transition cursor-pointer">Terms &amp; Conditions</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Contact</h3>

          <p className="text-white/70 mb-2">support@eventora.com</p>
          <p className="text-white/70">University Campus</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-16 border-t border-white/10 py-6 text-center text-white/50 text-sm">
        {new Date().getFullYear()} Eventora. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;

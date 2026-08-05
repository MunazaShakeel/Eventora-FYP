import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Events click handler - same as Navbar
  const handleEventsClick = (e) => {
    e.preventDefault();
    
    if (window.location.pathname === "/") {
      const element = document.getElementById("upcoming-events");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById("upcoming-events");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    scrollToTop();
  };

  return (
    <footer className="bg-[#1A1A1A] text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
        
        {/* Logo + Description */}
        <div>
          <Link 
            to="/" 
            className="flex items-center gap-3"
            onClick={scrollToTop}
          >
            <span
              className="text-5xl font-bold relative"
              style={{ fontFamily: "Great Vibes, cursive" }}
            >
              <span className="text-[#9B59B6]">Event</span>
              <span className="text-yellow-500">ora</span>
              <span className="absolute left-0 bottom-0 w-full h-0.75 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
            </span>
          </Link>

          <p className="text-white/70 leading-relaxed mt-2">
            Your all-in-one campus event management platform.
            Discover, organize, and connect with ease.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Quick Links</h3>
          <ul className="space-y-3 text-white/70">
            <li>
              <button 
                onClick={() => handleNavigation('/')}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                Home
              </button>
            </li>
            <li>
              <button 
                onClick={handleEventsClick}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                Events
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/about')}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                About
              </button>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Support</h3>
          <ul className="space-y-3 text-white/70">
            
            <li>
              <button 
                onClick={() => handleNavigation('/faq')}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                FAQ
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/privacy')}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/terms')}
                className="hover:text-[#FFE66D] transition cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-[#4ECDC4]">Contact</h3>
          <p className="text-white/70 mb-3 flex items-center gap-2">
            <span className="text-[#4ECDC4]">✉️</span>
            <a 
              href="mailto:support@eventora.com" 
              className="hover:text-[#FFE66D] transition"
            >
              support@eventora.com
            </a>
          </p>
          <p className="text-white/70 flex items-center gap-2">
            <span className="text-[#4ECDC4]">📍</span>
            College Campus
          </p>
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
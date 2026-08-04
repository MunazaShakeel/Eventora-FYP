import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);
  const [mobileRegisterOpen, setMobileRegisterOpen] = useState(false);
  const navigate = useNavigate();

  // Refs for dropdowns
  const loginDropdownRef = useRef(null);
  const registerDropdownRef = useRef(null);
  const loginTimeoutRef = useRef(null);
  const registerTimeoutRef = useRef(null);

  const loginItems = [
    { label: "Student Login", to: "/student-login" },
    { label: "Organizer Login", to: "/login-organizer" },
    { label: "Admin Login", to: "/login-admin" },
  ];

  const registerItems = [
    { label: "Register as Student", to: "/student-register" },
    { label: "Register as Organizer", to: "/register-organizer" },
  ];

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      if (registerTimeoutRef.current) clearTimeout(registerTimeoutRef.current);
    };
  }, []);

  // Function to handle Events click
  const handleEventsClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
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

  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Stable login dropdown handlers
  const handleLoginMouseEnter = () => {
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
    setLoginOpen(true);
  };

  const handleLoginMouseLeave = () => {
    loginTimeoutRef.current = setTimeout(() => {
      setLoginOpen(false);
      loginTimeoutRef.current = null;
    }, 150);
  };

  // Stable register dropdown handlers
  const handleRegisterMouseEnter = () => {
    if (registerTimeoutRef.current) {
      clearTimeout(registerTimeoutRef.current);
      registerTimeoutRef.current = null;
    }
    setRegisterOpen(true);
  };

  const handleRegisterMouseLeave = () => {
    registerTimeoutRef.current = setTimeout(() => {
      setRegisterOpen(false);
      registerTimeoutRef.current = null;
    }, 150);
  };

  // Toggle handlers with proper state management
  const toggleMobileLogin = (e) => {
    e.stopPropagation();
    setMobileLoginOpen(prev => !prev);
    // Close register if open
    if (mobileRegisterOpen) {
      setMobileRegisterOpen(false);
    }
  };

  const toggleMobileRegister = (e) => {
    e.stopPropagation();
    setMobileRegisterOpen(prev => !prev);
    // Close login if open
    if (mobileLoginOpen) {
      setMobileLoginOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
    // Close mobile submenus when closing main menu
    if (mobileMenuOpen) {
      setMobileLoginOpen(false);
      setMobileRegisterOpen(false);
    }
  };

  // Close mobile menu when clicking a link
  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
    setMobileLoginOpen(false);
    setMobileRegisterOpen(false);
  };

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          
          {/* Logo - Left Side */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 z-50" onClick={handleMobileLinkClick}>
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-bold relative"
              style={{ fontFamily: "Great Vibes, cursive" }}
            >
              <span className="text-[#9B59B6]">Event</span>
              <span className="text-yellow-500">ora</span>
              <span className="absolute left-0 bottom-0 w-full h-0.5 bg-linear-to-r from-[#9B59B6] to-yellow-400 rounded-full"></span>
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
            <div className="flex gap-6 lg:gap-8 font-semibold text-[#1A1A1A]">
              <Link to="/" className="hover:text-[#9B59B6] transition">
                Home
              </Link>

              <button
                onClick={handleEventsClick}
                className="hover:text-[#9B59B6] transition cursor-pointer"
              >
                Events
              </button>

              <Link to="/about" className="hover:text-[#9B59B6] transition">
                About
              </Link>
            </div>
          </div>

          {/* Desktop Buttons - Right Side */}
          <div className="hidden md:flex gap-2 lg:gap-3 items-center">
            {/* Login Dropdown */}
            <div
              ref={loginDropdownRef}
              className="relative"
              onMouseEnter={handleLoginMouseEnter}
              onMouseLeave={handleLoginMouseLeave}
            >
              <button className="flex items-center gap-2 px-3 lg:px-5 py-1.5 lg:py-2 font-semibold border border-[#FFE66D] text-[#1A1A1A] hover:text-[#9B59B6] transition rounded-lg text-sm lg:text-base whitespace-nowrap">
                Login
                <span className={`text-[10px] transition-transform duration-200 ${loginOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>

              {loginOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-xl shadow-lg border border-purple-100 min-w-48 z-50 overflow-hidden">
                  {loginItems.map(({ label, to }, i) => (
                    <React.Fragment key={label}>
                      <Link
                        to={to}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-purple-50 hover:text-[#9B59B6] transition"
                      >
                        {label}
                      </Link>
                      {i < loginItems.length - 1 && (
                        <div className="h-px bg-purple-100" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Register Dropdown */}
            <div
              ref={registerDropdownRef}
              className="relative"
              onMouseEnter={handleRegisterMouseEnter}
              onMouseLeave={handleRegisterMouseLeave}
            >
              <button className="flex items-center gap-2 px-3 lg:px-5 py-1.5 lg:py-2 bg-[#9B59B6] text-white font-semibold rounded-lg hover:opacity-90 transition text-sm lg:text-base whitespace-nowrap">
                Register
                <span className={`text-[10px] transition-transform duration-200 ${registerOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>

              {registerOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-xl shadow-lg border border-purple-100 min-w-52 z-50 overflow-hidden">
                  {registerItems.map(({ label, to }, i) => (
                    <React.Fragment key={label}>
                      <Link
                        to={to}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-purple-50 hover:text-[#9B59B6] transition"
                      >
                        {label}
                      </Link>
                      {i < registerItems.length - 1 && (
                        <div className="h-px bg-purple-100" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden z-50 p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`w-full h-0.5 bg-gray-800 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden fixed inset-x-0 top-0 bg-white shadow-xl transition-all duration-300 ease-in-out z-40 ${mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}>
          <div className="pt-20 pb-6 px-4 space-y-4">
            {/* Mobile Nav Links */}
            <div className="space-y-3">
              <Link
                to="/"
                onClick={handleMobileLinkClick}
                className="block py-3 px-4 text-lg font-semibold text-[#1A1A1A] hover:bg-purple-50 hover:text-[#9B59B6] rounded-lg transition"
              >
                Home
              </Link>

              <button
                onClick={handleEventsClick}
                className="w-full text-left py-3 px-4 text-lg font-semibold text-[#1A1A1A] hover:bg-purple-50 hover:text-[#9B59B6] rounded-lg transition"
              >
                Events
              </button>

              <Link
                to="/about"
                onClick={handleMobileLinkClick}
                className="block py-3 px-4 text-lg font-semibold text-[#1A1A1A] hover:bg-purple-50 hover:text-[#9B59B6] rounded-lg transition"
              >
                About
              </Link>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Mobile Login Section */}
            <div className="space-y-2">
              <button
                onClick={toggleMobileLogin}
                className="w-full flex items-center justify-between py-3 px-4 text-lg font-semibold text-[#1A1A1A] hover:bg-purple-50 rounded-lg transition"
              >
                <span>Login</span>
                <span className={`text-xs transition-transform duration-200 ${mobileLoginOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>
              
              {mobileLoginOpen && (
                <div className="ml-4 space-y-2">
                  {loginItems.map(({ label, to }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={handleMobileLinkClick}
                      className="block py-2 px-4 text-base text-gray-600 hover:bg-purple-50 hover:text-[#9B59B6] rounded-lg transition"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Register Section */}
            <div className="space-y-2">
              <button
                onClick={toggleMobileRegister}
                className="w-full flex items-center justify-between py-3 px-4 text-lg font-semibold text-[#9B59B6] hover:bg-purple-50 rounded-lg transition"
              >
                <span>Register</span>
                <span className={`text-xs transition-transform duration-200 ${mobileRegisterOpen ? "rotate-180" : "rotate-0"}`}>▼</span>
              </button>
              
              {mobileRegisterOpen && (
                <div className="ml-4 space-y-2">
                  {registerItems.map(({ label, to }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={handleMobileLinkClick}
                      className="block py-2 px-4 text-base text-gray-600 hover:bg-purple-50 hover:text-[#9B59B6] rounded-lg transition"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileMenu}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
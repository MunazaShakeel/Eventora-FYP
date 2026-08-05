import React, { useEffect, useRef, useState } from "react";
import {
  UserCheck,
  CalendarCheck,
  Award,
  ShieldAlert,
  Mail,
  Globe,
  Smartphone,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";

const COLORS = {
  purple: "#9B59B6",
  turquoise: "#4ECDC4",
  coral: "#FF6B6B",
  yellow: "#FFE66D",
  dark: "#1A1A1A",
};

const sections = [
  {
    icon: UserCheck,
    title: "Account Responsibility",
    color: COLORS.purple,
    gradient: "from-purple-50 to-purple-100/30",
    list: [
      "Keep your login credentials confidential and secure",
      "Provide accurate and up-to-date profile information",
      "You are solely responsible for all activity under your account",
      "Report any unauthorized access immediately",
    ],
  },
  {
    icon: CalendarCheck,
    title: "Event Participation",
    color: COLORS.turquoise,
    gradient: "from-teal-50 to-teal-100/30",
    list: [
      "All events are subject to admin approval before publication",
      "Registration does not guarantee event changes won't occur",
      "Follow event-specific rules set by Organizers",
      "Organizers reserve the right to modify event details",
    ],
  },
  {
    icon: Award,
    title: "Certificates & Recognition",
    color: COLORS.coral,
    gradient: "from-red-50 to-red-100/30",
    list: [
      "Certificates are issued only after successful event completion",
      "Certificates are non-transferable and role-specific",
      "Digital certificates can be downloaded from your dashboard",
      "Each certificate includes a unique verification code",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Fair Use & Conduct",
    color: COLORS.purple,
    gradient: "from-purple-50 to-purple-100/30",
    list: [
      "Do not misuse the platform or attempt unauthorized access",
      "Uploaded gallery content must be appropriate and event-related",
      "Respect other users and maintain professional conduct",
      "Any violation may result in account suspension",
    ],
  },
  {
    icon: Globe,
    title: "Intellectual Property",
    color: COLORS.turquoise,
    gradient: "from-teal-50 to-teal-100/30",
    list: [
      "All content on Eventora is protected by copyright",
      "Users retain ownership of their submitted content",
      "Eventora may use submitted content for promotional purposes",
      "Unauthorized reproduction is strictly prohibited",
    ],
  },
  {
    icon: Smartphone,
    title: "Platform Usage",
    color: COLORS.coral,
    gradient: "from-red-50 to-red-100/30",
    list: [
      "Eventora is optimized for desktop and mobile devices",
      "Some features may require JavaScript enabled",
      "Users must have a stable internet connection",
      "Platform updates will be communicated in advance",
    ],
  },
];

const Terms = () => {
  const [visibleItems, setVisibleItems] = useState([]);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index);
            setVisibleItems((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2, rootMargin: "50px" }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Matches Privacy Page */}
        <div
          className="relative overflow-hidden py-20 px-6"
          style={{
            background: `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.turquoise} 100%)`,
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <FileText size={16} className="text-white" />
              <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">
                Legal Agreement
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Terms & Conditions
            </h1>
            
            <p className="text-white/90 text-base max-w-xl mx-auto leading-relaxed">
              By using Eventora, you agree to comply with and be bound by the following terms.
              Please read these terms carefully before using our platform.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <Clock size={14} className="text-white/70" />
                <span className="text-white/70 text-xs font-medium">Last Updated: August 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <CheckCircle size={14} className="text-white/70" />
                <span className="text-white/70 text-xs font-medium">Effective Immediately</span>
              </div>
            </div>

            {/* Decorative separator */}
            <div className="flex justify-center gap-3 mt-6">
              <div className="w-12 h-1 rounded-full bg-white/30" />
              <div className="w-12 h-1 rounded-full bg-white/50" />
              <div className="w-12 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* Content Grid - Cards overlap hero */}
        <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec, index) => {
              const Icon = sec.icon;
              const isVisible = visibleItems.includes(index);

              return (
                <div
                  key={index}
                  ref={(el) => (sectionRefs.current[index] = el)}
                  data-index={index}
                  className={`bg-white rounded-2xl p-6 shadow-xl border border-gray-100 transition-all duration-700 transform ${
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-12 scale-95"
                  } hover:shadow-2xl hover:-translate-y-1 cursor-default`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                    borderTop: `4px solid ${sec.color}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110 duration-300"
                      style={{ backgroundColor: `${sec.color}15` }}
                    >
                      <Icon size={22} style={{ color: sec.color }} />
                    </div>
                    <h2 className="text-base font-bold text-[#1A1A1A] leading-tight">
                      {sec.title}
                    </h2>
                  </div>

                  <ul className="space-y-3">
                    {sec.list.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-gray-600 text-sm group"
                      >
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full shrink-0 transition-all group-hover:scale-125"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Bottom indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-medium">
                      Section {index + 1}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full opacity-40"
                      style={{ backgroundColor: sec.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Section */}
          <div
            className="mt-8 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.purple}08 0%, ${COLORS.turquoise}08 100%)`,
              border: `1px solid ${COLORS.purple}20`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${COLORS.purple}15` }}
              >
                <Mail size={20} style={{ color: COLORS.purple }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Questions About Terms?</p>
                <p className="text-gray-500 text-sm">
                  Our team is here to help you
                </p>
              </div>
            </div>
            <a
              href="mailto:support@eventora.com"
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.turquoise})`,
              }}
            >
              <Mail size={16} />
              support@eventora.com
            </a>
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
            <a
              href="/faq"
              className="text-gray-400 hover:text-[#9B59B6] transition-all hover:scale-105"
            >
              FAQ
            </a>
            <a
              href="/privacy"
              className="text-gray-400 hover:text-[#9B59B6] transition-all hover:scale-105"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
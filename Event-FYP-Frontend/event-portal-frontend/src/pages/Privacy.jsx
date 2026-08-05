import React from "react";
import {
  Database,
  Settings,
  ShieldCheck,
  UserCog,
  Lock,
  Mail,
  Calendar,
  Award,
  QrCode,
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
    icon: Database,
    title: "Information We Collect",
    color: COLORS.purple,
    content:
      "We collect information you provide when creating an account, registering for events, or contacting us. This includes your name, email address, department, semester, phone number, and role (Student, Volunteer, Organizer, or Admin).",
  },
  {
    icon: Settings,
    title: "How We Use Your Information",
    color: COLORS.turquoise,
    list: [
      "To manage your account and event registrations",
      "To send event updates and task notifications",
      "To generate and issue certificates automatically",
      "To mark and track attendance via QR codes",
      "To generate reports and improve our services",
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    color: COLORS.coral,
    content:
      "All data transmitted within Eventora is protected using TLS/SSL encryption. We apply role-based access control so users can only view and manage information relevant to their role. Passwords are stored securely, and the system is safeguarded against common web attacks such as SQL injection and cross-site scripting. We do not sell or share your personal information with third parties.",
  },
  {
    icon: UserCog,
    title: "Your Rights",
    color: COLORS.purple,
    list: [
      "Access the personal data we hold about you",
      "Update or correct your profile information",
      "Request deletion of your account",
      "Withdraw consent for non-essential communications",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    color: COLORS.turquoise,
    content:
      "Eventora enforces strict role-based permissions across the platform. Admins, Organizers, and Students/Volunteers each have access limited to the features and data relevant to their role, ensuring sensitive information is only visible to authorized users.",
  },
];

const Privacy = () => {
  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Directly below navbar */}
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
              <ShieldCheck size={16} className="text-white" />
              <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">
                Your Privacy Matters
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-white/90 text-base max-w-xl mx-auto leading-relaxed">
              We are committed to protecting your privacy and ensuring the security of your personal information.
            </p>
            <p className="text-white/60 text-sm mt-4">
              Last Updated: August 2026
            </p>
            
            {/* Decorative separator */}
            <div className="flex justify-center gap-3 mt-6">
              <div className="w-12 h-1 rounded-full bg-white/30" />
              <div className="w-12 h-1 rounded-full bg-white/50" />
              <div className="w-12 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* Content Section - Cards overlapping hero */}
        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10 pb-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 divide-y divide-gray-100">
            {sections.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div key={i} className="p-6 md:p-8 hover:bg-gray-50/50 transition duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${sec.color}15` }}
                    >
                      <Icon size={20} style={{ color: sec.color }} />
                    </div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                      {sec.title}
                    </h2>
                  </div>

                  {sec.content && (
                    <p className="text-gray-600 leading-relaxed ml-1">
                      {sec.content}
                    </p>
                  )}

                  {sec.list && (
                    <ul className="space-y-2.5 ml-1">
                      {sec.list.map((item, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-3 text-gray-600"
                        >
                          <span
                            className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: sec.color }}
                          />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Section */}
          <div
            className="mt-8 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
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
                <p className="text-sm font-semibold text-[#1A1A1A]">Have Questions?</p>
                <p className="text-gray-500 text-sm">
                  For any privacy concerns, contact us at
                </p>
              </div>
            </div>
            <a
              href="mailto:support@eventora.com"
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:scale-105 shadow-md"
              style={{ background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.turquoise})` }}
            >
              support@eventora.com
            </a>
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
           
            <a href="/faq" className="hover:text-[#9B59B6] transition">FAQ</a>
            <a href="/terms" className="hover:text-[#9B59B6] transition">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { HelpCircle, Mail, MessageCircle, FileText, ChevronDown } from "lucide-react";

const COLORS = {
  purple: "#9B59B6",
  turquoise: "#4ECDC4",
  coral: "#FF6B6B",
  yellow: "#FFE66D",
  dark: "#1A1A1A",
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is Eventora?",
      answer: "Eventora is a college event management platform that helps students discover events, organizers to manage events, and administrators to oversee everything."
    },
    {
      question: "How do I register for an event?",
      answer: "Browse events from the home page, click on an event you're interested in, and click the 'Register' button."
    },
    {
      question: "How do I become an Organizer?",
      answer: "Click on 'Register' and select 'Register as Organizer'. Fill in the required details and your account is ready to use."
    },
    {
      question: "Why don't my events show up right away?",
      answer: "Events created by Organizers are reviewed by the Admin first. Once approved, they become visible to everyone."
    },
    {
      question: "What is the certificate system?",
      answer: "After completing an event, organizers can issue certificates to participants. You can view and download your certificates from your dashboard."
    },
    {
      question: "How do I track my tasks?",
      answer: "Login to your dashboard and go to the Tasks section. You can see all assigned tasks and update their status."
    },
    {
      question: "Is Eventora free?",
      answer: "Yes! Eventora is completely free for all students, organizers, and admins."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section - Fixed: No gap between navbar and hero */}
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
              <HelpCircle size={16} className="text-white" />
              <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">
                Got Questions?
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            
            <p className="text-white/90 text-base max-w-xl mx-auto leading-relaxed">
              Find answers to the most common questions about Eventora.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <MessageCircle size={14} className="text-white/70" />
                <span className="text-white/70 text-xs font-medium">7 Common Questions</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <FileText size={14} className="text-white/70" />
                <span className="text-white/70 text-xs font-medium">Updated Regularly</span>
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

        {/* Content - Overlapping hero */}
        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10 pb-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 divide-y divide-gray-100">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="p-6 md:p-8 hover:bg-gray-50/50 transition duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left flex justify-between items-center gap-4 group"
                >
                  <span className="font-semibold text-gray-800 text-sm md:text-base group-hover:text-[#9B59B6] transition">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    size={20}
                    className={`text-[#9B59B6] transition-transform duration-300 shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {openIndex === index && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-gray-600 text-sm leading-relaxed animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
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
                <p className="text-sm font-semibold text-[#1A1A1A]">Still have questions?</p>
                <p className="text-gray-500 text-sm">
                  We're here to help you out
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
              href="/privacy"
              className="text-gray-400 hover:text-[#9B59B6] transition-all hover:scale-105"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-gray-400 hover:text-[#9B59B6] transition-all hover:scale-105"
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default FAQ;
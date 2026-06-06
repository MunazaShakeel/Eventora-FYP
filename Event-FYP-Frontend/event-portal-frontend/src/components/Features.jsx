import React from "react";

// Import Icons
import discovery from "../assets/calendar.png";
import qr from "../assets/qr.png";
import certificate from "../assets/certificate.png";
import task from "../assets/schedule.png";
import analytics from "../assets/analytics.png";
import gallery from "../assets/photos.png";

const Features = () => {

  const features = [
    {
      icon: discovery,
      title: "Event Discovery",
      desc: "Browse all upcoming campus events. Filter by category, department, or date.",
    },
    {
      icon: qr,
      title: "QR Attendance",
      desc: "Instant check-in via QR code scanning. No queues, no paper, no hassle.",
    },
    {
      icon: certificate,
      title: "Auto Certificates",
      desc: "Certificates generated and sent automatically after each event.",
    },
    {
      icon: task,
      title: "Task Management",
      desc: "Assign and track volunteer tasks. Keep your team aligned and on time.",
    },
    {
      icon: analytics,
      title: "Reports & Analytics",
      desc: "Admin dashboards with real-time data on registrations and attendance.",
    },
    {
      icon: gallery,
      title: "Gallery Management",
      desc: "Curated photo galleries for every event — showcase memories beautifully.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">

      {/* Section Header */}
      <div className="text-center mb-16 px-6">

        <div className="inline-block px-4 py-2 mb-6 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-bold uppercase tracking-widest">
          ✦ What We Offer
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4">
          Everything to Run <br /> Great Campus Events
        </h2>

        <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
          From discovery to certificates — all the tools you need, built right in.
        </p>

      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">

        {features.map((item, index) => (
          <div
            key={index}
            className="p-8 rounded-4xl border-5 border-[#9B59B6] shadow-fuchsia-300 hover:shadow-xl transition transform hover:-translate-y-2 bg-[#faf5f5]  text-center"
          >

            {/* Icon Image */}
            <img
              src={item.icon}
              alt={item.title}
              className="w-14 h-14 mb-4 mx-auto"
            />

            {/* Title */}
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-[#1A1A1A]/70">
              {item.desc}
            </p>

          </div>
        ))}

      </div>

    </section>
  );
};

export default Features;
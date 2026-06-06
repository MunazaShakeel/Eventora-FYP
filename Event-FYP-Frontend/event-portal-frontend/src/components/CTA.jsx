import React from "react";
import { Link } from "react-router-dom";
import ctaImage from "../assets/cta.png";

const CTA = () => {
  return (
    <section className="bg-[#8b42ad] py-15 px-6 overflow-hidden relative">

      {/* Background Blur Effects */}
   
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">

        {/* Left Content */}
        <div className="w-full md:w-1/2 text-white">

          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">

            Discover{" "}
            <span className="relative inline-block text-[#FFE66D]">
              Amazing Events

              {/* Underline */}
              <span className="absolute bottom-0 left-0 w-full h-2 bg-[#FFE66D] -rotate-2 opacity-70"></span>

            </span>

          </h2>

          <p className="text-lg text-white/90 max-w-md">
            Join exciting workshops, seminars, and campus activities.
            Stay connected with your campus community through Eventora.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
           <Link to="/student-login">
            <button className="bg-[#FFE66D] text-[#1A1A1A] font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition">
              Explore Events
            </button>
          </Link>

           <Link to="/login-organizer">
           <button className="bg-white text-[#9B59B6] font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition">
                 Create Event
          </button>
          </Link>

          </div>

        </div>

        {/* Right Image */}
        <div className="w-full md:w-1/3 flex justify-center">

          <img
            src={ctaImage}
            alt="Eventora CTA"
            className="w-full max-w-md"
          />

        </div>

      </div>

    </section>
  );
};

export default CTA;
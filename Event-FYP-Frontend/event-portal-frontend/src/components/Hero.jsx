import React from "react";
import { useNavigate } from "react-router-dom";



const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-24 lg:py-25 overflow-hidden bg-white">

      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-3 bg-[#FFE66D]"></div>

        <div className="absolute -top-24 -left-24 w-125 h-125 bg-[#FFE66D]/40 rounded-full blur-[120px]"></div>

        <div className="absolute -bottom-32 -right-32 w-150 h-150 bg-[#4ECDC4]/30 rounded-full blur-[140px]"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-125 bg-[#9B59B6]/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">

        {/* Badge */}
        <div className="inline-block px-6 py-2 mb-8 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-sm">
          Unlock Campus Experiences
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-[#1A1A1A] leading-tight mb-8">
          Your Campus,{" "}
          <span className="text-[#9B59B6]">Vibrant</span> & Connected
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-xl text-[#1A1A1A]/80 mb-12 leading-relaxed font-medium">
          Join, organize, and explore campus events in one unified platform.
          Stay connected with your campus community and never miss important opportunities.
        </p>

        {/* Buttons */}
        <div className="flex flex-col  sm:flex-row justify-center gap-6">
          

         <button 
  onClick={() => navigate("/student-register")}
  className="px-10 py-5 bg-[#9B59B6] text-white font-extrabold rounded-3xl shadow-2xl shadow-[#9B59B6]/40 hover:brightness-110 transition-all transform hover:-translate-y-1 cursor-pointer"
>
  Explore All Events
</button>
          

        </div>

      </div>
    </section>
  );
};

export default Hero;

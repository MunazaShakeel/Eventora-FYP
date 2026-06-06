import React from 'react';

const GalleryHero = ({
  selectedEvent,
  searchQuery,
  searchedEvents,
  setSelectedEvent,
  setActiveFilter,
  setSearchQuery,
  setMediaItems
}) => {
  return (
    <section className="sg-fadein relative mb-10 overflow-hidden rounded-2xl p-8 md:p-12 shadow-hero 
    bg-linear-to-br  ">
<div className="absolute top-0 left-0 w-full h-3 bg-[#FFE66D]"></div>

        <div className="absolute -top-24 -left-24 w-125 h-125 bg-[#4ECDC4]/30 rounded-full blur-[120px]"></div>

        <div className="absolute -bottom-32 -right-32 w-150 h-150  bg-[#FFE66D]/40  rounded-full blur-[140px]"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-125 bg-[#9B59B6]/10 rounded-full blur-[150px]"></div>
      

      <div className="relative z-10 max-w-2xl">

       {/* Badge */}
        <div className="inline-block px-6 py-2 mb-8 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-sm">
          Campus Gallery
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-[#1A1A1A] leading-tight mb-8">
          Campus  {" "}
          <span className="text-[#9B59B6]">Memories</span> 
        </h1>


        {/* Description */}
        <p className="text-black text-sm md:text-base leading-relaxed mb-5  max-w-xl">
          Relive your best academic moments — festivals, hackathons, sports, and unforgettable campus memories.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">

          <button
            onClick={() => {
              setSelectedEvent('');
              setActiveFilter('All');
              setSearchQuery('');
              setMediaItems([]);
            }}
            className={`sg-pill rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer
              ${!selectedEvent && !searchQuery
                ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-black hover:bg-white/20 '
              }`}
          >
            All Memories
          </button>

          {searchedEvents.slice(0, 5).map(ev => (
            <button
              key={ev._id}
              onClick={() => {
                setSelectedEvent(ev._id);
                setActiveFilter('All');
                setMediaItems([]);
                setSearchQuery('');
              }}
              className={`sg-pill rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer max-w-40 truncate
                ${selectedEvent === ev._id
                  ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-black hover:bg-white/20'
                }`}
            >
              {ev.title}
            </button>
          ))}

        </div>
      </div>
    </section>
  );
};

export default GalleryHero;
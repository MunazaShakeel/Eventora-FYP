import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StudentSidebar from '../../components/StudentSidebar';
import GalleryHero from '../../components/StudentGallery/GalleryHero';
import LightboxModal from '../../components/StudentGallery/LightboxModal';
const delay = (i) => ({ animationDelay: `${i * 60}ms` });

const StudentGallery = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gallery_saved') || '[]'); }
    catch { return []; }
  });
  const [toast, setToast] = useState(null);
  const [shareModal, setShareModal] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const BASE_URL = 'http://localhost:5000';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Fetch registered events
  useEffect(() => {
  (async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/registrations/my-registrations`, { headers });
      const registrations = res.data?.data || [];
      
      const evList = registrations.map(r => r.event_id).filter(e => e && typeof e === 'object');
      
      console.log('Events with images:', evList.map(e => ({ 
        title: e.title, 
        image_url: e.image_url
      })));
      
      setEvents(evList);
    } catch (err) {
      console.error('Events fetch error:', err);
    }
    finally { setLoadingEvents(false); }
  })();
}, []);

  // Fetch gallery
  useEffect(() => {
    if (!selectedEvent) { setMediaItems([]); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/gallery/event/${selectedEvent}`, { headers });
        setMediaItems(res.data || []);
      } catch { setMediaItems([]); }
      finally { setLoading(false); }
    })();
  }, [selectedEvent]);

  // Keyboard navigation
  useEffect(() => {
    const h = (e) => {
      if (!lightbox) return;
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'ArrowLeft') prevMedia();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightbox, lightboxIndex]);

  const searchedEvents = searchQuery.trim()
    ? events.filter(ev => ev.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : events;

  const filteredMedia = mediaItems.filter(item => {
    if (activeFilter === 'Images') return item.media_type === 'Image';
    if (activeFilter === 'Videos') return item.media_type === 'Video';
    if (activeFilter === 'Saved') return savedItems.includes(item._id);
    return true;
  });

  const imageCount = mediaItems.filter(m => m.media_type === 'Image').length;
  const videoCount = mediaItems.filter(m => m.media_type === 'Video').length;
  const savedCount = mediaItems.filter(m => savedItems.includes(m._id)).length;
  const getEventTitle = () => events.find(e => e._id === selectedEvent)?.title || '';

  const openLightbox = (item) => {
    setLightboxIndex(filteredMedia.findIndex(m => m._id === item._id));
    setLightbox(item);
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => { setLightbox(null); document.body.style.overflow = ''; };

  const prevMedia = useCallback((e) => {
    e?.stopPropagation();
    const i = (lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length;
    setLightboxIndex(i); setLightbox(filteredMedia[i]);
  }, [lightboxIndex, filteredMedia]);

  const nextMedia = useCallback((e) => {
    e?.stopPropagation();
    const i = (lightboxIndex + 1) % filteredMedia.length;
    setLightboxIndex(i); setLightbox(filteredMedia[i]);
  }, [lightboxIndex, filteredMedia]);

  const toggleSave = (e, itemId) => {
    e.stopPropagation();
    setSavedItems(prev => {
      const next = prev.includes(itemId) ? prev.filter(x => x !== itemId) : [...prev, itemId];
      localStorage.setItem('gallery_saved', JSON.stringify(next));
      showToast(next.includes(itemId) ? '✦ Saved to collection' : 'Removed from collection',
                next.includes(itemId) ? 'success' : 'info');
      return next;
    });
  };

  const downloadItem = async (e, item) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`${BASE_URL}${item.media_url}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-memory-${item._id}${item.media_type === 'Video' ? '.mp4' : '.jpg'}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('⬇ Download started');
    } catch { showToast('Download failed', 'error'); }
  };

  const openShare = (e, item) => { e.stopPropagation(); setShareModal(item); };
  const copyLink = () => { navigator.clipboard.writeText(`${BASE_URL}${shareModal.media_url}`); showToast('🔗 Link copied!'); setShareModal(null); };
  const shareNative = () => {
    if (navigator.share) navigator.share({ title: 'Campus Memory', url: `${BASE_URL}${shareModal.media_url}` });
    else copyLink();
    setShareModal(null);
  };

  const gradientPairs = [
    'from-purple-600 to-pink-500', 'from-teal-600 to-emerald-500', 'from-orange-600 to-red-500',
    'from-blue-600 to-purple-500', 'from-green-600 to-teal-500', 'from-amber-600 to-orange-500',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sg-fadein { animation: fadeUp 0.5s ease both; }
        .sg-spin { animation: spin 0.8s linear infinite; }
        .sg-card { transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
        .sg-card:hover { transform: translateY(-6px) scale(1.012); box-shadow: 0 18px 44px rgba(124, 58, 237, 0.2) !important; }
        .sg-card:hover .sg-actions { opacity: 1 !important; }
        .sg-card:hover .sg-info-strip { opacity: 1 !important; }
        .sg-pill { transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .sg-pill:hover { transform: scale(1.06); }
        .sg-hcard { transition: transform 0.28s ease, box-shadow 0.28s ease; }
        .sg-hcard:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28) !important; }
        .sg-hcard:hover .sg-hcard-overlay { opacity: 1 !important; }
        .sg-noscroll::-webkit-scrollbar { display: none; }
        .sg-noscroll { scrollbar-width: none; }

        /* Responsive Masonry - Mobile optimized */
        @media (max-width: 640px) { 
          .sg-masonry { 
            column-count: 2 !important; 
            gap: 8px !important;
          }
          .sg-masonry .sg-card {
            margin-bottom: 8px !important;
            border-radius: 10px !important;
          }
        }
        @media (max-width: 420px) { 
          .sg-masonry { 
            column-count: 2 !important; 
            gap: 6px !important;
          }
          .sg-masonry .sg-card {
            margin-bottom: 6px !important;
            border-radius: 8px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) { 
          .sg-masonry { 
            column-count: 2 !important; 
            gap: 14px !important;
          }
        }
        @media (min-width: 1025px) { 
          .sg-masonry { 
            column-count: 3 !important; 
            gap: 18px !important;
          }
        }
        
        /* Sidebar responsive */
        @media (max-width: 768px) {
          .sg-main { margin-left: 0 !important; }
          .sg-header { left: 0 !important; padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .sg-content { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        }
        
        /* Hero card responsive - smaller on mobile */
        @media (max-width: 480px) {
          .sg-hcard { 
            width: 130px !important; 
            flex: 0 0 130px !important;
          }
          .sg-hcard .h-44 { 
            height: 130px !important; 
          }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .sg-hcard { 
            width: 170px !important; 
            flex: 0 0 170px !important;
          }
        }
        
        /* Mobile filter pills - smaller */
        @media (max-width: 640px) {
          .sg-pill { 
            font-size: 0.6rem !important; 
            padding: 0.4rem 0.65rem !important;
          }
          .sg-pill .material-symbols-outlined {
            font-size: 0.8rem !important;
          }
        }

        /* Mobile action buttons - smaller */
        @media (max-width: 640px) {
          .sg-actions .sg-icon-btn {
            width: 24px !important;
            height: 24px !important;
          }
          .sg-actions .sg-icon-btn .material-symbols-outlined {
            font-size: 0.7rem !important;
          }
        }

        /* Hide scrollbar */
        .sg-noscroll::-webkit-scrollbar { display: none; }
        .sg-noscroll { scrollbar-width: none; }

        /* Fix for small screens */
        @media (max-width: 380px) {
          .sg-masonry { 
            column-count: 2 !important; 
            gap: 4px !important;
          }
          .sg-masonry .sg-card {
            margin-bottom: 4px !important;
            border-radius: 6px !important;
          }
        }
      `}</style>

      <div className="flex min-h-screen bg-[#faf8fc] font-['DM_Sans',sans-serif]">
        <StudentSidebar />

        <main className="sg-main flex-1 min-h-screen md:ml-64">
          {/* HEADER */}
          <header className="sg-header fixed top-0 right-0 z-50 flex flex-wrap items-center justify-between gap-1 px-2 sm:px-4 md:px-8 py-2 sm:py-3 bg-white/90 backdrop-blur-md border-b border-purple-200/20 md:left-64">
            <div className="relative flex-1 min-w-35 max-w-full md:max-w-md">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">search</span>
              <input type="text" placeholder="Search events…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedEvent(''); setMediaItems([]); }}
                className="w-full rounded-full border border-purple-200/40 bg-white py-1.5 sm:py-2 pl-7 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm text-gray-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSelectedEvent(''); setMediaItems([]); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined text-sm sm:text-base">close</span>
                </button>
              )}
            </div>
           
          </header>

          {/* MAIN CONTENT */}
          <div className="sg-content max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pt-16 sm:pt-20 pb-8 sm:pb-12">
            
            {/* HERO SECTION */}
         
<GalleryHero
  selectedEvent={selectedEvent}
  searchQuery={searchQuery}
  searchedEvents={searchedEvents}
  setSelectedEvent={setSelectedEvent}
  setActiveFilter={setActiveFilter}
  setSearchQuery={setSearchQuery}
  setMediaItems={setMediaItems}
/>

            {/* SEARCH INFO */}
            {searchQuery && (
              <div className="sg-fadein mb-3 sm:mb-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="material-symbols-outlined text-purple-600 text-sm sm:text-base">search</span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  {searchedEvents.length > 0
                    ? `${searchedEvents.length} event${searchedEvents.length > 1 ? 's' : ''} for "${searchQuery}"`
                    : `No events found for "${searchQuery}"`}
                </span>
                <button onClick={() => { setSearchQuery(''); setSelectedEvent(''); setMediaItems([]); }}
                  className="text-purple-600 text-[10px] sm:text-xs font-bold underline">Clear</button>
              </div>
            )}

{/* HIGHLIGHTS - Mobile optimized */}
{searchedEvents.length > 0 && (
  <section className="sg-fadein mb-6 sm:mb-10">
    <h2 className="font-['Syne',sans-serif] text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4">
      {searchQuery ? 'Search Results' : 'Event Highlights'}
    </h2>
    <div className="sg-noscroll flex gap-2 sm:gap-4 overflow-x-auto pb-2">
      {searchedEvents.map((ev, idx) => {
        let imageUrl = null;
        if (ev.image_url) {
          if (ev.image_url.startsWith('http')) {
            imageUrl = ev.image_url;
          } else {
            imageUrl = `${BASE_URL}${ev.image_url}`;
          }
        }
        
        return (
          <div 
            key={ev._id} 
            className="sg-hcard flex-none w-32.5 sm:w-42.5 md:w-50 lg:w-62.5 cursor-pointer group"
            onClick={() => { setSelectedEvent(ev._id); setActiveFilter('All'); setMediaItems([]); setSearchQuery(''); }}
          >
            <div className="relative h-32.5 sm:h-37.5 md:h-44 rounded-lg sm:rounded-xl overflow-hidden shadow-md">
              
              {imageUrl ? (
                <img 
                  src={imageUrl}
                  alt={ev.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    console.error('Image load error:', imageUrl);
                    e.target.style.display = 'none';
                    if (e.target.parentElement.querySelector('.fallback-bg')) {
                      e.target.parentElement.querySelector('.fallback-bg').style.display = 'flex';
                    }
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-linear-to-br ${gradientPairs[idx % gradientPairs.length]} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-5xl sm:text-7xl text-white/20">photo_library</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 z-10">
                <span className="inline-block bg-teal-400/90 text-teal-900 text-[0.5rem] sm:text-[0.58rem] font-extrabold uppercase tracking-wide rounded-full px-1.5 sm:px-2 py-0.5 mb-0.5 sm:mb-1">
                  Event
                </span>
                <p className="text-white font-['Syne',sans-serif] font-bold text-[10px] sm:text-sm line-clamp-2">{ev.title}</p>
                {ev.start_date && (
                  <p className="text-white/70 text-[0.5rem] sm:text-[0.68rem] mt-0.5">
                    {new Date(ev.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-purple-600/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="bg-white/20 border border-white/30 text-white text-[8px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm">
                  View Gallery →
                </span>
              </div>
              
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
            {/* NO SEARCH RESULTS */}
            {searchQuery && searchedEvents.length === 0 && (
              <div className="sg-fadein text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-purple-200/50 mb-6 sm:mb-8">
                <span className="material-symbols-outlined text-4xl sm:text-5xl text-purple-300 block mb-2 sm:mb-3">search_off</span>
                <p className="font-['Syne',sans-serif] text-sm sm:text-base font-bold text-gray-800">No events found</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Try a different keyword.</p>
                <button onClick={() => setSearchQuery('')} className="sg-pill bg-linear-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold">Clear Search</button>
              </div>
            )}

            {/* FILTER PILLS - Mobile optimized */}
            {selectedEvent && (
              <div className="sg-fadein sg-noscroll flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-6 overflow-x-auto pb-1">
                {[
                  { key: 'All', icon: 'grid_view', label: 'All' },
                  { key: 'Images', icon: 'image', label: `Photos (${imageCount})` },
                  { key: 'Videos', icon: 'play_circle', label: `Videos (${videoCount})` },
                  { key: 'Saved', icon: 'bookmark', label: `Saved (${savedCount})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setActiveFilter(f.key)}
                    className={`sg-pill flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                      activeFilter === f.key ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-purple-100'
                    }`}>
                    <span className="material-symbols-outlined text-[0.7rem] sm:text-sm">{f.icon}</span>
                    <span className="hidden xs:inline">{f.label}</span>
                    <span className="xs:hidden">{f.key}</span>
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs font-semibold text-purple-600 whitespace-nowrap shrink-0">
                  <span className="material-symbols-outlined text-[0.7rem] sm:text-sm">event</span>
                  <span className="hidden xs:inline">{getEventTitle()}</span>
                  <span className="xs:hidden">{getEventTitle().substring(0, 8)}...</span>
                </div>
              </div>
            )}

            {/* GALLERY AREA - Mobile optimized with smaller images */}
            {!selectedEvent && !searchQuery ? (
              <div className="sg-fadein text-center py-12 sm:py-20 bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-purple-200/50">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-purple-500">photo_library</span>
                </div>
                <h3 className="font-['Syne',sans-serif] text-base sm:text-lg font-bold text-gray-800">Choose an event to explore</h3>
                <p className="text-xs sm:text-sm text-gray-500">Tap a highlight card or an event button above.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-16 sm:py-20">
                <div className="sg-spin w-8 h-8 sm:w-10 sm:h-10 border-3 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-gray-500 font-semibold">Loading gallery…</p>
              </div>
            ) : selectedEvent && filteredMedia.length === 0 ? (
              <div className="sg-fadein text-center py-16 sm:py-20 bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-purple-200/50">
                <span className="material-symbols-outlined text-4xl sm:text-5xl text-purple-300 block mb-2 sm:mb-3">image_not_supported</span>
                <p className="font-['Syne',sans-serif] text-sm sm:text-base font-bold text-gray-800">No media yet</p>
                <p className="text-xs sm:text-sm text-gray-500">The organizer hasn't uploaded anything for this event.</p>
              </div>
            ) : selectedEvent && filteredMedia.length > 0 ? (
              <div className="sg-masonry">
                {filteredMedia.map((item, idx) => (
                  <div key={item._id} className="sg-card sg-fadein relative mb-1 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden bg-white cursor-pointer shadow-sm" style={{ breakInside: 'avoid', ...delay(idx) }} onClick={() => openLightbox(item)}>
                    {item.media_type === 'Video' ? (
                      <div className="relative">
                        <video src={`${BASE_URL}${item.media_url}`} className="w-full block object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-purple-600 text-base sm:text-xl">play_arrow</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={`${BASE_URL}${item.media_url}`} alt="gallery" className="w-full block object-cover transition-transform duration-500 hover:scale-105" />
                    )}
                    <div className="sg-actions absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col gap-0.5 sm:gap-1 opacity-0 transition-opacity duration-200">
                      <button onClick={e => toggleSave(e, item._id)} className="sg-icon-btn w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition">
                        <span className="material-symbols-outlined text-[0.6rem] sm:text-sm text-purple-600">{savedItems.includes(item._id) ? 'bookmark' : 'bookmark_border'}</span>
                      </button>
                      <button onClick={e => downloadItem(e, item)} className="sg-icon-btn w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition">
                        <span className="material-symbols-outlined text-[0.6rem] sm:text-sm text-purple-600">download</span>
                      </button>
                      <button onClick={e => openShare(e, item)} className="sg-icon-btn w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 transition">
                        <span className="material-symbols-outlined text-[0.6rem] sm:text-sm text-purple-600">share</span>
                      </button>
                    </div>
                    <div className="sg-info-strip absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-1.5 sm:px-3 pb-1 sm:pb-2 pt-4 sm:pt-8 opacity-0 transition-opacity duration-200">
                      <span className={`inline-block text-white text-[0.4rem] sm:text-[0.58rem] font-extrabold uppercase rounded-full px-1 sm:px-2 py-0.5 ${item.media_type === 'Video' ? 'bg-teal-500/90' : 'bg-purple-500/90'}`}>
                        {item.media_type === 'Video' ? 'Video' : 'Photo'}
                      </span>
                      <p className="text-white/75 text-[0.4rem] sm:text-[0.68rem] font-medium mt-0.5">
                        {new Date(item.uploaded_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </main>

        {/* LIGHTBOX + SHARE MODAL + TOAST */}
        <LightboxModal
          lightbox={lightbox}
          lightboxIndex={lightboxIndex}
          filteredMedia={filteredMedia}
          savedItems={savedItems}
          toast={toast}
          shareModal={shareModal}
          onClose={closeLightbox}
          onPrev={prevMedia}
          onNext={nextMedia}
          onSave={toggleSave}
          onDownload={downloadItem}
          onShare={openShare}
          onShareClose={() => setShareModal(null)}
          onCopyLink={copyLink}
          onShareNative={shareNative}
          BASE_URL={BASE_URL}
        />
      </div>
    </>
  );
};

export default StudentGallery;
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
  // StudentGallery.jsx - No changes needed, it will work!
useEffect(() => {
  (async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/registrations/my-registrations`, { headers });
      const registrations = res.data?.data || [];
      
      // ✅ Ab event_id mein image_url bhi hoga
      const evList = registrations.map(r => r.event_id).filter(e => e && typeof e === 'object');
      
      console.log('Events with images:', evList.map(e => ({ 
        title: e.title, 
        image_url: e.image_url  // ✅ Now this will show the image URL
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

        @media (max-width: 1100px) { .sg-masonry { column-count: 2 !important; } }
        @media (max-width: 640px) { .sg-masonry { column-count: 1 !important; } }
        @media (max-width: 768px) {
          .sg-main { margin-left: 0 !important; }
          .sg-header { left: 0 !important; }
          .sg-content { padding-left: 1rem !important; padding-right: 1rem !important; }
        }
      `}</style>

      <div className="flex min-h-screen bg-[#faf8fc] font-['DM_Sans',sans-serif]">
        <StudentSidebar />

        <main className="sg-main flex-1 min-h-screen md:ml-64">
          {/* HEADER */}
          <header className="sg-header fixed top-0 right-0 z-50 flex items-center justify-between gap-4 px-4 md:px-8 py-3 bg-white/90 backdrop-blur-md border-b border-purple-200/20 md:left-64">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
              <input type="text" placeholder="Search events & memories…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedEvent(''); setMediaItems([]); }}
                className="w-full rounded-full border border-purple-200/40 bg-white py-2 pl-9 pr-8 text-sm text-gray-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSelectedEvent(''); setMediaItems([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full text-gray-500 hover:bg-purple-50">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="w-8 h-8 rounded-full bg-linear-to-r from-purple-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">S</div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <div className="sg-content max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-12">
            
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
              <div className="sg-fadein mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-base">search</span>
                <span className="text-sm text-gray-500 font-medium">
                  {searchedEvents.length > 0
                    ? `${searchedEvents.length} event${searchedEvents.length > 1 ? 's' : ''} for "${searchQuery}"`
                    : `No events found for "${searchQuery}"`}
                </span>
                <button onClick={() => { setSearchQuery(''); setSelectedEvent(''); setMediaItems([]); }}
                  className="text-purple-600 text-xs font-bold underline">Clear</button>
              </div>
            )}

{/* HIGHLIGHTS */}
{searchedEvents.length > 0 && (
  <section className="sg-fadein mb-10">
    <h2 className="font-['Syne',sans-serif] text-xl font-bold text-gray-900 mb-4">
      {searchQuery ? 'Search Results' : 'Event Highlights'}
    </h2>
    <div className="sg-noscroll flex gap-4 overflow-x-auto pb-2">
      {searchedEvents.map((ev, idx) => {
        // Handle both full URL and relative path
        let imageUrl = null;
        if (ev.image_url) {
          if (ev.image_url.startsWith('http')) {
            imageUrl = ev.image_url;  // Full URL like http://localhost:5000/uploads/...
          } else {
            imageUrl = `${BASE_URL}${ev.image_url}`;  // Relative path like /uploads/...
          }
        }
        
        return (
          <div 
            key={ev._id} 
            className="sg-hcard flex-none w-[clamp(190px,32vw,250px)] cursor-pointer group"
            onClick={() => { setSelectedEvent(ev._id); setActiveFilter('All'); setMediaItems([]); setSearchQuery(''); }}
          >
            <div className="relative h-44 rounded-xl overflow-hidden shadow-md">
              
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
                  <span className="material-symbols-outlined text-7xl text-white/20">photo_library</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <span className="inline-block bg-teal-400/90 text-teal-900 text-[0.58rem] font-extrabold uppercase tracking-wide rounded-full px-2 py-0.5 mb-1">
                  Event
                </span>
                <p className="text-white font-['Syne',sans-serif] font-bold text-sm line-clamp-2">{ev.title}</p>
                {ev.start_date && (
                  <p className="text-white/70 text-[0.68rem] mt-0.5">
                    {new Date(ev.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-purple-600/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
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
              <div className="sg-fadein text-center py-16 bg-white rounded-2xl border-2 border-dashed border-purple-200/50 mb-8">
                <span className="material-symbols-outlined text-5xl text-purple-300 block mb-3">search_off</span>
                <p className="font-['Syne',sans-serif] text-base font-bold text-gray-800">No events found</p>
                <p className="text-sm text-gray-500 mb-4">Try a different keyword.</p>
                <button onClick={() => setSearchQuery('')} className="sg-pill bg-linear-to-r from-purple-600 to-pink-500 text-white px-5 py-1.5 rounded-full text-xs font-bold">Clear Search</button>
              </div>
            )}

            {/* FILTER PILLS */}
            {selectedEvent && (
              <div className="sg-fadein sg-noscroll flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {[
                  { key: 'All', icon: 'grid_view', label: 'All' },
                  { key: 'Images', icon: 'image', label: `Photos (${imageCount})` },
                  { key: 'Videos', icon: 'play_circle', label: `Videos (${videoCount})` },
                  { key: 'Saved', icon: 'bookmark', label: `Saved (${savedCount})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setActiveFilter(f.key)}
                    className={`sg-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                      activeFilter === f.key ? 'bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-purple-100'
                    }`}>
                    <span className="material-symbols-outlined text-sm">{f.icon}</span>
                    {f.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-xs font-semibold text-purple-600 whitespace-nowrap shrink-0">
                  <span className="material-symbols-outlined text-sm">event</span>
                  {getEventTitle()}
                </div>
              </div>
            )}

            {/* GALLERY AREA */}
            {!selectedEvent && !searchQuery ? (
              <div className="sg-fadein text-center py-20 bg-white rounded-2xl border-2 border-dashed border-purple-200/50">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-purple-500">photo_library</span>
                </div>
                <h3 className="font-['Syne',sans-serif] text-lg font-bold text-gray-800">Choose an event to explore</h3>
                <p className="text-sm text-gray-500">Tap a highlight card or an event button above.</p>
              </div>
            ) : loading ? (
              <div className="text-center py-20">
                <div className="sg-spin w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-semibold">Loading gallery…</p>
              </div>
            ) : selectedEvent && filteredMedia.length === 0 ? (
              <div className="sg-fadein text-center py-20 bg-white rounded-2xl border-2 border-dashed border-purple-200/50">
                <span className="material-symbols-outlined text-5xl text-purple-300 block mb-3">image_not_supported</span>
                <p className="font-['Syne',sans-serif] text-base font-bold text-gray-800">No media yet</p>
                <p className="text-sm text-gray-500">The organizer hasn't uploaded anything for this event.</p>
              </div>
            ) : selectedEvent && filteredMedia.length > 0 ? (
              <div className="sg-masonry columns-1 sm:columns-2 lg:columns-3 gap-4">
                {filteredMedia.map((item, idx) => (
                  <div key={item._id} className="sg-card sg-fadein relative mb-4 rounded-xl overflow-hidden bg-white cursor-pointer shadow-sm" style={{ breakInside: 'avoid', ...delay(idx) }} onClick={() => openLightbox(item)}>
                    {item.media_type === 'Video' ? (
                      <div className="relative">
                        <video src={`${BASE_URL}${item.media_url}`} className="w-full block object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-purple-600 text-xl">play_arrow</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={`${BASE_URL}${item.media_url}`} alt="gallery" className="w-full block object-cover transition-transform duration-500 hover:scale-105" />
                    )}
                    <div className="sg-actions absolute top-2 right-2 flex flex-col gap-1 opacity-0 transition-opacity duration-200">
                      <button onClick={e => toggleSave(e, item._id)} className="sg-icon-btn w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-purple-600">{savedItems.includes(item._id) ? 'bookmark' : 'bookmark_border'}</span>
                      </button>
                      <button onClick={e => downloadItem(e, item)} className="sg-icon-btn w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-purple-600">download</span>
                      </button>
                      <button onClick={e => openShare(e, item)} className="sg-icon-btn w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-purple-600">share</span>
                      </button>
                    </div>
                    <div className="sg-info-strip absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent px-3 pb-2 pt-8 opacity-0 transition-opacity duration-200">
                      <span className={`inline-block text-white text-[0.58rem] font-extrabold uppercase rounded-full px-2 py-0.5 ${item.media_type === 'Video' ? 'bg-teal-500/90' : 'bg-purple-500/90'}`}>
                        {item.media_type === 'Video' ? 'Video' : 'Photo'}
                      </span>
                      <p className="text-white/75 text-[0.68rem] font-medium mt-0.5">
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
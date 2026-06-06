import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';

const AdminGallery = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const BASE_URL = 'http://localhost:5000';

  // Fetch all events (admin sees everything)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/events/all`, { headers });
        const allEvents = res.data?.events || res.data || [];
        setEvents(allEvents);
      } catch (err) {
        console.error('Events fetch error:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch gallery for selected event
  useEffect(() => {
    if (!selectedEvent) return;
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/gallery/event/${selectedEvent}`, { headers });
        setMediaItems(res.data || []);
      } catch (err) {
        console.error('Gallery fetch error:', err);
        setMediaItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [selectedEvent]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${BASE_URL}/api/gallery/${id}`, { headers });
      setMediaItems((prev) => prev.filter((m) => m._id !== id));
      if (lightbox?._id === id) setLightbox(null);
    } catch (err) {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (activeFilter === 'Images') return item.media_type === 'Image';
    if (activeFilter === 'Videos') return item.media_type === 'Video';
    return true;
  });

  const imageCount = mediaItems.filter((m) => m.media_type === 'Image').length;
  const videoCount = mediaItems.filter((m) => m.media_type === 'Video').length;

  const openLightbox = (item) => {
    const index = filteredMedia.findIndex((m) => m._id === item._id);
    setLightboxIndex(index);
    setLightbox(item);
  };

  const prevMedia = (e) => {
    e.stopPropagation();
    const newIndex = (lightboxIndex - 1 + filteredMedia.length) % filteredMedia.length;
    setLightboxIndex(newIndex);
    setLightbox(filteredMedia[newIndex]);
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    const newIndex = (lightboxIndex + 1) % filteredMedia.length;
    setLightboxIndex(newIndex);
    setLightbox(filteredMedia[newIndex]);
  };

  const getEventTitle = () => {
    const ev = events.find((e) => e._id === selectedEvent);
    return ev ? ev.title : '';
  };

  return (
    <div className="flex min-h-screen bg-[#f8f3fd] font-['Manrope',sans-serif]">
      <AdminSidebar />

      <main className="ml-64 min-h-screen flex-1">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md fixed top-0 right-0 left-64 z-40 shadow-sm flex justify-between items-center px-8 py-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  setMediaItems([]);
                  setActiveFilter('All');
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#f0eded] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7cf6ec] transition-all cursor-pointer text-[#1c1b1b] font-semibold"
              >
                <option value="">Filter gallery by event...</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-purple-50 rounded-full transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-[#8b4fa2] flex items-center justify-center text-white font-bold text-sm">A</div>
          </div>
        </header>

        {/* Main Canvas */}
        <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-4xl font-extrabold text-[#1c1b1b] tracking-tight">
                Gallery Management
              </h1>
              <p className="text-[#4d434f] mt-2 font-medium">
                Monitor and moderate all event media across the portal.
              </p>
            </div>
            {selectedEvent && (
              <div className="bg-white px-5 py-3 rounded-xl shadow-sm flex items-center gap-2 text-sm font-bold text-[#80409b]">
                <span className="material-symbols-outlined text-lg">event</span>
                {getEventTitle()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left: Gallery */}
            <div className="lg:col-span-9 flex flex-col gap-8">

              {/* Filter Bar */}
              {selectedEvent && (
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 p-1 bg-[#f0eded] rounded-xl w-fit">
                    {['All', 'Images', 'Videos'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition ${
                          activeFilter === f
                            ? 'bg-white text-[#80409b] shadow-sm'
                            : 'text-[#4d434f] hover:text-[#80409b]'
                        }`}
                      >
                        {f}
                        <span className="ml-1.5 text-xs opacity-60">
                          {f === 'All' ? mediaItems.length : f === 'Images' ? imageCount : videoCount}
                        </span>
                      </button>
                    ))}
                  </div>
                  {mediaItems.length > 0 && (
                    <p className="text-sm text-[#4d434f] font-semibold">
                      <span className="text-[#cb4548] font-bold">Admin Mode</span> — You can delete any media
                    </p>
                  )}
                </div>
              )}

              {/* Gallery Grid */}
              {!selectedEvent ? (
                <div className="bg-white rounded-2xl p-20 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-[#f0eded] rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-[#c9a8e0]">photo_library</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#1c1b1b]">
                    Select an event to manage its gallery
                  </h3>
                  <p className="text-sm text-[#4d434f] mt-2 max-w-xs">
                    Use the dropdown above to filter by event and view or remove media.
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-20 text-[#4d434f]">
                  <span className="material-symbols-outlined text-5xl text-[#c9a8e0] animate-spin">autorenew</span>
                  <p className="mt-3 font-semibold">Loading gallery...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl text-[#c9a8e0]">image_not_supported</span>
                  <p className="text-lg font-bold text-[#1c1b1b] mt-3">No media found</p>
                  <p className="text-sm text-[#4d434f] mt-1">No photos or videos have been uploaded for this event yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredMedia.map((item) => (
                    <div
                      key={item._id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-4/3 overflow-hidden relative cursor-pointer" onClick={() => openLightbox(item)}>
                        {item.media_type === 'Video' ? (
                          <div className="relative w-full h-full bg-[#1c1b1b] flex items-center justify-center">
                            <video
                              src={`${BASE_URL}${item.media_url}`}
                              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/40 rounded-full w-14 h-14 flex items-center justify-center group-hover:bg-[#8b4fa2]/80 transition">
                                <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={`${BASE_URL}${item.media_url}`}
                            alt="gallery"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full ${
                            item.media_type === 'Video'
                              ? 'bg-[#1c1b1b]/10 text-[#1c1b1b]'
                              : 'bg-purple-100 text-[#80409b]'
                          }`}>
                            {item.media_type}
                          </span>
                          <p className="text-xs text-[#4d434f] font-semibold mt-1.5">
                            {new Date(item.uploaded_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        {/* Admin Delete Button */}
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className={`p-2 rounded-lg transition ${
                            deletingId === item._id
                              ? 'bg-gray-100 cursor-not-allowed'
                              : 'bg-red-50 hover:bg-red-100 text-[#cb4548]'
                          }`}
                          title="Delete media"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {deletingId === item._id ? 'hourglass_empty' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-28 flex flex-col gap-6">

                {/* Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#1c1b1b] mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#80409b]">bar_chart</span>
                    Media Stats
                  </h3>

                  {selectedEvent ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#4d434f] font-semibold">Total Media</span>
                        <span className="font-extrabold text-[#1c1b1b] text-lg">{mediaItems.length}</span>
                      </div>
                      <div className="w-full h-2 bg-[#f0eded] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: mediaItems.length > 0 ? `${(imageCount / mediaItems.length) * 100}%` : '0%',
                            background: 'linear-gradient(90deg, #9b59b6 0%, #4ECDC4 100%)'
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-[#4d434f]">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#9b59b6]" />
                            Images
                          </div>
                          <span className="font-bold">{imageCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-[#4d434f]">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#4ECDC4]" />
                            Videos
                          </div>
                          <span className="font-bold">{videoCount}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4d434f]">Select an event to see stats.</p>
                  )}
                </div>

                {/* Events List */}
                {events.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#1c1b1b] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#80409b] text-lg">calendar_today</span>
                      All Events
                    </h3>
                    <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                      {events.map((ev) => (
                        <li key={ev._id}>
                          <button
                            onClick={() => {
                              setSelectedEvent(ev._id);
                              setMediaItems([]);
                              setActiveFilter('All');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                              selectedEvent === ev._id
                                ? 'bg-purple-100 text-[#80409b]'
                                : 'text-[#4d434f] hover:bg-[#f0eded]'
                            }`}
                          >
                            {ev.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Admin Warning Card */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                  <span className="material-symbols-outlined text-[#cb4548] mb-2 block">warning</span>
                  <h4 className="font-bold text-[#cb4548] text-sm">Admin Permissions</h4>
                  <p className="text-[#cb4548]/80 text-xs mt-1 leading-relaxed">
                    As admin, you can permanently delete any media. Deleted files cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <button
            onClick={() => setLightbox(null)}
            className="fixed top-5 right-7 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 text-lg font-bold flex items-center justify-center transition z-50"
          >
            ✕
          </button>

          <div className="fixed top-5 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
            <span className="bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {filteredMedia.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(lightbox._id); }}
              className="bg-[#cb4548]/80 hover:bg-[#cb4548] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete
            </button>
          </div>

          {filteredMedia.length > 1 && (
            <button
              onClick={prevMedia}
              className="fixed left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition z-50"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-w-[85vw] max-h-[85vh]">
            {lightbox.media_type === 'Video' ? (
              <video
                src={`${BASE_URL}${lightbox.media_url}`}
                controls autoPlay
                className="max-w-[85vw] max-h-[85vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={`${BASE_URL}${lightbox.media_url}`}
                alt="full view"
                className="max-w-[85vw] max-h-[85vh] rounded-xl shadow-2xl object-contain"
              />
            )}
            <p className="text-white/60 text-xs text-center mt-3 font-semibold">
              {new Date(lightbox.uploaded_at).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {filteredMedia.length > 1 && (
            <button
              onClick={nextMedia}
              className="fixed right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition z-50"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
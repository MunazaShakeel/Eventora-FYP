import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrganizerSidebar from '../../components/OrganizerSidebar';

const OrganizerGallery = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date Added');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchEvents = async () => {
   try {
      const res = await axios.get("http://localhost:5000/api/organizers/my-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myEvents = res.data?.events || [];
      setEvents(myEvents);
      if (myEvents.length > 0) {
        setSelectedEventId(myEvents[0]._id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load your events.");
    } finally {
      setLoadingEvents(false);
    }
  };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/gallery/event/${selectedEvent}`, { headers });
        setMediaItems(res.data);
      } catch (err) {
        console.error('Gallery fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [selectedEvent]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file || !selectedEvent) {
      setMessage('error-select');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('event_id', selectedEvent);
      formData.append('media_type', file.type.startsWith('video') ? 'Video' : 'Image');

      const res = await axios.post(`${BASE_URL}/api/gallery/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });

      setMediaItems((prev) => [res.data.media, ...prev]);
      setFile(null);
      setPreview(null);
      setMessage('success');
    } catch (err) {
      setMessage('error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this media?')) return;
    try {
      await axios.delete(`${BASE_URL}/api/gallery/${id}`, { headers });
      setMediaItems((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const getEventTitle = (eventId) => {
    const ev = events.find((e) => e._id === eventId);
    return ev ? ev.title : 'Event';
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (activeFilter === 'Images') return item.media_type === 'Image';
    if (activeFilter === 'Videos') return item.media_type === 'Video';
    return true;
  });

  const imageCount = mediaItems.filter((m) => m.media_type === 'Image').length;
  const videoCount = mediaItems.filter((m) => m.media_type === 'Video').length;

  return (
    <div className="flex min-h-screen bg-[#f8f3fd] font-sans text-[#1A1A1A]">
      <OrganizerSidebar />

      <main className="ml-64 min-h-screen flex-1">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md fixed top-0 right-0 left-64 z-40 shadow-sm flex justify-between items-center px-8 py-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <select
                value={selectedEvent}
                onChange={(e) => { setSelectedEvent(e.target.value); setMediaItems([]); setActiveFilter('All'); }}
                className="w-full pl-10 pr-4 py-2 bg-[#f0eded] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7cf6ec] transition-all cursor-pointer text-[#1c1b1b] font-semibold"
              >
                <option value="">Search gallery by event...</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-purple-50 rounded-full transition-all active:scale-95">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-purple-50 rounded-full transition-all active:scale-95">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-[#9b59b6] flex items-center justify-center text-white font-bold text-sm">O</div>
          </div>
        </header>

        {/* Main Canvas */}
        <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-4xl font-extrabold text-[#1c1b1b] tracking-tight">
                Event Gallery
              </h1>
              <p className="text-[#4d434f] mt-2 font-medium">
                Curate and manage your event visual assets in one place.
              </p>
            </div>
            <button
              onClick={() => document.getElementById('galleryFileInput').click()}
              className="bg-linear-to-br from-[#80409b] to-[#9b59b6] text-white px-7 py-3 rounded-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold flex items-center gap-2 shadow-lg shadow-purple-200 hover:opacity-95 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">cloud_upload</span>
              Upload Photos
            </button>
            <input id="galleryFileInput" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Upload + Grid */}
            <div className="lg:col-span-9 flex flex-col gap-8">

              {/* Upload Zone */}
              <section
                onClick={() => !preview && document.getElementById('galleryFileInput').click()}
                className={`bg-white border-2 border-dashed border-[#7cf6ec]/60 rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors ${!preview ? 'cursor-pointer hover:bg-[#7cf6ec]/5' : ''}`}
              >
                {preview ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    {file?.type.startsWith('video') ? (
                      <video src={preview} controls className="max-h-44 rounded-xl" />
                    ) : (
                      <img src={preview} alt="preview" className="max-h-44 rounded-xl shadow" />
                    )}
                    <p className="text-[#4d434f] text-sm font-medium">{file?.name}</p>

                    {message === 'success' && <p className="text-green-600 font-semibold text-sm">✅ Uploaded successfully!</p>}
                    {message === 'error' && <p className="text-red-500 font-semibold text-sm">❌ Upload failed. Try again.</p>}
                    {message === 'error-select' && <p className="text-orange-500 font-semibold text-sm">⚠️ Please select an event first.</p>}

                    <div className="flex gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        disabled={uploading}
                        className={`px-7 py-2.5 rounded-xl font-bold text-white text-sm transition ${uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#8b4fa2] hover:bg-[#7a3f91]'}`}
                      >
                        {uploading ? 'Uploading...' : 'Upload Now'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setMessage(''); }}
                        className="px-7 py-2.5 rounded-xl font-bold text-[#8b4fa2] text-sm border-2 border-[#8b4fa2]/20 hover:bg-purple-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-[#7cf6ec]/20 rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[#006a65] text-4xl">upload_file</span>
                    </div>
                    <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold text-[#1c1b1b]">
                      Drop files here or click to upload
                    </h3>
                    <p className="text-[#4d434f] text-sm mt-1">Supports JPG, PNG and MP4 up to 5MB</p>
                  </>
                )}
              </section>

              {/* Filter & Sort Bar */}
              {selectedEvent && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-1 p-1 bg-[#f0eded] rounded-xl w-fit">
                    {['All', 'Images', 'Videos'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition ${activeFilter === f ? 'bg-white text-[#80409b] shadow-sm' : 'text-[#4d434f] hover:text-[#80409b]'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#4d434f]">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#f0eded] border-none rounded-lg text-sm font-semibold text-[#1c1b1b] focus:ring-2 focus:ring-[#7cf6ec] outline-none px-3 py-1.5"
                    >
                      <option>Date Added</option>
                      <option>Event Name</option>
                      <option>File Type</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Gallery Grid */}
              {selectedEvent ? (
                loading ? (
                  <div className="text-center py-16 text-[#4d434f]">
                    <span className="material-symbols-outlined text-5xl text-[#c9a8e0]">autorenew</span>
                    <p className="mt-3 font-semibold">Loading gallery...</p>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="bg-white rounded-xl p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-[#c9a8e0]">photo_library</span>
                    <p className="text-lg font-bold text-[#1c1b1b] mt-3">No media found</p>
                    <p className="text-sm text-[#4d434f] mt-1">Upload some photos or videos for this event.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMedia.map((item) => (
                      <div
                        key={item._id}
                        className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                      >
                        <div className="aspect-4/3 overflow-hidden relative">
                          {item.media_type === 'Video' ? (
                            <video
                              src={`${BASE_URL}${item.media_url}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setLightbox(item)}
                            />
                          ) : (
                            <img
                              src={`${BASE_URL}${item.media_url}`}
                              alt="gallery"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setLightbox(item)}
                            />
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                            <div className="flex gap-3 mb-2">
                              <button
                                onClick={() => setLightbox(item)}
                                className="bg-[#7cf6ec] text-[#00201e] p-2 rounded-lg hover:scale-110 transition-transform"
                              >
                                <span className="material-symbols-outlined text-xl">open_in_full</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                className="bg-[#cb4548] text-white p-2 rounded-lg hover:scale-110 transition-transform"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col gap-2">
                          <span className="bg-[#ffdad8] text-[#410006] text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full w-fit">
                            {getEventTitle(item.event_id)}
                          </span>
                          <h4 className="font-bold text-[#1c1b1b] truncate text-sm">
                            {item.media_type === 'Video' ? '🎬 Video' : '🖼️ Photo'} · {new Date(item.uploaded_at).toLocaleDateString()}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-white rounded-xl p-16 text-center">
                  <span className="material-symbols-outlined text-6xl text-[#c9a8e0]">photo_library</span>
                  <p className="text-lg font-bold text-[#1c1b1b] mt-3">Select an event to view gallery</p>
                  <p className="text-sm text-[#4d434f] mt-1">Use the dropdown in the top bar to choose an event.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-28 flex flex-col gap-6">

                {/* Stats Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#1c1b1b] mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#80409b]">photo_library</span>
                    Media Summary
                  </h3>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-[#4d434f]">Total</span>
                    <span className="text-[#1c1b1b]">{mediaItems.length} files</span>
                  </div>
                  <div className="w-full h-3 bg-[#f0eded] rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: mediaItems.length > 0 ? '100%' : '0%',
                        background: 'linear-gradient(90deg, #7cf6ec 0%, #80409b 100%)'
                      }}
                    />
                  </div>
                  <ul className="flex flex-col gap-4">
                    <li className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[#4d434f]">
                        <div className="w-2 h-2 rounded-full bg-[#80409b]" />
                        Images
                      </div>
                      <span className="font-bold">{imageCount}</span>
                    </li>
                    <li className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[#4d434f]">
                        <div className="w-2 h-2 rounded-full bg-[#006a65]" />
                        Videos
                      </div>
                      <span className="font-bold">{videoCount}</span>
                    </li>
                  </ul>
                  {selectedEvent && mediaItems.length > 0 && (
                    <button
                      onClick={() => { setMediaItems([]); setSelectedEvent(''); setActiveFilter('All'); }}
                      className="w-full mt-6 py-3 rounded-xl border-2 border-[#80409b]/20 text-[#80409b] font-bold hover:bg-purple-50 transition-colors text-sm"
                    >
                      Clear View
                    </button>
                  )}
                </div>

                {/* Tip Card */}
                <div className="bg-[#79f3ea]/20 p-6 rounded-xl">
                  <span className="material-symbols-outlined text-[#006a65] mb-2 block">lightbulb</span>
                  <h4 className="font-bold text-[#006a65] text-sm">Optimization Tip</h4>
                  <p className="text-[#006a65]/80 text-xs mt-1 leading-relaxed">
                    Compressing your images before upload can save significant storage space without losing visible quality.
                  </p>
                </div>

                {/* Events Quick Select */}
                {events.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-[#1c1b1b] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#80409b] text-lg">calendar_today</span>
                      Your Events
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {events.slice(0, 5).map((ev) => (
                        <li key={ev._id}>
                          <button
                            onClick={() => { setSelectedEvent(ev._id); setMediaItems([]); setActiveFilter('All'); }}
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50"
        >
          {lightbox.media_type === 'Video' ? (
            <video
              src={`${BASE_URL}${lightbox.media_url}`}
              controls autoPlay
              className="max-w-[90vw] max-h-[85vh] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={`${BASE_URL}${lightbox.media_url}`}
              alt="full view"
              className="max-w-[90vw] max-h-[85vh] rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            onClick={() => setLightbox(null)}
            className="fixed top-5 right-7 bg-white text-gray-800 rounded-full w-9 h-9 text-lg font-bold flex items-center justify-center shadow-md hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizerGallery;
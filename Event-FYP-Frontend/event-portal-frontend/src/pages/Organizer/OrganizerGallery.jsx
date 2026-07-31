import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import OrganizerSidebar from '../../components/OrganizerSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];

const OrganizerGallery = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date Added');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // ✅ New states for confirmation modal & search
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [eventSearch, setEventSearch] = useState('');

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ─── FETCH EVENTS ───
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/organizers/my-events`, { headers });
        const myEvents = res.data?.events || [];
        setEvents(myEvents);
        if (myEvents.length > 0) {
          setSelectedEvent(myEvents[0]._id);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load your events.");
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [headers]);

  // ─── FETCH GALLERY ───
  useEffect(() => {
    if (!selectedEvent) return;

    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/gallery/event/${selectedEvent}`, { headers });
        setMediaItems(res.data || []);
      } catch (err) {
        console.error('Gallery fetch error:', err);
        setError('Failed to load gallery. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [selectedEvent, headers, preview]);

  // ─── HANDLE FILE SELECTION ───
  const handleFileChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!SUPPORTED_TYPES.includes(selected.type)) {
      setMessage('Unsupported file format. Please upload JPG, PNG, GIF, WEBP, or MP4 files.');
      setMessageType('error');
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setMessage(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      setMessageType('error');
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage('');
    setMessageType('');
    setUploadProgress(0);
  }, [preview]);

  // ─── HANDLE UPLOAD ───
  const handleUpload = useCallback(async () => {
    if (!file || !selectedEvent) {
      setMessage('Please select an event and a file.');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    setMessageType('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('event_id', selectedEvent);
      formData.append('media_type', file.type.startsWith('video') ? 'Video' : 'Image');

      const res = await axios.post(`${API_URL}/gallery/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (res.data?.media) {
        setMediaItems((prev) => [res.data.media, ...prev]);
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setFile(null);
      setPreview(null);
      setMessage('Upload successful!');
      setMessageType('success');
      setUploadProgress(100);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);

    } catch (err) {
      console.error('Upload error:', err);
      setMessage(err?.response?.data?.message || 'Upload failed. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  }, [file, selectedEvent, headers, preview]);

  // ─── HANDLE DELETE (SHOW CONFIRMATION) ───
  const handleDeleteClick = useCallback((id) => {
    setDeleteConfirm(id);
  }, []);

  // ─── CONFIRM DELETE ───
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    
    try {
      await axios.delete(`${API_URL}/gallery/${deleteConfirm}`, { headers });
      setMediaItems((prev) => prev.filter((m) => m._id !== deleteConfirm));
      
      if (lightbox?._id === deleteConfirm) {
        setLightbox(null);
      }
      
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete error:', err);
      setMessage('Delete failed. Please try again.');
      setMessageType('error');
    }
  }, [deleteConfirm, headers, lightbox]);

  // ─── CANCEL DELETE ───
  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // ─── HANDLE CANCEL ───
  const handleCancel = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setMessage('');
    setMessageType('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview]);

  // ─── GET EVENT TITLE ───
  const getEventTitle = useCallback((eventId) => {
    const ev = events.find((e) => e._id === eventId);
    return ev ? ev.title : 'Event';
  }, [events]);

  // ─── FILTERED EVENTS (SEARCH) ───
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const search = eventSearch.toLowerCase().trim();
    return events.filter((ev) => 
      ev.title?.toLowerCase().includes(search)
    );
  }, [events, eventSearch]);

  // ─── FILTERED & SORTED MEDIA ───
  const filteredMedia = useMemo(() => {
    let result = mediaItems.filter((item) => {
      if (activeFilter === 'Images') return item.media_type === 'Image';
      if (activeFilter === 'Videos') return item.media_type === 'Video';
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'Date Added') {
        return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      }
      if (sortBy === 'Event Name') {
        return getEventTitle(a.event_id).localeCompare(getEventTitle(b.event_id));
      }
      if (sortBy === 'File Type') {
        return a.media_type.localeCompare(b.media_type);
      }
      return 0;
    });

    return result;
  }, [mediaItems, activeFilter, sortBy, getEventTitle]);

  // ─── STATISTICS ───
  const imageCount = useMemo(() => 
    mediaItems.filter((m) => m.media_type === 'Image').length, 
  [mediaItems]);

  const videoCount = useMemo(() => 
    mediaItems.filter((m) => m.media_type === 'Video').length, 
  [mediaItems]);

  // ─── RENDER ───
  return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-purple-50/20">
      <OrganizerSidebar />

      <main className="flex-1 lg:ml-64 min-h-screen">
        
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-[22px] text-gray-600">menu</span>
          </button>
          <h1 className="text-lg font-bold text-[#8b4fa2]">Event Gallery</h1>
          <div className="w-9 h-9 rounded-full bg-[#8b4fa2] flex items-center justify-center text-white font-bold text-sm">
            O
          </div>
        </div>

        {/* Main Canvas */}
        <div className="pt-20 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold">
                Event <span className="text-[#8b4fa2]">Gallery</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Curate and manage your event visual assets in one place.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Upload Photos
            </button>
            <input
              id="galleryFileInput"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {/* ── ERROR DISPLAY ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
              <button
                onClick={() => setError('')}
                className="ml-3 text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left: Upload + Grid */}
            <div className="flex-1 flex flex-col gap-6">

              {/* Upload Zone */}
              <section
                onClick={() => !preview && !uploading && fileInputRef.current?.click()}
                className={`bg-white border-2 border-dashed border-teal-300 rounded-xl p-6 sm:p-10 flex flex-col items-center justify-center text-center transition-colors ${!preview && !uploading ? 'cursor-pointer hover:bg-teal-50/30' : ''}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-[#8b4fa2] animate-spin" />
                    <p className="text-gray-600 font-semibold">Uploading... {uploadProgress}%</p>
                    <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    {file?.type.startsWith('video') ? (
                      <video
                        src={preview}
                        controls
                        className="max-h-40 rounded-xl"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="preview"
                        className="max-h-40 rounded-xl shadow"
                        loading="lazy"
                      />
                    )}
                    <p className="text-gray-600 text-sm font-medium truncate max-w-full">{file?.name}</p>

                    {message && (
                      <p className={`font-semibold text-sm ${
                        messageType === 'success' ? 'text-green-600' : 
                        messageType === 'error' ? 'text-red-500' : 'text-orange-500'
                      }`}>
                        {messageType === 'success' ? '✅ ' : messageType === 'error' ? '❌ ' : '⚠️ '}
                        {message}
                      </p>
                    )}

                    <div className="flex gap-3 flex-wrap justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                        disabled={uploading}
                        className={`px-6 py-2 rounded-xl font-bold text-white text-sm transition ${
                          uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8b4fa2] hover:bg-[#7a3f91]'
                        }`}
                      >
                        {uploading ? 'Uploading...' : 'Upload Now'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                        disabled={uploading}
                        className={`px-6 py-2 rounded-xl font-bold text-[#8b4fa2] text-sm border-2 border-purple-200 hover:bg-purple-50 transition ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-teal-600 text-3xl">upload_file</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Drop files here or click to upload
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">Supports JPG, PNG, WEBP and MP4 up to 5MB</p>
                  </>
                )}
              </section>

              {/* Filter & Sort Bar */}
              {selectedEvent && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                    {['All', 'Images', 'Videos'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                          activeFilter === f ? 'bg-white text-[#8b4fa2] shadow-sm' : 'text-gray-500 hover:text-[#8b4fa2]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-gray-100 border-none rounded-lg text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-teal-300 outline-none px-3 py-1.5"
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
                  <div className="text-center py-16 text-gray-500">
                    <span className="material-symbols-outlined text-5xl text-purple-300 animate-spin">autorenew</span>
                    <p className="mt-3 font-semibold">Loading gallery...</p>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-purple-300">photo_library</span>
                    <p className="text-base font-bold text-gray-800 mt-3">No media found</p>
                    <p className="text-sm text-gray-500 mt-1">Upload some photos or videos for this event.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredMedia.map((item) => (
                      <div
                        key={item._id}
                        className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                      >
                        <div className="aspect-square overflow-hidden relative">
                          {item.media_type === 'Video' ? (
                            <video
                              src={`${BASE_URL}${item.media_url}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setLightbox(item)}
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={`${BASE_URL}${item.media_url}`}
                              alt="gallery"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                              onClick={() => setLightbox(item)}
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                            <div className="flex gap-2 mb-1">
                              <button
                                onClick={() => setLightbox(item)}
                                className="bg-teal-400 text-teal-900 p-1.5 rounded-lg hover:scale-110 transition-transform"
                                aria-label="View fullscreen"
                              >
                                <span className="material-symbols-outlined text-lg">open_in_full</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item._id); }}
                                className="bg-red-500 text-white p-1.5 rounded-lg hover:scale-110 transition-transform"
                                aria-label="Delete media"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                          <span className="bg-purple-100 text-purple-700 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full w-fit">
                            {getEventTitle(item.event_id)}
                          </span>
                          <p className="text-xs text-gray-500">
                            {item.media_type === 'Video' ? '🎬 Video' : '🖼️ Photo'} · {new Date(item.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-purple-300">photo_library</span>
                  <p className="text-base font-bold text-gray-800 mt-3">Select an event to view gallery</p>
                  <p className="text-sm text-gray-500 mt-1">Use the dropdown in the top bar to choose an event.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-24 lg:top-8 flex flex-col gap-5">
                
                {/* Event Select Dropdown with Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Your Events</label>
                  
                  {/* ✅ Search Input */}
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  </div>
                  
                  <select
                    value={selectedEvent}
                    onChange={(e) => { 
                      setSelectedEvent(e.target.value); 
                      setMediaItems([]); 
                      setActiveFilter('All');
                      setEventSearch('');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-300"
                  >
                    <option value="">Choose an event...</option>
                    {filteredEvents.map((ev) => (
                      <option key={ev._id} value={ev._id}>{ev.title}</option>
                    ))}
                  </select>
                  {filteredEvents.length === 0 && eventSearch && (
                    <p className="text-xs text-gray-400 mt-2 text-center">No events found matching "{eventSearch}"</p>
                  )}
                </div>

                {/* Stats Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                  <h3 className="font-bold text-base text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b4fa2]">photo_library</span>
                    Media Summary
                  </h3>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-500">Total</span>
                    <span className="text-gray-800">{mediaItems.length} files</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full rounded-full transition-all bg-linear-to-r from-[#4ECDC4] to-[#8b4fa2]"
                      style={{ width: mediaItems.length > 0 ? '100%' : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-[#8b4fa2]" />
                      Images
                    </div>
                    <span className="font-bold">{imageCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      Videos
                    </div>
                    <span className="font-bold">{videoCount}</span>
                  </div>
                  {selectedEvent && mediaItems.length > 0 && (
                    <button
                      onClick={() => { setMediaItems([]); setSelectedEvent(''); setActiveFilter('All'); }}
                      className="w-full mt-5 py-2.5 rounded-xl border-2 border-purple-200 text-[#8b4fa2] font-bold hover:bg-purple-50 transition-colors text-sm"
                    >
                      Clear View
                    </button>
                  )}
                </div>

             

                {/* Events Quick List - Desktop */}
                {events.length > 0 && (
                  <div className="hidden lg:block bg-white p-5 rounded-xl shadow-sm">
                    <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8b4fa2] text-lg">calendar_today</span>
                      All Events
                    </h3>
                    <div className="relative mb-2">
                      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Filter events..."
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-300"
                      />
                    </div>
                    <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {filteredEvents.map((ev) => (
                        <li key={ev._id}>
                          <button
                            onClick={() => { setSelectedEvent(ev._id); setMediaItems([]); setActiveFilter('All'); setEventSearch(''); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                              selectedEvent === ev._id
                                ? 'bg-purple-100 text-[#8b4fa2]'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {ev.title}
                          </button>
                        </li>
                      ))}
                      {filteredEvents.length === 0 && eventSearch && (
                        <li className="text-xs text-gray-400 text-center py-2">No events found</li>
                      )}
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
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        >
          <button
            onClick={() => setLightbox(null)}
            className="fixed top-4 right-4 bg-white/20 backdrop-blur text-white rounded-full w-10 h-10 text-xl font-bold flex items-center justify-center hover:bg-white/30 transition"
            aria-label="Close lightbox"
          >
            ✕
          </button>
          {lightbox.media_type === 'Video' ? (
            <video
              src={`${BASE_URL}${lightbox.media_url}`}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl"
              onClick={(e) => e.stopPropagation()}
              preload="metadata"
            />
          ) : (
            <img
              src={`${BASE_URL}${lightbox.media_url}`}
              alt="full view"
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* ✅ DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-600 text-3xl">delete_forever</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Media?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This will permanently delete this media file. 
                This action cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg transition hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Yes, Delete
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OrganizerGallery;
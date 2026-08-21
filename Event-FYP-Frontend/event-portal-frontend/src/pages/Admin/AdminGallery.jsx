import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  Search, 
  RefreshCw, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  Video,
  BarChart3,
  Download,
  Play,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader,
  Menu
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const BASE_URL = 'http://localhost:5000';

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all events - ONLY APPROVED
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/events/all`, { headers });
        let allEvents = res.data?.events || res.data || [];
        allEvents = allEvents.filter(event => event.approved === true);
        setEvents(allEvents);
      } catch (err) {
        console.error('Events fetch error:', err);
        showToast('Failed to load events', 'error');
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch gallery - CHECK APPROVED
  const fetchGallery = async (eventId) => {
    if (!eventId) return;
    
    const event = events.find(e => e._id === eventId);
    if (!event || !event.approved) {
      setMediaItems([]);
      showToast('This event is not approved yet. Only approved events have gallery access.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/gallery/event/${eventId}`, { headers });
      setMediaItems(res.data || []);
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setMediaItems([]);
      showToast('Failed to load gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchGallery(selectedEvent);
    }
  }, [selectedEvent]);

  const handleDelete = async () => {
    if (!mediaToDelete) return;
    
    setDeletingId(mediaToDelete);
    try {
      await axios.delete(`${BASE_URL}/api/gallery/${mediaToDelete}`, { headers });
      setMediaItems((prev) => prev.filter((m) => m._id !== mediaToDelete));
      if (lightbox?._id === mediaToDelete) setLightbox(null);
      showToast('Media deleted successfully!', 'success');
      setShowDeleteModal(false);
      setMediaToDelete(null);
    } catch (err) {
      showToast('Delete failed. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteModal = (id) => {
    setMediaToDelete(id);
    setShowDeleteModal(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (selectedEvent) {
      await fetchGallery(selectedEvent);
    }
    setIsRefreshing(false);
    showToast('Gallery refreshed successfully!', 'success');
  };

  const handleDownload = async (item) => {
    try {
      const response = await fetch(`${BASE_URL}${item.media_url}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = item.media_type === 'Video' ? 'mp4' : 'jpg';
      link.download = `${item._id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Download started!', 'success');
    } catch (err) {
      showToast('Download failed. Please try again.', 'error');
    }
  };

  // FIX: Search now works on media items (title/description) AND event name
  const filteredMedia = mediaItems.filter((item) => {
    // Filter by type (Images/Videos/All)
    if (activeFilter === 'Images' && item.media_type !== 'Image') return false;
    if (activeFilter === 'Videos' && item.media_type !== 'Video') return false;
    
    // Search functionality - search in media title, description, and event name
    if (searchQuery) {
      const event = events.find(e => e._id === selectedEvent);
      const eventName = event?.title?.toLowerCase() || '';
      const searchLower = searchQuery.toLowerCase();
      
      // Check if search matches: event name, media title, or media description
      const matchesEvent = eventName.includes(searchLower);
      const matchesTitle = item.title?.toLowerCase().includes(searchLower) || false;
      const matchesDescription = item.description?.toLowerCase().includes(searchLower) || false;
      
      return matchesEvent || matchesTitle || matchesDescription;
    }
    
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

      <main className="flex-1 min-h-screen lg:ml-64">
        {/* Top Header - Mobile Responsive */}
        <header className="bg-white/80 backdrop-blur-md fixed top-0 right-0 left-0 lg:left-64 z-40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 hover:bg-purple-50 rounded-lg transition"
              >
                <Menu size={22} className="text-[#1c1b1b]" />
              </button>
            )}
            <div className="flex-1 sm:hidden">
              <h1 className="text-base font-bold text-[#1c1b1b] truncate">Gallery</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setMediaItems([]);
                    setActiveFilter('All');
                    setSearchQuery('');
                  }}
                  className="w-full sm:w-48 lg:w-56 pl-10 pr-4 py-2 bg-[#f0eded] border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7cf6ec] transition-all cursor-pointer text-[#1c1b1b] font-semibold"
                >
                  <option value="">Filter gallery...</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                  ))}
                </select>
              </div>
             
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || !selectedEvent}
                className="p-2 text-slate-500 hover:bg-purple-50 rounded-full transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <div className="h-8 w-8 rounded-full bg-[#8b4fa2] flex items-center justify-center text-white font-bold text-xs">A</div>
            </div>
          </div>
        </header>

        {/* Toast Notification - Responsive */}
        {toast && (
          <div className={`fixed top-18 sm:top-20 right-2 sm:right-6 z-50 flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold shadow-xl animate-fadeIn max-w-[90%] sm:max-w-md ${
            toast.type === 'success' 
              ? 'bg-[#1A1A1A] text-white border border-[#333]' 
              : 'bg-[#3A1414] text-white border border-[#5c2222]'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle size={15} className="text-[#4ECDC4] shrink-0" />
            ) : (
              <AlertCircle size={15} className="text-[#FF6B6B] shrink-0" />
            )}
            <span className="wrap-break-words">{toast.message}</span>
          </div>
        )}

        {/* Main Canvas */}
        <div className="pt-20 sm:pt-24 px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12 max-w-7xl mx-auto">

          {/* Page Header - Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 mb-6 sm:mb-10">
            <div>
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1b1b] tracking-tight">
                Gallery Management
              </h1>
              <p className="text-xs sm:text-sm text-[#4d434f] mt-1 sm:mt-2 font-medium">
                Monitor and moderate all event media across the portal.
              </p>
            </div>
            {selectedEvent && (
              <div className="bg-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl shadow-sm flex items-center gap-2 text-xs sm:text-sm font-bold text-[#80409b] w-full sm:w-auto">
                <Calendar size={16} className="shrink-0" />
                <span className="truncate">{getEventTitle()}</span>
              </div>
            )}
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-[#80409b] sm:size-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#4d434f] font-medium">Total Media</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1c1b1b]">{mediaItems.length}</p>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ImageIcon size={20} className="text-blue-600 sm:size-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#4d434f] font-medium">Images</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1c1b1b]">{imageCount}</p>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Video size={20} className="text-green-600 sm:size-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-[#4d434f] font-medium">Videos</p>
                <p className="text-xl sm:text-2xl font-bold text-[#1c1b1b]">{videoCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Left: Gallery */}
            <div className="lg:col-span-9 flex flex-col gap-6 lg:gap-8">

              {/* Filter Bar - Responsive */}
              {selectedEvent && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1 p-1 bg-[#f0eded] rounded-xl w-full sm:w-fit">
                    {['All', 'Images', 'Videos'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`flex-1 sm:flex-none px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                          activeFilter === f
                            ? 'bg-white text-[#80409b] shadow-sm'
                            : 'text-[#4d434f] hover:text-[#80409b]'
                        }`}
                      >
                        {f}
                        <span className="ml-1 text-xs opacity-60">
                          {f === 'All' ? mediaItems.length : f === 'Images' ? imageCount : videoCount}
                        </span>
                      </button>
                    ))}
                  </div>
                  {mediaItems.length > 0 && (
                    <p className="text-xs sm:text-sm text-[#4d434f] font-semibold">
                      <span className="text-[#cb4548] font-bold">Admin Mode</span> — You can delete any media
                    </p>
                  )}
                </div>
              )}

              {/* Gallery Grid - Responsive with FIXED layout */}
              {!selectedEvent ? (
                <div className="bg-white rounded-2xl p-10 sm:p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#f0eded] rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <ImageIcon size={32} className="text-[#c9a8e0] sm:size-10" />
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-lg sm:text-xl font-bold text-[#1c1b1b]">
                    Select an event to manage its gallery
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4d434f] mt-2 max-w-xs">
                    Use the dropdown above to filter by event and view or remove media.
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-16 sm:py-20 text-[#4d434f]">
                  <Loader size={40} className="text-[#80409b] animate-spin mx-auto" />
                  <p className="mt-3 font-semibold text-sm sm:text-base">Loading gallery...</p>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 sm:p-16 text-center flex flex-col items-center">
                  <ImageIcon size={36} className="text-[#c9a8e0] sm:size-12 mb-2" />
                  <p className="text-base sm:text-lg font-bold text-[#1c1b1b] mt-3">
                    {searchQuery ? 'No media matches your search.' : 'No media found'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#4d434f] mt-1">
                    {searchQuery 
                      ? `Try searching for "${searchQuery}" in media titles or descriptions.` 
                      : 'No photos or videos have been uploaded for this event yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                  {filteredMedia.map((item) => (
                    <div
                      key={item._id}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      {/* FIX: Changed from aspect-4/3 to aspect-square for consistent sizing */}
                      <div 
                        className="relative w-full aspect-square overflow-hidden cursor-pointer bg-[#f5f0f7]" 
                        onClick={() => openLightbox(item)}
                      >
                        {item.media_type === 'Video' ? (
                          <div className="relative w-full h-full bg-[#1c1b1b] flex items-center justify-center">
                            <video
                              src={`${BASE_URL}${item.media_url}`}
                              className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/40 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center group-hover:bg-[#8b4fa2]/80 transition">
                                <Play size={20} className="text-white ml-1 sm:size-7" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={`${BASE_URL}${item.media_url}`}
                            alt={item.title || 'gallery image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Media type badge on image */}
                        <div className="absolute top-2 left-2">
                          <span className={`text-[8px] sm:text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full shadow-md ${
                            item.media_type === 'Video'
                              ? 'bg-black/70 text-white'
                              : 'bg-purple-600/80 text-white'
                          }`}>
                            {item.media_type}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer - Responsive */}
                      <div className="p-3 sm:p-4 flex items-center justify-between flex-1">
                        <div className="min-w-0 flex-1">
                          {item.title && (
                            <p className="text-xs sm:text-sm font-bold text-[#1c1b1b] truncate">
                              {item.title}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs text-[#4d434f]">
                            {new Date(item.uploaded_at).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-0.5 sm:gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                            title="Download media"
                          >
                            <Download size={15} className="sm:size-4.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item._id)}
                            disabled={deletingId === item._id}
                            className={`p-1.5 sm:p-2 rounded-lg transition ${
                              deletingId === item._id
                                ? 'bg-gray-100 cursor-not-allowed'
                                : 'bg-red-50 hover:bg-red-100 text-[#cb4548]'
                            }`}
                            title="Delete media"
                          >
                            {deletingId === item._id ? (
                              <Loader size={15} className="animate-spin sm:size-4.5" />
                            ) : (
                              <Trash2 size={15} className="sm:size-4.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Mobile Responsive */}
            <div className="lg:col-span-3">
              <div className="sticky top-20 sm:top-24 lg:top-28 flex flex-col gap-4 lg:gap-6">

                {/* Stats - Responsive */}
                <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm">
                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base sm:text-lg text-[#1c1b1b] mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#80409b] sm:size-5" />
                    Media Stats
                  </h3>

                  {selectedEvent ? (
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-[#4d434f] font-semibold">Total Media</span>
                        <span className="font-extrabold text-[#1c1b1b] text-base sm:text-lg">{mediaItems.length}</span>
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
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-[#4d434f]">
                            <div className="w-2 h-2 rounded-full bg-[#9b59b6]" />
                            Images
                          </div>
                          <span className="font-bold">{imageCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-[#4d434f]">
                            <div className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
                            Videos
                          </div>
                          <span className="font-bold">{videoCount}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#4d434f]">Select an event to see stats.</p>
                  )}
                </div>

                {/* Events List - Responsive */}
                {events.length > 0 && (
                  <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-sm">
                    <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xs sm:text-sm text-[#1c1b1b] mb-3 sm:mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-[#80409b] sm:size-4.5" />
                      Approved Events
                    </h3>
                    <ul className="flex flex-col gap-1 max-h-48 sm:max-h-56 lg:max-h-64 overflow-y-auto">
                      {events.map((ev) => (
                        <li key={ev._id}>
                          <button
                            onClick={() => {
                              setSelectedEvent(ev._id);
                              setMediaItems([]);
                              setActiveFilter('All');
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition ${
                              selectedEvent === ev._id
                                ? 'bg-purple-100 text-[#80409b]'
                                : 'text-[#4d434f] hover:bg-[#f0eded]'
                            }`}
                          >
                            <span className="truncate block">{ev.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Admin Warning - Responsive */}
                <div className="bg-red-50 p-4 sm:p-5 rounded-xl border border-red-100">
                  <AlertCircle size={18} className="text-[#cb4548] mb-2 sm:size-5" />
                  <h4 className="font-bold text-[#cb4548] text-xs sm:text-sm">Admin Permissions</h4>
                  <p className="text-[#cb4548]/80 text-[10px] sm:text-xs mt-1 leading-relaxed">
                    As admin, you can permanently delete any media. Deleted files cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal - Responsive */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-[#cb4548] sm:size-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#1c1b1b]">Delete Media</h3>
            </div>
            <p className="text-xs sm:text-sm text-[#4d434f]">
              Are you sure you want to permanently delete this media? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-5 sm:mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMediaToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold transition hover:bg-gray-50 order-2 sm:order-1"
                style={{ borderColor: '#ECE6F4', color: '#5A5164' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === mediaToDelete}
                className="px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold transition hover:shadow-lg disabled:opacity-50 order-1 sm:order-2"
                style={{ background: '#FF6B6B' }}
              >
                {deletingId === mediaToDelete ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox - Responsive */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        >
          <button
            onClick={() => setLightbox(null)}
            className="fixed top-3 sm:top-5 right-3 sm:right-7 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 text-lg font-bold flex items-center justify-center transition z-50"
          >
            <X size={18} className="sm:size-6" />
          </button>

          <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 z-50 px-2">
            <span className="bg-white/10 text-white text-[10px] sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-1.5 rounded-full">
              {lightboxIndex + 1} / {filteredMedia.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openDeleteModal(lightbox._id); }}
              className="bg-[#cb4548]/80 hover:bg-[#cb4548] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1 transition"
            >
              <Trash2 size={12} className="sm:size-3.5" />
              <span className="hidden xs:inline">Delete</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(lightbox); }}
              className="bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1 transition"
            >
              <Download size={12} className="sm:size-3.5" />
              <span className="hidden xs:inline">Download</span>
            </button>
          </div>

          {filteredMedia.length > 1 && (
            <button
              onClick={prevMedia}
              className="fixed left-2 sm:left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition z-50"
            >
              <ChevronLeft size={22} className="sm:size-7" />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[90vw] sm:max-w-[85vw] max-h-[70vh] sm:max-h-[85vh]">
            {lightbox.media_type === 'Video' ? (
              <video
                src={`${BASE_URL}${lightbox.media_url}`}
                controls autoPlay
                className="w-full max-h-[70vh] sm:max-h-[85vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={`${BASE_URL}${lightbox.media_url}`}
                alt="full view"
                className="w-full max-h-[70vh] sm:max-h-[85vh] rounded-xl shadow-2xl object-contain"
              />
            )}
            <p className="text-white/60 text-[10px] sm:text-xs text-center mt-2 sm:mt-3 font-semibold">
              {new Date(lightbox.uploaded_at).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {filteredMedia.length > 1 && (
            <button
              onClick={nextMedia}
              className="fixed right-2 sm:right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition z-50"
            >
              <ChevronRight size={22} className="sm:size-7" />
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
        
        @media (max-width: 480px) {
          .xs\\:inline { display: inline; }
        }
        @media (min-width: 481px) {
          .xs\\:inline { display: inline; }
        }
      `}</style>
    </div>
  );
};

export default AdminGallery;
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import OrganizerSidebar from "../../components/OrganizerSidebar";

// ✅ FIX: API URL with /api
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Avatar gradients
const AVATAR_GRADS = [
  "linear-gradient(135deg,#9B59B6,#6d3483)",
  "linear-gradient(135deg,#8b4fa2,#6d3483)",
  "linear-gradient(135deg,#a866c5,#7a3d91)",
  "linear-gradient(135deg,#b577d4,#8b4fa2)",
  "linear-gradient(135deg,#c488e3,#9B59B6)",
];

const OrganizerCertificates = () => {
  const { user, token } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [presentStudents, setPresentStudents] = useState([]);
  const [issuedCerts, setIssuedCerts] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [issuingId, setIssuingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewCert, setPreviewCert] = useState(null);
  const [selectedType, setSelectedType] = useState("Participation");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkIssuing, setBulkIssuing] = useState(false);

  const CERT_TYPES = ['Participation', 'Achievement', 'Excellence', 'Volunteer', 'Winner', 'Technical', 'Non-Technical', 'Workshop', 'Seminar', 'Sports', 'Cultural'];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Check if event is completed ──
// ── Check if event is completed (DATE + TIME) ──
const isEventCompleted = (event) => {
  if (!event) return false;
  if (!event.approved) return false;

  const now = new Date();

  let eventEnd = new Date(event.end_date || event.start_date);
  if (event.end_time) {
    const [hours, minutes] = event.end_time.split(':').map(Number);
    eventEnd.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    eventEnd.setHours(23, 59, 59, 999);
  }

  let eventStart = new Date(event.start_date);
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':').map(Number);
    eventStart.setHours(hours || 0, minutes || 0, 0, 0);
  }

  if (eventStart > now) return false;
  return now > eventEnd;
};

// ── Get Event Status ──
const getEventStatus = (event) => {
  if (!event) return { label: "Unknown", color: "#9ca3af", icon: "help" };
  if (!event.approved) return { label: "⏳ Pending Approval", color: "#f59e0b", icon: "pending" };

  const now = new Date();

  let eventEnd = new Date(event.end_date || event.start_date);
  if (event.end_time) {
    const [hours, minutes] = event.end_time.split(':').map(Number);
    eventEnd.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    eventEnd.setHours(23, 59, 59, 999);
  }

  let eventStart = new Date(event.start_date);
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':').map(Number);
    eventStart.setHours(hours || 0, minutes || 0, 0, 0);
  }

  if (eventStart > now) return { label: "⏳ Upcoming", color: "#3b82f6", icon: "schedule" };
  if (now >= eventStart && now <= eventEnd) return { label: "⏳ Ongoing", color: "#8b4fa2", icon: "event" };
  if (now > eventEnd) return { label: "✅ Completed", color: "#10b981", icon: "check_circle" };

  return { label: "Unknown", color: "#9ca3af", icon: "help" };
};
  // ── Fetch organizer's events ──
  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) {
        setLoadingEvents(false);
        return;
      }

      try {
        setLoadingEvents(true);
        const res = await axios.get(`${API_URL}/events/organizer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const eventsData = res.data?.data || res.data || [];
        const evArray = Array.isArray(eventsData) ? eventsData : [];
        setEvents(evArray);
        
      } catch (error) {
        console.error("Events load error:", error);
        showToast("Events load nahi hue", "error");
      } finally {
        setLoadingEvents(false);
      }
    };
    
    fetchEvents();
  }, [token]);

  // ── Fetch present students + issued certs when event selected ──
  useEffect(() => {
    if (!selectedEvent || !token) {
      setPresentStudents([]);
      setIssuedCerts([]);
      return;
    }
    
    const fetchData = async () => {
      setLoadingStudents(true);
      try {
        const [regRes, certRes] = await Promise.all([
          axios.get(`${API_URL}/registrations/events/${selectedEvent}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/certificates/my-events`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const allRegs = regRes.data?.data || [];
        const present = allRegs.filter((r) => r.attendance_status === "Present");
        
        setPresentStudents(present);
        setIssuedCerts(certRes.data?.data || []);
        
      } catch (error) {
        console.error("Data fetch error:", error);
        showToast("Data load nahi hua", "error");
      } finally {
        setLoadingStudents(false);
      }
    };
    
    fetchData();
  }, [selectedEvent, token]);

  const issuedStudentIds = new Set(
    issuedCerts.map((c) => c.student_id?._id?.toString() || c.student_id?.toString())
  );

  // ── SELECTED EVENT DATA ──
  const selectedEventData = events.find(ev => ev._id === selectedEvent);
  const eventCompleted = isEventCompleted(selectedEventData);
  const eventStatus = getEventStatus(selectedEventData);
  const canIssue = eventCompleted;

  // ── HANDLE ISSUE CERTIFICATE ──
  const handleIssueCertificate = async (student_id) => {
    if (!token) {
      showToast("Please login again", "error");
      return;
    }

    // ✅ CHECK: Event complete hai ya nahi?
    if (!canIssue) {
      showToast(`⚠️ Certificate can only be issued for completed events! Status: ${eventStatus.label}`, "error");
      return;
    }
    
    setIssuingId(student_id);
    
    try {
      await axios.post(
        `${API_URL}/certificates/issue`,
        {
          student_id: student_id,
          event_id: selectedEvent,
          certificate_type: selectedType
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      showToast("✅ Certificate issued successfully!", "success");
      const certRes = await axios.get(`${API_URL}/certificates/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssuedCerts(certRes.data?.data || []);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Certificate issue failed";
      showToast(errorMessage, "error");
    } finally {
      setIssuingId(null);
    }
  };

  // ── HANDLE BULK ISSUE ──
  const handleBulkIssue = async (target) => {
    if (!token || !selectedEvent) return;

    // ✅ CHECK: Event complete hai ya nahi?
    if (!canIssue) {
      showToast(`⚠️ Certificates can only be issued for completed events! Status: ${eventStatus.label}`, "error");
      return;
    }
    
    setBulkIssuing(true);
    try {
      const payload = { event_id: selectedEvent, certificate_type: selectedType };
      
      if (target === 'selected') {
        if (selectedIds.size === 0) {
          showToast("Pehle students select karein", "error");
          setBulkIssuing(false);
          return;
        }
        payload.student_ids = Array.from(selectedIds);
      } else {
        payload.target = target;
      }
      
      const res = await axios.post(`${API_URL}/certificates/issue-bulk`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      showToast(res.data?.message || "Bulk certificates issued!", "success");
      setSelectedIds(new Set());
      
      const certRes = await axios.get(`${API_URL}/certificates/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssuedCerts(certRes.data?.data || []);
      
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk issue failed", "error");
    } finally {
      setBulkIssuing(false);
    }
  };

  const toggleSelect = (studentId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // ── HANDLE DOWNLOAD ──
  const handleDownloadCertificate = async (certId, studentName) => {
    if (!token) {
      showToast("Please login again", "error");
      return;
    }
    
    setDownloadingId(certId);
    try {
      const response = await axios.get(`${API_URL}/certificates/download/${certId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${studentName?.replace(/\s/g, '_') || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast("Certificate downloaded successfully!", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast(err.response?.data?.message || "Failed to download certificate", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  // ── HANDLE DELETE ──
  const handleDeleteCertificate = async () => {
    if (!deleteModal) return;
    
    try {
      setDeleting(true);
      const response = await axios.delete(`${API_URL}/certificates/${deleteModal._id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data?.success) {
        setIssuedCerts((prev) => prev.filter((c) => c._id !== deleteModal._id));
        setDeleteModal(null);
        showToast("Certificate deleted successfully", "success");
      } else {
        showToast(response.data?.message || "Failed to delete certificate", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      const errorMsg = err.response?.data?.message || "Failed to delete certificate";
      showToast(errorMsg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewCertificate = (cert) => {
    setPreviewCert(cert);
  };

  const filteredStudents = presentStudents.filter(student => {
    const matchesSearch = 
      student.student_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "students" ? student.role === "Student" :
      activeTab === "volunteers" ? student.role === "Volunteer" : true;
    
    return matchesSearch && matchesTab;
  });

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
  };

  const pendingCount = presentStudents.length - issuedCerts.length;

  // ── LOADING ──
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#f7f4fb" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <OrganizerSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-8">

        {/* HEADER BANNER */}
        <div
          className="relative overflow-hidden px-8 pt-10 pb-8"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="inline-block px-5 py-1 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                Organizer Portal
              </p>
              <h1 className="text-3xl font-black text-white">
                Certificate Manager
              </h1>
              <p className="text-purple-200 text-sm mt-1">Issue and manage digital certificates for your events</p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {[
                { icon: "school", label: "Present Students", value: presentStudents.length },
                { icon: "verified", label: "Issued", value: issuedCerts.length },
                { icon: "pending", label: "Pending", value: pendingCount },
                { icon: "event", label: "My Events", value: events.length },
              ].map((s) => (
                <div key={s.label} className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <span className="material-symbols-outlined text-white text-sm group-hover:animate-pulse">
                    {s.icon === "school" ? "school" : s.icon === "verified" ? "verified" : s.icon === "pending" ? "pending" : "event"}
                  </span>
                  <span className="text-xl font-black text-white">{s.value}</span>
                  <span className="text-purple-200 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all"
            style={{ background: toast.type === "success" ? "linear-gradient(135deg,#9B59B6,#6d3483)" : "linear-gradient(135deg,#ef4444,#dc2626)" }}>
            {toast.msg}
          </div>
        )}

        <div className="px-6 pt-6 max-w-7xl mx-auto">

          {/* ── EVENT SELECTION CARD ── */}
          <div className="bg-white rounded-3xl overflow-hidden mb-6"
            style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.09)", border: "1px solid rgba(155,89,182,0.08)" }}>
            
            <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b4fa2]">event</span>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Select Event</p>
              </div>
            </div>

            <div className="p-6">
              {loadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-gray-500">Loading your events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-5xl text-gray-300">event_busy</span>
                  <p className="text-gray-400 mt-2">No events found. Create an event first.</p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-[#8b4fa2] focus:outline-none transition-colors bg-white text-gray-700 appearance-none cursor-pointer"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((ev) => {
                      const status = getEventStatus(ev);
                      return (
                        <option key={ev._id} value={ev._id}>
                          {ev.title} — {status.label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <span className="material-symbols-outlined text-purple-500">expand_more</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedEvent && (
            <>
              {/* ── EVENT STATUS BANNER ── */}
              <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                canIssue ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
              }`}>
                <span className={`material-symbols-outlined text-2xl ${
                  canIssue ? "text-green-500" : "text-amber-500"
                }`}>
                  {canIssue ? "check_circle" : "info"}
                </span>
                <div>
                  <p className={`font-bold text-sm ${canIssue ? "text-green-700" : "text-amber-700"}`}>
                    Event Status: {eventStatus.label}
                  </p>
                  {!canIssue && (
                    <p className="text-xs text-amber-600">
                      {!selectedEventData?.approved 
                        ? "Event approval pending. Certificates can only be issued for approved events."
                        : "Event is still ongoing. Certificates can only be issued after the event ends."
                      }
                    </p>
                  )}
                  {canIssue && (
                    <p className="text-xs text-green-600">
                      ✅ This event is complete. You can issue certificates to all present students.
                    </p>
                  )}
                </div>
              </div>

              {/* ── STATS CARDS ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-3xl p-5 text-center transition-all hover:scale-105"
                  style={{ boxShadow: "0 4px 20px rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.06)" }}>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[#8b4fa2] text-2xl">groups</span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">{presentStudents.length}</p>
                  <p className="text-xs text-gray-500 font-semibold">Present Students</p>
                </div>

                <div className="bg-white rounded-3xl p-5 text-center transition-all hover:scale-105"
                  style={{ boxShadow: "0 4px 20px rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.06)" }}>
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-teal-600 text-2xl">verified</span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">{issuedCerts.length}</p>
                  <p className="text-xs text-gray-500 font-semibold">Certificates Issued</p>
                </div>

                <div className="bg-white rounded-3xl p-5 text-center transition-all hover:scale-105"
                  style={{ boxShadow: "0 4px 20px rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.06)" }}>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-amber-600 text-2xl">pending</span>
                  </div>
                  <p className="text-2xl font-black text-gray-800">{pendingCount}</p>
                  <p className="text-xs text-gray-500 font-semibold">Pending Issuance</p>
                </div>
              </div>

              {/* ── SEARCH BAR ── */}
              <div className="bg-white rounded-3xl mb-6 p-4"
                style={{ boxShadow: "0 2px 12px rgba(155,89,182,0.06)", border: "1px solid rgba(155,89,182,0.06)" }}>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">search</span>
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-purple-100 focus:border-[#8b4fa2] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* ── CERTIFICATE TYPE + BULK ACTIONS ── */}
              <div className="bg-white rounded-3xl mb-6 p-5"
                style={{ boxShadow: "0 2px 12px rgba(155,89,182,0.06)", border: "1px solid rgba(155,89,182,0.06)" }}>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1 block">Certificate Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-purple-100 focus:border-[#8b4fa2] focus:outline-none bg-white text-gray-700"
                    >
                      {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {[
                    { key: "all", label: "All" },
                    { key: "students", label: "Students" },
                    { key: "volunteers", label: "Volunteers" },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        activeTab === tab.key
                          ? "text-white shadow-md"
                          : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                      }`}
                      style={activeTab === tab.key ? { background: "linear-gradient(135deg,#9B59B6,#6d3483)" } : {}}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Bulk Buttons - Disabled if event not completed */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleBulkIssue('All')}
                    disabled={bulkIssuing || !canIssue}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      !canIssue ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ background: canIssue ? "linear-gradient(135deg,#9B59B6,#6d3483)" : "#b0a0b0" }}
                  >
                    {bulkIssuing ? "Issuing..." : "🎓 Issue to All Present"}
                  </button>

                  <button
                    onClick={() => handleBulkIssue('Volunteer')}
                    disabled={bulkIssuing || !canIssue}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      !canIssue ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ background: canIssue ? "linear-gradient(135deg,#4ECDC4,#2b9d94)" : "#b0b0b0" }}
                  >
                    {bulkIssuing ? "Issuing..." : "🙋 Issue to All Volunteers"}
                  </button>

                  <button
                    onClick={() => handleBulkIssue('selected')}
                    disabled={bulkIssuing || selectedIds.size === 0 || !canIssue}
                    className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      !canIssue || selectedIds.size === 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{ background: canIssue ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#b0a0a0" }}
                  >
                    {bulkIssuing ? "Issuing..." : `✅ Issue to Selected (${selectedIds.size})`}
                  </button>
                </div>

                {!canIssue && (
                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Issue certificates disabled — event is {eventStatus.label.toLowerCase()}
                  </p>
                )}
              </div>

              {/* ── PRESENT STUDENTS SECTION ── */}
              <div className="bg-white rounded-3xl overflow-hidden mb-6"
                style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.09)", border: "1px solid rgba(155,89,182,0.08)" }}>
                
                <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b4fa2]">groups</span>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Eligible Students</p>
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#8b4fa2]">
                      {filteredStudents.length} students
                    </span>
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-[#9B59B6] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-4xl text-[#8b4fa2]">school</span>
                    </div>
                    <p className="text-base font-black text-gray-600">No present students found</p>
                    <p className="text-sm text-gray-400 mt-1">Mark attendance first to issue certificates</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredStudents.map((reg, idx) => {
                      const studentId = reg.student_id?._id || reg.student_id;
                      const alreadyIssued = issuedStudentIds.has(studentId?.toString());
                      const studentName = reg.student_id?.name || "Student";
                      const initials = studentName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                      
                      return (
                        <div key={reg._id} className="p-5 hover:bg-purple-50/30 transition-colors group">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Checkbox - only if not already issued AND canIssue */}
                              {!alreadyIssued && canIssue && (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(studentId?.toString())}
                                  onChange={() => toggleSelect(studentId?.toString())}
                                  className="w-5 h-5 rounded border-2 border-purple-300 accent-[#8b4fa2] cursor-pointer shrink-0"
                                />
                              )}

                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md transition-transform group-hover:scale-105"
                                style={{ background: AVATAR_GRADS[idx % AVATAR_GRADS.length] }}>
                                {initials}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-gray-800 truncate">{studentName}</h3>
                                <p className="text-sm text-gray-500 truncate">{reg.student_id?.email || ""}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {reg.student_id?.department && (
                                    <p className="text-xs text-gray-400">{reg.student_id.department}</p>
                                  )}
                                  {reg.role === "Volunteer" && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">VOLUNTEER</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {alreadyIssued ? (
                              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                                <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                <span className="text-green-600 font-semibold text-sm">Issued</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleIssueCertificate(studentId)}
                                disabled={issuingId === studentId || !canIssue}
                                className={`px-6 py-2 rounded-full text-white font-bold text-sm transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                                  !canIssue ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                style={{ background: canIssue ? "linear-gradient(135deg,#9B59B6,#6d3483)" : "#b0a0b0" }}
                              >
                                {issuingId === studentId ? (
                                  <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Issuing...
                                  </span>
                                ) : !canIssue ? (
                                  <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">lock</span>
                                    {!selectedEventData?.approved ? "Not Approved" : "Event Ongoing"}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Issue Certificate
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── ISSUED CERTIFICATES SECTION ── */}
              {issuedCerts.length > 0 && (
                <div className="bg-white rounded-3xl overflow-hidden"
                  style={{ boxShadow: "0 4px 24px rgba(155,89,182,0.09)", border: "1px solid rgba(155,89,182,0.08)" }}>
                  
                  <div className="bg-linear-to-r from-[#8b4fa2]/5 to-transparent px-6 pt-5 pb-3 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8b4fa2]">verified</span>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Issued Certificates</p>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">
                        {issuedCerts.length} issued
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {issuedCerts.map((cert) => (
                      <div key={cert._id} className="p-5 hover:bg-purple-50/30 transition-colors group">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-base font-black shadow-md">
                              {cert.student_id?.name?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-gray-800">{cert.student_id?.name || "—"}</h3>
                              <p className="text-sm text-gray-500">{cert.student_id?.email || "—"}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#8b4fa2]">
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  {cert.certificate_type}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                                  {formatDate(cert.issued_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewCertificate(cert)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              Preview
                            </button>
                            
                            <button
                              onClick={() => handleDownloadCertificate(cert._id, cert.student_id?.name)}
                              disabled={downloadingId === cert._id}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all"
                            >
                              {downloadingId === cert._id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">download</span>
                                  Download
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => setDeleteModal(cert)}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── PREVIEW MODAL ── */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setPreviewCert(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-linear-to-r from-[#9B59B6] to-[#6d3483] p-5 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white">Certificate Preview</h3>
                <button onClick={() => setPreviewCert(null)} className="text-white hover:bg-white/20 rounded-full p-1 transition">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="border-8 border-purple-200 rounded-2xl p-8 bg-linear-to-br from-purple-50 to-pink-50">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🏆</div>
                  <h2 className="text-3xl font-bold text-purple-700">Certificate of {previewCert.certificate_type}</h2>
                  <div className="w-20 h-1 bg-linear-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-3"></div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-gray-600">This certificate is proudly presented to</p>
                  <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 my-4">
                    {previewCert.student_id?.name}
                  </h3>
                  <p className="text-gray-600">for successfully participating in</p>
                  <h4 className="text-2xl font-bold text-purple-700 my-3">{previewCert.event_id?.title}</h4>
                  <div className="flex justify-center gap-4 text-sm text-gray-500 mt-3">
                    <span>📅 {formatDate(previewCert.event_id?.start_date)}</span>
                    <span>📍 {previewCert.event_id?.venue || "College Campus"}</span>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-purple-200">
                  <p className="text-sm text-gray-500">Issued on: {formatDate(previewCert.issued_date)}</p>
                  <p className="text-xs text-gray-400 mt-2">Certificate ID: {previewCert._id}</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button onClick={() => setPreviewCert(null)} className="px-6 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-100">
                Close
              </button>
              <button 
                onClick={() => {
                  handleDownloadCertificate(previewCert._id, previewCert.student_id?.name);
                  setPreviewCert(null);
                }}
                className="px-6 py-2 rounded-xl text-white font-bold bg-linear-to-r from-[#9B59B6] to-[#6d3483] hover:shadow-lg"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center transform transition-all duration-200 scale-100">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[34px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Delete Certificate?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Certificate for <span className="font-bold text-gray-700">{deleteModal.student_id?.name}</span> will be permanently removed.
            </p>
            <p className="text-xs text-red-500 mb-6">This action cannot be undone!</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                Keep It
              </button>
              <button onClick={handleDeleteCertificate} disabled={deleting}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60 shadow-md hover:shadow-lg"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Yes, Delete
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerCertificates;
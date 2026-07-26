import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Award,
  Search,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Trash2,
  Edit,
  Loader,
  AlertTriangle,
  X,
  Download,
  Eye,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  Printer,
  Users
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLORS = {
  purple: "#8b4fa2",
  purpleDeep: "#5B2C6F",
  turquoise: "#4ECDC4",
  coral: "#FF6B6B",
  yellow: "#FFE66D",
  ink: "#1A1A1A",
  paper: "#FAF9FC",
  line: "#ECE6F4",
  success: "#10b981",
  pending: "#f59e0b",
  danger: "#ef4444",
};

const ManageCertificates = () => {
  const { token, user } = useAuth();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    student_id: "",
    event_id: "",
    certificate_type: "Participation"
  });
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchCertificates();
      fetchEvents();
      fetchAllStudents();
    } else {
      setLoading(false);
      setError("Please login to view certificates");
    }
  }, [token]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");
      setIsRefreshing(true);
      
      if (!token) {
        setError("Authentication required.");
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${API_URL}/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setCertificates(list);
    } catch (err) {
      console.error("Fetch certificates error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load certificates.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      
      if (!token) return;
      
      const res = await axios.get(`${API_URL}/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.events)
        ? res.data.events
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      
      const approvedEvents = list.filter(e => e.approved === true);
      setEvents(approvedEvents);
      
      // Fetch registrations for each event
      for (const event of approvedEvents) {
        await fetchRegistrationsForEvent(event._id);
      }
      
      console.log("Events loaded:", approvedEvents.length);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // ─── FETCH REGISTRATIONS FOR EVENT ───
  const fetchRegistrationsForEvent = async (eventId) => {
    try {
      const res = await axios.get(`${API_URL}/registrations/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let registrations = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        registrations = res.data.data;
      } else if (Array.isArray(res.data)) {
        registrations = res.data;
      }
      
      setEventRegistrations(prev => ({
        ...prev,
        [eventId]: registrations
      }));
      
      console.log(`Registrations for event ${eventId}:`, registrations.length);
    } catch (err) {
      console.error(`Failed to fetch registrations for event ${eventId}:`, err.message);
      // If endpoint doesn't exist, we'll use all students as fallback
      setEventRegistrations(prev => ({
        ...prev,
        [eventId]: allStudents.map(s => ({
          student_id: s,
          attendance_status: 'Present'
        }))
      }));
    }
  };

  // ─── FETCH ALL STUDENTS ───
  const fetchAllStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setAllStudents(list);
      console.log("Students loaded:", list.length);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  // ─── FETCH STUDENTS FOR EVENT - FIXED ───
  const fetchStudentsForEvent = async (eventId) => {
    if (!eventId) {
      setStudents([]);
      return;
    }
    
    try {
      setLoadingStudents(true);
      console.log("Fetching students for event:", eventId);
      
      let eventStudents = [];
      
      // First check if we already have registrations for this event
      if (eventRegistrations[eventId]) {
        const registrations = eventRegistrations[eventId];
        console.log("Found cached registrations:", registrations.length);
        
        // Filter for present students
        eventStudents = registrations.filter(r => 
          r.attendance_status === 'Present' || 
          r.attendance_status === 'present'
        );
        
        // If no present students, show all registered students
        if (eventStudents.length === 0 && registrations.length > 0) {
          eventStudents = registrations;
          console.log("No present students, showing all registrations");
        }
      }
      
      // If no registrations found, use all students as fallback
      if (eventStudents.length === 0 && allStudents.length > 0) {
        console.log("Using all students as fallback");
        eventStudents = allStudents.map(s => ({
          student_id: s,
          attendance_status: 'Present',
          _id: s._id
        }));
      }
      
      console.log("Final students list:", eventStudents.length);
      setStudents(eventStudents);
      
      if (eventStudents.length === 0) {
        showToast("No students found for this event.", "info");
      }
      
    } catch (err) {
      console.error("Failed to fetch students:", err);
      showToast("Failed to fetch students. Please try again.", "error");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // ─── ISSUE CERTIFICATE ───
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    try {
      setActioningId("issue");
      
      console.log("Issuing certificate with data:", issueFormData);
      
      const res = await axios.post(
        `${API_URL}/certificates/issue`,
        issueFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Certificate issued:", res.data);
      showToast("Certificate issued successfully!", "success");
      
      setShowIssueModal(false);
      setIssueFormData({
        student_id: "",
        event_id: "",
        certificate_type: "Participation"
      });
      setStudents([]);
      
      fetchCertificates();
    } catch (err) {
      console.error("Issue error:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMsg = "Failed to issue certificate";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 500) {
        errorMsg = "Server error. Please check the certificate controller.";
      }
      showToast(errorMsg, "error");
    } finally {
      setActioningId(null);
    }
  };

  // ─── EDIT CERTIFICATE ───
  const handleEditClick = (cert) => {
    setShowEditModal(true);
    setIssueFormData({
      student_id: cert.student_id?._id || cert.student_id || "",
      event_id: cert.event_id?._id || cert.event_id || "",
      certificate_type: cert.certificate_type || "Participation"
    });
    setSelectedCertificate(cert);
    
    const eventId = cert.event_id?._id || cert.event_id;
    if (eventId) {
      fetchStudentsForEvent(eventId);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setActioningId("edit");
      
      await axios.delete(
        `${API_URL}/certificates/${selectedCertificate._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await axios.post(
        `${API_URL}/certificates/issue`,
        issueFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Certificate updated successfully!", "success");
      
      setShowEditModal(false);
      setIssueFormData({
        student_id: "",
        event_id: "",
        certificate_type: "Participation"
      });
      setStudents([]);
      setSelectedCertificate(null);
      
      fetchCertificates();
    } catch (err) {
      console.error("Edit error:", err);
      showToast("Failed to update certificate", "error");
    } finally {
      setActioningId(null);
    }
  };

  // ─── DELETE CERTIFICATE ───
  const handleDeleteCertificate = async (certificateId) => {
    try {
      setActioningId(certificateId);
      
      const certificate = certificates.find(c => c._id === certificateId);
      
      if (!window.confirm(
        `⚠️ Are you sure you want to delete this certificate for ${certificate?.student_id?.name || 'student'}?`
      )) {
        setActioningId(null);
        return;
      }

      await axios.delete(
        `${API_URL}/certificates/${certificateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Certificate deleted successfully!", "success");
      
      setCertificates(prev => prev.filter(c => c._id !== certificateId));
      
      if (selectedCertificate?._id === certificateId) {
        setSelectedCertificate(null);
      }
      
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete certificate", "error");
    } finally {
      setActioningId(null);
    }
  };

  // ─── DOWNLOAD CERTIFICATE ───
  const handleDownloadCertificate = async (certificateId) => {
    try {
      const response = await axios.get(
        `${API_URL}/certificates/download/${certificateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showToast("Certificate downloaded successfully!", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Failed to download certificate", "error");
    }
  };

  // ─── PREVIEW CERTIFICATE ───
  const handlePreviewCertificate = (cert) => {
    setPreviewCertificate(cert);
  };

  const handleIssueChange = (e) => {
    const { name, value } = e.target;
    setIssueFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'event_id' && value) {
      fetchStudentsForEvent(value);
    }
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateLong = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-PK", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const filteredCertificates = certificates.filter((c) => {
    const searchLower = search.toLowerCase();
    return (
      c.student_id?.name?.toLowerCase().includes(searchLower) ||
      c.event_id?.title?.toLowerCase().includes(searchLower) ||
      c.certificate_type?.toLowerCase().includes(searchLower) ||
      c.student_id?.email?.toLowerCase().includes(searchLower)
    );
  });

  const totalCertificates = certificates.length;

  // If no token, show login message
  if (!token) {
    return (
      <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
        <AdminSidebar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={36} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-500 mt-2">Please login to access certificates</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: COLORS.paper }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">

        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#8b4fa2 0%,#6d3483 100%)" }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFE66D]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase shadow-lg">
                <Sparkles size={14} />
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Manage <span className="text-[#FFE66D]">Certificates</span>
              </h1>
              <p className="text-purple-200 text-sm mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFE66D] animate-pulse" />
                Issue, manage, and track all certificates
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: totalCertificates, color: "#FFE66D", icon: <Award size={14} /> },
                { label: "Issued", value: totalCertificates, color: "#34d399", icon: <CheckCircle size={14} /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-white/70">{s.icon}</span>
                  <span className="text-xl font-black" style={{ color: s.color }}>
                    {s.value}
                  </span>
                  <span className="text-white/70 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {/* ── TOAST ── */}
          {toast && (
            <div
              className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-semibold shadow-2xl animate-fadeIn border ${
                toast.type === "success"
                  ? "bg-[#1A1A1A] text-white border-[#333] shadow-purple-500/10"
                  : toast.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/10"
                  : "bg-[#3A1414] text-white border-[#5c2222] shadow-red-500/10"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle size={20} style={{ color: COLORS.turquoise }} className="shrink-0" />
              ) : toast.type === "info" ? (
                <AlertCircle size={20} style={{ color: "#3b82f6" }} className="shrink-0" />
              ) : (
                <AlertCircle size={20} style={{ color: COLORS.coral }} className="shrink-0" />
              )}
              <span>{toast.msg}</span>
            </div>
          )}

          {/* ── ACTION BAR ── */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100/80 mb-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search by student name, event, or certificate type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent transition-all duration-300 hover:border-gray-200"
                />
              </div>

              <button
                onClick={() => setShowIssueModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#6d3483] text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus size={18} />
                <span>Issue Certificate</span>
              </button>

              <button
                onClick={fetchCertificates}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-3 rounded-xl px-5 py-3.5 mb-5 text-sm font-medium border border-red-200"
              style={{ background: "#FDF1F1", color: "#B23A3A" }}
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-72 gap-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full border-[3px] animate-spin"
                  style={{ borderColor: COLORS.line, borderTopColor: COLORS.purple }}
                />
                <div
                  className="absolute inset-0 w-12 h-12 rounded-full border-[3px] animate-ping opacity-20"
                  style={{ borderColor: COLORS.purple }}
                />
              </div>
              <p className="text-sm font-medium" style={{ color: "#9A90A8" }}>
                Loading certificates…
              </p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed text-center p-8"
              style={{ borderColor: "#DED4EA", background: "#ffffff" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#F3ECFA" }}
              >
                <Award size={36} style={{ color: COLORS.purple }} />
              </div>
              <p className="text-lg font-bold" style={{ color: COLORS.ink }}>
                {search ? "No certificates found" : "No certificates issued yet"}
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#9A90A8" }}>
                {search ? "Try a different search term." : "Issue certificates to students who attended events."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => {
                const isActioning = actioningId === cert._id;

                return (
                  <div
                    key={cert._id}
                    className="group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    style={{ borderColor: COLORS.line }}
                  >
                    <div className="relative p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{ background: "linear-gradient(135deg, #F3ECFA, #E8DCF5)" }}
                        >
                          <Award size={28} style={{ color: COLORS.purple }} />
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                          {cert.certificate_type}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-[#8b4fa2] transition-colors">
                        {cert.student_id?.name || "Unknown Student"}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {cert.event_id?.title || "Unknown Event"}
                      </p>

                      <div className="mt-3 space-y-1 text-xs text-gray-400">
                        <p className="flex items-center gap-2">
                          <Calendar size={12} className="text-gray-400" />
                          Issued: {formatDate(cert.issued_date)}
                        </p>
                        <p className="flex items-center gap-2">
                          <User size={12} className="text-gray-400" />
                          {cert.student_id?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePreviewCertificate(cert)}
                        className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5 border"
                        style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(cert._id)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                      >
                        <Download size={15} />
                        Download
                      </button>
                      <button
                        onClick={() => handleEditClick(cert)}
                        className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5 border"
                        style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(cert._id)}
                        disabled={isActioning}
                        className="px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5 border"
                        style={{ background: "#FDF1F1", color: COLORS.coral, borderColor: "#F5D6D6" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── PREVIEW CERTIFICATE MODAL ─── */}
      {previewCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setPreviewCertificate(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-8">
              <button
                onClick={() => setPreviewCertificate(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:scale-110 transition-all duration-300"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #F3ECFA, #E8DCF5)" }}
                >
                  <Award size={36} style={{ color: COLORS.purple }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Certificate Preview</h2>
                <p className="text-sm text-gray-500 mt-1">Certificate ID: {previewCertificate._id}</p>
              </div>

              <div
                className="rounded-3xl p-8 border-4"
                style={{ borderColor: COLORS.purple, background: "white" }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h1 className="text-3xl font-bold" style={{ color: COLORS.purple }}>
                    Certificate of {previewCertificate.certificate_type}
                  </h1>
                  <div className="w-24 h-1 mx-auto my-4 rounded-full" style={{ background: COLORS.purple }} />
                  <p className="text-gray-600">This certificate is proudly presented to</p>
                  <h2 className="text-4xl font-bold mt-3" style={{ color: COLORS.turquoise }}>
                    {previewCertificate.student_id?.name || "Student"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {previewCertificate.student_id?.email || "No email"}
                  </p>
                  <div className="mt-6">
                    <p className="text-gray-600">for successfully participating in</p>
                    <h3 className="text-2xl font-bold mt-2" style={{ color: COLORS.purple }}>
                      {previewCertificate.event_id?.title || "Event"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      📅 {formatDate(previewCertificate.event_id?.start_date)} &nbsp;|&nbsp; 📍 {previewCertificate.event_id?.venue || "N/A"}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-400">
                      Issued on: {formatDateLong(previewCertificate.issued_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDownloadCertificate(previewCertificate._id)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  <Download size={18} />
                  Download Certificate
                </button>
                <button
                  onClick={() => {
                    handleEditClick(previewCertificate);
                    setPreviewCertificate(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 border"
                  style={{ background: "#FAF8FC", color: "#5A5164", borderColor: COLORS.line }}
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(previewCertificate._id);
                    setPreviewCertificate(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 border"
                  style={{ background: "#FDF1F1", color: COLORS.coral, borderColor: "#F5D6D6" }}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ISSUE CERTIFICATE MODAL ─── */}
      {showIssueModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => {
            setShowIssueModal(false);
            setStudents([]);
            setIssueFormData({
              student_id: "",
              event_id: "",
              certificate_type: "Participation"
            });
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Award size={22} style={{ color: COLORS.purple }} />
                Issue Certificate
              </h2>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setStudents([]);
                  setIssueFormData({
                    student_id: "",
                    event_id: "",
                    certificate_type: "Participation"
                  });
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-110"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event *</label>
                <select
                  name="event_id"
                  value={issueFormData.event_id}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  required
                >
                  <option value="">Select Event</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} ({formatDate(event.start_date)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student *</label>
                <select
                  name="student_id"
                  value={issueFormData.student_id}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  required
                  disabled={loadingStudents || !issueFormData.event_id}
                >
                  <option value="">
                    {loadingStudents ? "Loading students..." : 
                     !issueFormData.event_id ? "Select an event first" : 
                     students.length === 0 ? "No students available" :
                     "Select Student"}
                  </option>
                  {students.map((reg) => {
                    const student = reg.student_id || reg;
                    return (
                      <option key={student._id || reg._id} value={student._id || reg._id}>
                        {student.name || reg.name || "Unknown"} ({student.email || reg.email || "No email"})
                      </option>
                    );
                  })}
                </select>
                {issueFormData.event_id && students.length === 0 && !loadingStudents && (
                  <p className="text-xs text-amber-500 mt-1.5">No students found for this event</p>
                )}
                {issueFormData.event_id && students.length > 0 && (
                  <p className="text-xs text-green-500 mt-1.5">{students.length} student(s) available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Certificate Type</label>
                <select
                  name="certificate_type"
                  value={issueFormData.certificate_type}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                >
                  <option value="Participation">Participation</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Excellence">Excellence</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={actioningId === "issue"}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  {actioningId === "issue" ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Issue Certificate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueModal(false);
                    setStudents([]);
                    setIssueFormData({
                      student_id: "",
                      event_id: "",
                      certificate_type: "Participation"
                    });
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT CERTIFICATE MODAL ─── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => {
            setShowEditModal(false);
            setStudents([]);
            setIssueFormData({
              student_id: "",
              event_id: "",
              certificate_type: "Participation"
            });
            setSelectedCertificate(null);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit size={22} style={{ color: COLORS.purple }} />
                Edit Certificate
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setStudents([]);
                  setIssueFormData({
                    student_id: "",
                    event_id: "",
                    certificate_type: "Participation"
                  });
                  setSelectedCertificate(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-110"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event *</label>
                <select
                  name="event_id"
                  value={issueFormData.event_id}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  required
                >
                  <option value="">Select Event</option>
                  {events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title} ({formatDate(event.start_date)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student *</label>
                <select
                  name="student_id"
                  value={issueFormData.student_id}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                  required
                  disabled={loadingStudents || !issueFormData.event_id}
                >
                  <option value="">
                    {loadingStudents ? "Loading students..." : 
                     !issueFormData.event_id ? "Select an event first" : 
                     students.length === 0 ? "No students available" :
                     "Select Student"}
                  </option>
                  {students.map((reg) => {
                    const student = reg.student_id || reg;
                    return (
                      <option key={student._id || reg._id} value={student._id || reg._id}>
                        {student.name || reg.name || "Unknown"} ({student.email || reg.email || "No email"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Certificate Type</label>
                <select
                  name="certificate_type"
                  value={issueFormData.certificate_type}
                  onChange={handleIssueChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8b4fa2] focus:ring-2 focus:ring-[#8b4fa2]/20 transition-all duration-300"
                >
                  <option value="Participation">Participation</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Excellence">Excellence</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={actioningId === "edit"}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #8b4fa2, #6d3483)" }}
                >
                  {actioningId === "edit" ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Update Certificate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setStudents([]);
                    setIssueFormData({
                      student_id: "",
                      event_id: "",
                      certificate_type: "Participation"
                    });
                    setSelectedCertificate(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4 shadow-lg shadow-red-200">
                <Trash2 size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Certificate?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                This will permanently delete this certificate. This action cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={14} />
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCertificate(showDeleteConfirm)}
                disabled={actioningId === showDeleteConfirm}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              >
                {actioningId === showDeleteConfirm ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
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
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ManageCertificates;
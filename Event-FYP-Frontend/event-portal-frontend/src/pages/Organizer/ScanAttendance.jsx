import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────
   RESULT CONFIG
───────────────────────────────────────── */
const RESULT_CONFIG = {
  success: {
    gradient: "linear-gradient(135deg,#4ECDC4,#2bb5ac)",
    iconBg: "#edfafa",
    iconColor: "#0d9488",
    icon: "task_alt",
    label: "Attendance Marked!",
  },
  warning: {
    gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    iconBg: "#fff8e6",
    iconColor: "#d97706",
    icon: "warning",
    label: "Already Marked",
  },
  error: {
    gradient: "linear-gradient(135deg,#FF6B6B,#dc2626)",
    iconBg: "#fff0f0",
    iconColor: "#ef4444",
    icon: "error",
    label: "Scan Failed",
  },
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const ScanAttendance = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const html5QrRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraError, setCameraError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  /* fetch organizer events */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/organizers/my-events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(res.data.events || []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
    };
  }, []);

  /* ── START SCANNER ── */
  const startScanner = async () => {
    if (!selectedEvent) {
      setCameraError("Please select an event first");
      setTimeout(() => setCameraError(""), 3000);
      return;
    }
    setCameraError("");
    setResult(null);

    try {
      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); await html5QrRef.current.clear(); } catch (_) {}
      }
      const html5Qr = new Html5Qrcode("qr-reader");
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1.0 },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          await handleScan(decodedText, html5Qr);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  };

  /* ── STOP SCANNER ── */
  const stopScanner = async () => {
    if (html5QrRef.current && scanning) {
      try { await html5QrRef.current.stop(); await html5QrRef.current.clear(); } catch (_) {}
    }
    setScanning(false);
    isProcessingRef.current = false;
  };

  /* ── HANDLE SCAN ── */
  const handleScan = async (qrData, html5Qr) => {
    isProcessingRef.current = true;
    try { await html5Qr.stop(); await html5Qr.clear(); } catch (_) {}
    setScanning(false);
    setLoading(true);

    try {
      const response = await axios.put(
        `${API_URL}/api/registrations/attendance/qr`,
        { qrData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { registration, message } = response.data;
      
      let studentName = "Unknown Student";
      let studentEmail = "";
      let eventTitle = "Unknown Event";
      let eventDate = "";
      let eventVenue = "";
      let registrationId = "";
      
      if (registration) {
        registrationId = registration._id;
        if (registration.student_id) {
          studentName = registration.student_id.name || "Unknown Student";
          studentEmail = registration.student_id.email || "";
        }
        if (registration.event_id) {
          eventTitle = registration.event_id.title || "Unknown Event";
          eventDate = registration.event_id.start_date 
            ? new Date(registration.event_id.start_date).toLocaleDateString() 
            : "";
          eventVenue = registration.event_id.venue || "";
        }
      }

      const successResult = {
        type: "success", 
        message: message || "Attendance marked successfully!",
        studentName, 
        studentEmail, 
        eventTitle, 
        eventDate, 
        eventVenue,
        registrationId,
        timestamp: new Date().toLocaleTimeString(), 
        date: new Date().toLocaleDateString(),
      };
      
      setResult(successResult);
      setScanHistory((prev) => [
        { 
          id: Date.now(), 
          studentName, 
          studentEmail, 
          eventTitle,
          time: new Date().toLocaleTimeString(), 
          type: "success" 
        },
        ...prev.slice(0, 19),
      ]);
      
    } catch (err) {
      console.error("API Error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMsg = err.response?.data?.message || "Failed to mark attendance.";
      const isAlready = errorMsg.toLowerCase().includes("already");
      
      let studentName = null;
      let studentEmail = null;
      let eventTitle = null;
      let eventDate = null;
      let eventVenue = null;
      
      if (err.response?.data?.registration) {
        const reg = err.response.data.registration;
        if (reg.student_id) {
          studentName = reg.student_id.name || "Student";
          studentEmail = reg.student_id.email || "";
        }
        if (reg.event_id) {
          eventTitle = reg.event_id.title || "Event";
          eventDate = reg.event_id.start_date 
            ? new Date(reg.event_id.start_date).toLocaleDateString() 
            : "";
          eventVenue = reg.event_id.venue || "";
        }
      }
      
      if (!studentName && err.response?.data?.data?.registration) {
        const reg = err.response.data.data.registration;
        if (reg.student_id) {
          studentName = reg.student_id.name || "Student";
          studentEmail = reg.student_id.email || "";
        }
        if (reg.event_id) {
          eventTitle = reg.event_id.title || "Event";
        }
      }
      
      const errorResult = { 
        type: isAlready ? "warning" : "error", 
        message: errorMsg,
        studentName: studentName,
        studentEmail: studentEmail,
        eventTitle: eventTitle,
        eventDate: eventDate,
        eventVenue: eventVenue,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
      };
      
      setResult(errorResult);
      setScanHistory((prev) => [
        { 
          id: Date.now(), 
          type: isAlready ? "warning" : "error", 
          message: errorMsg,
          studentName: studentName,
          eventTitle: eventTitle,
          time: new Date().toLocaleTimeString() 
        },
        ...prev.slice(0, 19),
      ]);
      
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    setCameraError("");
    setTimeout(startScanner, 400);
  };

  const cfg = result ? RESULT_CONFIG[result.type] : null;

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <OrganizerSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-8">

        {/* ── HEADER BANNER (Updated like Feedback page) ── */}
        <div
         className="relative overflow-hidden px-8 pt-10 pb-8"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
        
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="inline-block px-4 py-1 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                Organizer Portal
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                QR Attendance Scanner
              </h1>
              <p className="text-purple-100 text-sm mt-1">Scan student QR codes to mark attendance instantly</p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {[
                { icon: "qr_code_scanner", label: "Scanner", value: scanning ? "Active" : "Standby" },
                { icon: "event", label: "Selected Event", value: events.find(e => e._id === selectedEvent)?.title?.slice(0, 20) || "None" },
              ].map((s) => (
                <div key={s.label} className="group flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105 bg-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-sm group-hover:animate-pulse">
                    {s.icon}
                  </span>
                  <span className="text-lg font-black text-white">{s.value === "Active" ? "🔴" : s.value === "Standby" ? "⏹️" : s.value}</span>
                  <span className="text-purple-200 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pt-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ══════════════════════════════
                LEFT — SCANNER CARD
            ══════════════════════════════ */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">

                {/* Card Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4]">
                      <span className="material-symbols-outlined text-[20px] text-white">qr_code_scanner</span>
                    </div>
                    <div>
                      <h2 className="font-black text-gray-800 text-sm">Scanner</h2>
                      <p className="text-xs text-gray-400">Point camera at student's QR code</p>
                    </div>
                    {scanning && (
                      <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-wide">Live</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Event Selector */}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                      Select Event
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#8b4fa2]">
                        event
                      </span>
                      <select
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        disabled={scanning}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold text-gray-700 bg-white appearance-none focus:outline-none transition"
                        style={{ borderColor: selectedEvent ? "#8b4fa2" : "#e5e7eb",
                          boxShadow: selectedEvent ? "0 0 0 3px rgba(139,79,162,0.1)" : "none" }}
                      >
                        <option value="">
                          {loadingEvents ? "Loading events..." : "-- Choose an event --"}
                        </option>
                        {events.map((e) => (
                          <option key={e._id} value={e._id}>{e.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Camera Error */}
                  {cameraError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                      <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                      <p className="text-xs font-semibold text-red-600">{cameraError}</p>
                    </div>
                  )}

                  {/* QR Viewfinder */}
                  <div className="relative rounded-xl overflow-hidden bg-gray-900"
                    style={{ aspectRatio: "1", border: "2px solid rgba(139,79,162,0.2)" }}>
                    <div id="qr-reader" className="w-full h-full" />

                    {/* Overlay when not scanning */}
                    {!scanning && !loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: "linear-gradient(135deg,rgba(26,26,26,0.95),rgba(45,27,61,0.95))" }}>
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                          style={{ background: "rgba(139,79,162,0.2)", border: "1px solid rgba(139,79,162,0.3)" }}>
                          <span className="material-symbols-outlined text-[40px]" style={{ color: "#8b4fa2", fontVariationSettings: "'FILL' 1" }}>
                            qr_code_2
                          </span>
                        </div>
                        <p className="text-white font-black text-sm">Camera Inactive</p>
                        <p className="text-gray-400 text-xs mt-1">Select event and press Start</p>

                        {/* Corner decorations */}
                        {[["top-4 left-4","border-t-2 border-l-2"],["top-4 right-4","border-t-2 border-r-2"],
                          ["bottom-4 left-4","border-b-2 border-l-2"],["bottom-4 right-4","border-b-2 border-r-2"]
                        ].map(([pos, border], i) => (
                          <div key={i} className={`absolute ${pos} w-8 h-8 ${border} rounded-sm`}
                            style={{ borderColor: "#8b4fa2" }} />
                        ))}
                      </div>
                    )}

                    {/* Loading overlay */}
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: "rgba(26,26,26,0.92)" }}>
                        <div className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin mb-3"
                          style={{ borderColor: "#8b4fa2", borderTopColor: "transparent" }} />
                        <p className="text-white text-xs font-bold">Verifying...</p>
                      </div>
                    )}

                    {/* Scanning animation overlay */}
                    {scanning && (
                      <div className="absolute inset-0 pointer-events-none">
                        {[["top-4 left-4","border-t-2 border-l-2"],["top-4 right-4","border-t-2 border-r-2"],
                          ["bottom-4 left-4","border-b-2 border-l-2"],["bottom-4 right-4","border-b-2 border-r-2"]
                        ].map(([pos, border], i) => (
                          <div key={i} className={`absolute ${pos} w-8 h-8 ${border} rounded-sm`}
                            style={{ borderColor: "#4ECDC4" }} />
                        ))}
                        <div className="absolute left-4 right-4 h-0.5 animate-bounce"
                          style={{ background: "linear-gradient(90deg,transparent,#4ECDC4,transparent)", top: "50%" }} />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!scanning ? (
                      <button onClick={startScanner} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black transition-all disabled:opacity-50 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] shadow-md hover:shadow-lg">
                        <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                        Start Scanning
                      </button>
                    ) : (
                      <button onClick={stopScanner}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black transition-all bg-linear-to-r from-red-500 to-red-600 shadow-md hover:shadow-lg">
                        <span className="material-symbols-outlined text-[18px]">stop_circle</span>
                        Stop Scanner
                      </button>
                    )}

                    {selectedEvent && (
                      <button onClick={() => navigate(`/organizer/attendance/${selectedEvent}`)}
                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                        style={{ borderColor: "#8b4fa2", color: "#8b4fa2" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#8b4fa2"; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b4fa2"; }}>
                        <span className="material-symbols-outlined text-[16px]">list_alt</span>
                        View List
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">How It Works</p>
                <div className="space-y-3">
                  {[
                    { icon: "event", color: "#8b4fa2", text: "Select the event you're managing" },
                    { icon: "qr_code_scanner", color: "#4ECDC4", text: "Start scanner and allow camera access" },
                    { icon: "person", color: "#FF6B6B", text: "Student opens QR from MyRegistrations" },
                    { icon: "task_alt", color: "#d97706", text: "Point camera at QR — attendance auto-marks" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${step.color}18` }}>
                        <span className="material-symbols-outlined text-[15px]" style={{ color: step.color, fontVariationSettings: "'FILL' 1" }}>
                          {step.icon}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════
                RIGHT — RESULT + HISTORY
            ══════════════════════════════ */}
            <div className="space-y-5">

              {/* Result Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100" style={{ minHeight: "300px" }}>

                {!result ? (
                  <div className="h-full flex flex-col items-center justify-center p-10 text-center" style={{ minHeight: "300px" }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-linear-to-br from-purple-50 to-teal-50">
                      <span className="material-symbols-outlined text-[40px] text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        pending
                      </span>
                    </div>
                    <p className="font-black text-gray-700 text-base">Awaiting Scan</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Scan result will appear here after a student's QR code is detected
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Result top bar */}
                    <div className="h-1.5 w-full" style={{ background: cfg.gradient }} />
                    <div className="p-6">
                      {/* Status header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: cfg.iconBg }}>
                          <span className="material-symbols-outlined text-[24px]"
                            style={{ color: cfg.iconColor, fontVariationSettings: "'FILL' 1" }}>
                            {cfg.icon}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-gray-800">{cfg.label}</p>
                          <p className="text-xs text-gray-400">{result.timestamp}</p>
                        </div>
                        <div className="ml-auto px-3 py-1 rounded-full text-[10px] font-black"
                          style={{ background: cfg.iconBg, color: cfg.iconColor }}>
                          {result.type.toUpperCase()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 font-semibold mb-5 px-4 py-3 rounded-xl bg-gray-50">
                        {result.message}
                      </p>

                      {/* Student Info */}
                      {(result.studentName && result.studentName !== "Unknown Student") ? (
                        <div className="space-y-3 mb-5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Info</p>
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f4fb]">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4]">
                              <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                                person
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-800">{result.studentName}</p>
                              {result.studentEmail && <p className="text-xs text-gray-400">{result.studentEmail}</p>}
                            </div>
                          </div>

                          {(result.eventTitle && result.eventTitle !== "Unknown Event") && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#edfafa]">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-r from-[#4ECDC4] to-teal-500">
                                <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  event
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-800">{result.eventTitle}</p>
                                {result.eventDate && <p className="text-xs text-gray-400">{result.eventDate} {result.eventVenue && `• ${result.eventVenue}`}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-5 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                          <p className="text-xs text-yellow-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Student details not found in response. Please check backend population.
                          </p>
                        </div>
                      )}

                      {/* Scan Again Button */}
                      <button onClick={handleScanAgain}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black transition-all bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] shadow-md hover:shadow-lg">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Scan Next Student
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Scan History */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#8b4fa2]">history</span>
                    <p className="font-black text-gray-800 text-sm">Scan History</p>
                    {scanHistory.length > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-[#8b4fa2]">
                        {scanHistory.length}
                      </span>
                    )}
                  </div>
                  {scanHistory.length > 0 && (
                    <button onClick={() => setScanHistory([])}
                      className="text-xs font-bold text-gray-400 hover:text-red-400 transition flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Clear
                    </button>
                  )}
                </div>

                {scanHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <span className="material-symbols-outlined text-[36px] mb-2 text-purple-300">history</span>
                    <p className="text-xs font-semibold">No scans yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {scanHistory.map((entry) => {
                      const c = RESULT_CONFIG[entry.type];
                      return (
                        <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: c.iconBg }}>
                            <span className="material-symbols-outlined text-[15px]"
                              style={{ color: c.iconColor, fontVariationSettings: "'FILL' 1" }}>
                              {c.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700 truncate">
                              {entry.studentName || entry.message || "Scan"}
                            </p>
                            {entry.eventTitle && entry.eventTitle !== "Unknown Event" && (
                              <p className="text-[10px] text-gray-400 truncate">{entry.eventTitle}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">{entry.time}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScanAttendance;
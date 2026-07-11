import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ManageStudents = () => {
  const { token } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setError("");
      const res = await axios.get(`${API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.students || [];
      setStudents(list);
    } catch (err) {
      console.error(err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents((prev) => prev.filter((s) => s._id !== id));
      setConfirmDelete(null);
      if (selectedStudent?._id === id) setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique grades for filter
  const grades = ["all", ...new Set(students.map((s) => s.grade).filter(Boolean))];

  const filtered = students.filter((s) => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.grade?.toLowerCase().includes(search.toLowerCase()) ||
      s.semester?.toString().includes(search);
    
    const matchesFilter = activeFilter === "all" || s.grade === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const totalStudents = students.length;
  const csStudents = students.filter((s) => s.grade === "cs" || s.grade === "Computer Science").length;
  const mathStudents = students.filter((s) => s.grade === "math" || s.grade === "Mathematics").length;
  const otherStudents = totalStudents - csStudents - mathStudents;

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const avatarColors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6"];
  const getColor = (name) => {
    if (!name) return avatarColors[0];
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
  };

  const getGradeLabel = (grade) => {
    const labels = {
      cs: "Computer Science",
      math: "Mathematics",
      hssc1: "HSSC I",
      hssc2: "HSSC II",
      "10": "Grade 10",
      "9": "Grade 9",
      "8": "Grade 8",
      "7": "Grade 7",
      "6": "Grade 6",
      "5": "Grade 5",
    };
    return labels[grade] || grade || "N/A";
  };

  const getGradeColor = (grade) => {
    const colors = {
      cs: "bg-purple-100 text-purple-700",
      math: "bg-blue-100 text-blue-700",
      hssc1: "bg-green-100 text-green-700",
      hssc2: "bg-teal-100 text-teal-700",
      "10": "bg-yellow-100 text-yellow-700",
      "9": "bg-orange-100 text-orange-700",
      "8": "bg-red-100 text-red-700",
      "7": "bg-pink-100 text-pink-700",
      "6": "bg-indigo-100 text-indigo-700",
      "5": "bg-gray-100 text-gray-700",
    };
    return colors[grade] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-5 pt-5 pb-8"
          style={{
            background: "linear-gradient(135deg, #9B59B6 0%, #6d3483 100%, #4ECDC4 100%)",
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-block px-5 py-1 mb-8 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
                Admin Portal
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">Manage Students</h1>
              <p className="text-purple-200 text-sm mt-1">
                View, manage, and oversee all registered students
              </p>
            </div>

            {/* Stats Pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Total", value: totalStudents, color: "#FFE66D" },
                { label: "CS", value: csStudents, color: "#4ECDC4" },
                { label: "Math", value: mathStudents, color: "#FF6B6B" },
                { label: "Other", value: otherStudents, color: "#FFB347" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                >
                  <span
                    className="text-xl font-black"
                    style={{ color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-white/80 text-xs font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {/* ── SEARCH & FILTER ── */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by name, email, grade or semester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm min-w-[140px]"
            >
              <option value="all">All Grades</option>
              {grades.filter(g => g !== "all").map((grade) => (
                <option key={grade} value={grade}>
                  {getGradeLabel(grade)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div
                className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin"
                style={{ borderColor: "#9B59B6", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-400 font-medium">Loading students...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: "#d8b4fe" }}>
                school
              </span>
              <p className="text-base font-bold text-gray-600">No students found</p>
              <p className="text-sm mt-1 text-gray-400">
                {search ? "Try adjusting your search filters" : "No students are registered yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-4">Student</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Grade</div>
                <div className="col-span-1">Sem</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {filtered.map((student) => (
                  <div
                    key={student._id}
                    className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 hover:bg-purple-50/30 transition-all duration-200 gap-2"
                  >
                    {/* Avatar + Name */}
                    <div
                      className="col-span-4 flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: getColor(student.name) }}
                      >
                        {getInitials(student.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#8b4fa2] transition">
                          {student.name}
                        </p>
                        {student.phone && (
                          <p className="text-xs text-gray-400">{student.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden md:block">
                      <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    </div>

                    {/* Grade */}
                    <div className="col-span-2 hidden md:block">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getGradeColor(student.grade)}`}>
                        {getGradeLabel(student.grade)}
                      </span>
                    </div>

                    {/* Semester */}
                    <div className="col-span-1 hidden md:block">
                      <span className="text-xs font-semibold text-gray-500">
                        {student.semester ? `Sem ${student.semester}` : "N/A"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#8b4fa2]">visibility</span>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(student)}
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px] text-red-400">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer with count */}
              <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-400">
                Showing {filtered.length} of {students.length} students
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== STUDENT DETAIL MODAL ===== */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Student Details
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 transition">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3"
                style={{ backgroundColor: getColor(selectedStudent.name) }}
              >
                {getInitials(selectedStudent.name)}
              </div>
              <h4 className="text-lg font-bold text-gray-800">{selectedStudent.name}</h4>
              <p className="text-sm text-gray-400">{selectedStudent.email}</p>
              <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${getGradeColor(selectedStudent.grade)}`}>
                {getGradeLabel(selectedStudent.grade)}
              </span>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {[
                { icon: "phone", label: "Phone", value: selectedStudent.phone || "N/A" },
                { icon: "school", label: "Semester", value: selectedStudent.semester ? `Semester ${selectedStudent.semester}` : "N/A" },
                { icon: "calendar_month", label: "Joined", value: selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : "N/A" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-gray-700 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => { setSelectedStudent(null); setConfirmDelete(selectedStudent); }}
              className="w-full mt-5 py-3 rounded-xl text-sm font-black transition flex items-center justify-center gap-2"
              style={{ background: "#fee2e2", color: "#dc2626" }}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Remove Student
            </button>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DELETE MODAL ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span
                className="material-symbols-outlined text-[36px] text-red-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                delete_forever
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Remove Student?
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              Are you sure you want to remove
            </p>
            <p className="text-sm font-bold text-[#8b4fa2] mb-6">"{confirmDelete.name}"</p>

            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">warning</span>
              <p className="text-xs text-red-700 font-medium">
                This will permanently delete all data associated with this student.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}
              >
                {deletingId === confirmDelete._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Yes, Remove
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

export default ManageStudents;
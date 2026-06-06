import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ManageStudents = () => {
const { token } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setError("");
      const res = await axios.get("http://localhost:5000/api/students", {
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
      await axios.delete(`http://localhost:5000/api/students/${id}`, {
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

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.grade?.toLowerCase().includes(search.toLowerCase()) ||
    s.semester?.toString().includes(search)
  );

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const avatarColors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#f59e0b", "#6366f1", "#10b981"];
  const getColor = (name) => {
    if (!name) return avatarColors[0];
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
            <p className="text-sm text-gray-400 mt-1">
              {students.length} registered student{students.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search by name, email, grade or semester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm"
          />
        </div>

        {error && <p className="text-red-500 font-semibold mb-4">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-3">school</span>
            <p className="text-sm font-semibold">No students found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
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
                  className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 hover:bg-gray-50 transition-all gap-2"
                >
                  {/* Avatar + Name */}
                  <div
                    className="col-span-4 flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: getColor(student.name) }}
                    >
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{student.name}</p>
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
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f5eefa] text-[#8b4fa2]">
                      {student.grade || "N/A"}
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
                      className="w-8 h-8 rounded-lg bg-[#f5eefa] flex items-center justify-center hover:bg-purple-100 transition"
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
          </div>
        )}
      </main>

      {/* ===== STUDENT DETAIL MODAL ===== */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Student Details</h3>
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
            </div>

            {/* Info */}
            <div className="space-y-3">
              {[
                { icon: "phone", label: "Phone", value: selectedStudent.phone || "N/A" },
                { icon: "grade", label: "Grade", value: selectedStudent.grade || "N/A" },
                { icon: "school", label: "Semester", value: selectedStudent.semester ? `Semester ${selectedStudent.semester}` : "N/A" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="material-symbols-outlined text-[18px] text-[#8b4fa2]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-gray-700 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => { setSelectedStudent(null); setConfirmDelete(selectedStudent); }}
              className="w-full mt-5 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-500 hover:bg-red-100 transition flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  delete_forever
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Remove Student?</h3>
              <p className="text-sm text-gray-400">
                Are you sure you want to remove <span className="font-semibold text-gray-700">{confirmDelete.name}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
              >
                {deletingId === confirmDelete._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Removing...
                  </span>
                ) : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
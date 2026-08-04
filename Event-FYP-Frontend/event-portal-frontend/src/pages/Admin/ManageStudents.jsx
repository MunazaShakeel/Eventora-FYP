import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import DownloadCSVAdvanced from "../../components/DownloadCSVAdvanced";
import { 
  Filter, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  Trash2,
  Eye,
  Phone,
  Calendar,
  BookOpen,
  Award,
  X,
  Search,
  RefreshCw,
  Users,
  GraduationCap,
  Mail,
  User,
  Sparkles,
  BarChart3,
  Edit,
  Save,
  UserPlus
} from "lucide-react";

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
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    semester: "",
    department: "",
    registeredAfter: "",
    registeredBefore: ""
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // ── Edit Student State ──
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    semester: "",
    department: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  // ── Add Student State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    semester: "",
    department: "",
    password: ""
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!token) return;
    fetchStudents();
  }, [token]);

  const fetchStudents = async () => {
    try {
      setError("");
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.students || [];
      setStudents(list);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load students.");
      showToast("Failed to load students", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ── Filter Handler for Stats ──
  const handleStatCardClick = (filterType) => {
    setActiveFilter(filterType);
    setShowFilters(true);
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
      showToast("Student removed successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeletingId("bulk");
      await Promise.all(
        selectedStudents.map(id => 
          axios.delete(`${API_URL}/api/students/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setStudents((prev) => prev.filter((s) => !selectedStudents.includes(s._id)));
      setSelectedStudents([]);
      setSelectAll(false);
      setShowBulkDelete(false);
      showToast(`${selectedStudents.length} students removed successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete selected students", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Add Student Functions ──
  const handleAddStudentChange = (e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (newStudent.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (newStudent.grade === "other" && !newStudent.department) {
      showToast("Please specify department", "error");
      return;
    }

    try {
      setAddingStudent(true);

      let finalDepartment = newStudent.grade;
      if (newStudent.grade === "other") {
        finalDepartment = newStudent.department;
      }

      const payload = {
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
        grade: newStudent.grade,
        department: finalDepartment,
        semester: newStudent.semester ? Number(newStudent.semester) : null,
        phone: newStudent.phone || ""
      };

      await axios.post(`${API_URL}/api/students/register`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchStudents();
      setShowAddModal(false);
      setNewStudent({
        name: "",
        email: "",
        phone: "",
        grade: "",
        semester: "",
        department: "",
        password: ""
      });
      showToast("Student added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to add student.", "error");
    } finally {
      setAddingStudent(false);
    }
  };

  // ── Edit Student Functions ──
  const startEditing = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      grade: student.grade || "",
      semester: student.semester || "",
      department: student.department || ""
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingStudent(null);
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      grade: "",
      semester: "",
      department: ""
    });
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    
    try {
      const payload = {
        name: editFormData.name,
        grade: editFormData.grade,
        semester: editFormData.semester ? Number(editFormData.semester) : null,
        department: editFormData.department
      };

      await axios.put(`${API_URL}/api/students/${editingStudent._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudents(prev => prev.map(s => 
        s._id === editingStudent._id ? { ...s, ...payload } : s
      ));

      if (selectedStudent?._id === editingStudent._id) {
        setSelectedStudent(prev => ({ ...prev, ...payload }));
      }

      showToast("Student updated successfully!", "success");
      cancelEditing();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to update student.", "error");
    }
  };

  // ── AI Grade Detection ──
  const detectGrade = (student) => {
    const grade = student.grade || "";
    const department = student.department || "";

    const knownGrades = ["cs", "math", "hssc1", "hssc2", "10", "9", "8", "7", "6", "5"];
    
    if (department && !knownGrades.includes(department) && department !== "") {
      return {
        label: department,
        color: "bg-purple-100 text-purple-700",
        icon: "🏛️"
      };
    }

    if (knownGrades.includes(grade)) {
      return {
        label: getGradeLabel(grade),
        color: getGradeColor(grade),
        icon: getGradeIcon(grade)
      };
    }

    const keywords = {
      "computer": { label: "Computer Science", color: "bg-purple-100 text-purple-700", icon: "💻" },
      "science": { label: "Computer Science", color: "bg-purple-100 text-purple-700", icon: "💻" },
      "math": { label: "Mathematics", color: "bg-blue-100 text-blue-700", icon: "📐" },
      "engineering": { label: "Engineering", color: "bg-red-100 text-red-700", icon: "⚙️" },
      "business": { label: "Business Administration", color: "bg-green-100 text-green-700", icon: "📊" },
      "economics": { label: "Economics", color: "bg-yellow-100 text-yellow-700", icon: "📈" },
      "english": { label: "English", color: "bg-pink-100 text-pink-700", icon: "📚" },
      "biology": { label: "Biology", color: "bg-green-100 text-green-700", icon: "🧬" },
      "physics": { label: "Physics", color: "bg-indigo-100 text-indigo-700", icon: "⚛️" },
      "chemistry": { label: "Chemistry", color: "bg-orange-100 text-orange-700", icon: "🧪" },
    };

    const searchText = (grade + " " + department).toLowerCase();
    for (const [key, value] of Object.entries(keywords)) {
      if (searchText.includes(key)) {
        return value;
      }
    }

    return {
      label: grade || "Other",
      color: "bg-gray-100 text-gray-600",
      icon: "📁"
    };
  };

  const grades = ["all", ...new Set(students.map((s) => s.grade).filter(Boolean))];

  const filtered = students.filter((s) => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.grade?.toLowerCase().includes(search.toLowerCase()) ||
      s.semester?.toString().includes(search) ||
      s.department?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = activeFilter === "all" || s.grade === activeFilter;
    
    const matchesSemester = !advancedFilters.semester || s.semester?.toString() === advancedFilters.semester;
    const matchesDepartment = !advancedFilters.department || 
      s.department?.toLowerCase().includes(advancedFilters.department.toLowerCase()) ||
      s.grade?.toLowerCase().includes(advancedFilters.department.toLowerCase());
    
    const registeredDate = new Date(s.createdAt);
    const afterDate = advancedFilters.registeredAfter ? new Date(advancedFilters.registeredAfter) : null;
    const beforeDate = advancedFilters.registeredBefore ? new Date(advancedFilters.registeredBefore) : null;
    
    const matchesAfter = !afterDate || registeredDate >= afterDate;
    const matchesBefore = !beforeDate || registeredDate <= beforeDate;
    
    return matchesSearch && matchesFilter && matchesSemester && matchesDepartment && matchesAfter && matchesBefore;
  });

  const totalStudents = students.length;
  const csStudents = students.filter((s) => s.grade === "cs" || s.grade === "Computer Science").length;
  const mathStudents = students.filter((s) => s.grade === "math" || s.grade === "Mathematics").length;
  const hsscStudents = students.filter((s) => s.grade === "hssc1" || s.grade === "hssc2").length;
  const otherStudents = totalStudents - csStudents - mathStudents - hsscStudents;

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

  const getGradeIcon = (grade) => {
    const icons = {
      cs: "💻",
      math: "📐",
      hssc1: "📚",
      hssc2: "📚",
      "10": "🎯",
      "9": "🎯",
      "8": "🎯",
      "7": "🎯",
      "6": "🎯",
      "5": "🎯",
    };
    return icons[grade] || "📁";
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map(s => s._id));
    }
    setSelectAll(!selectAll);
  };

  const csvHeaders = ["Name", "Email", "Phone", "Grade", "Semester", "Department", "Registered Date"];
  const csvMapData = (student) => [
    student.name || "",
    student.email || "",
    student.phone || "N/A",
    getGradeLabel(student.grade),
    student.semester ? `Semester ${student.semester}` : "N/A",
    student.department || "N/A",
    student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A"
  ];

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast("Students exported successfully!", "success");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f7f4fb" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        {/* ── HEADER BANNER ── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-10"
          style={{ background: "linear-gradient(135deg,#9B59B6 0%,#6d3483 100%)" }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#FFE66D] text-[#1A1A1A] text-xs font-black tracking-widest uppercase">
              
                Admin Portal
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Manage Students
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                View, manage, and oversee all registered students
              </p>
            </div>

            {/* Clickable Stats Pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "Total", value: totalStudents, color: "#FFE66D", icon: <Users size={14} /> },
                { key: "cs", label: "CS", value: csStudents, color: "#4ECDC4", icon: <GraduationCap size={14} /> },
                { key: "math", label: "Math", value: mathStudents, color: "#FF6B6B", icon: <BarChart3 size={14} /> },
                { key: "hssc1", label: "HSSC", value: hsscStudents, color: "#FFB347", icon: <BookOpen size={14} /> },
                { key: "other", label: "Other", value: otherStudents, color: "#a78bfa", icon: <Award size={14} /> },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setActiveFilter(s.key);
                    setShowFilters(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-105 duration-200 ${
                    activeFilter === s.key ? "ring-2 ring-white/50" : ""
                  }`}
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <span className="text-white/70">{s.icon}</span>
                  <span className="text-xl font-black" style={{ color: s.color }}>
                    {s.value}
                  </span>
                  <span className="text-white/70 text-xs font-semibold">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-6">
          {/* ── TOAST ── */}
          {toast && (
            <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all animate-fadeIn ${
              toast.type === "success" 
                ? "bg-linear-to-r from-green-500 to-emerald-500" 
                : "bg-linear-to-r from-red-500 to-rose-500"
            }`}>
              {toast.msg}
            </div>
          )}

          {/* ── ACTION BAR ── */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, grade, department or semester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-white/80 backdrop-blur-sm text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm transition-all"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* ✅ Add Student Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white font-bold hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <UserPlus size={20} />
                <span>Add Student</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl transition-all shadow-sm ${
                  showFilters 
                    ? "bg-[#8b4fa2] text-white shadow-[0_4px_15px_rgba(139,79,162,0.35)]" 
                    : "bg-white/80 backdrop-blur-sm border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2]"
                }`}
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <DownloadCSVAdvanced
                data={filtered}
                filename="students"
                buttonText="Export CSV"
                buttonIcon="spreadsheet"
                customHeaders={csvHeaders}
                mapData={csvMapData}
                onCustomDownload={handleExportCSV}
                size="md"
                loading={isExporting}
                variant="primary"
                className="px-5 py-3.5"
              />

              <button
                onClick={fetchStudents}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>

              {selectedStudents.length > 0 && (
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
                >
                  <Trash2 size={18} />
                  <span className="font-medium">Delete ({selectedStudents.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* ── ADVANCED FILTERS ── */}
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen size={14} /> Semester
                  </label>
                  <select
                    value={advancedFilters.semester}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, semester: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent"
                  >
                    <option value="">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap size={14} /> Department
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by department..."
                    value={advancedFilters.department}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, department: e.target.value })}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Filter size={14} /> Grade
                  </label>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent"
                  >
                    <option value="all">All Grades</option>
                    {grades.filter(g => g !== "all").map((grade) => (
                      <option key={grade} value={grade}>
                        {getGradeLabel(grade)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  setAdvancedFilters({ semester: "", department: "", registeredAfter: "", registeredBefore: "" });
                  setActiveFilter("all");
                }}
                className="mt-4 text-sm text-[#8b4fa2] font-semibold hover:underline transition"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
              <span className="text-[18px]">❌</span>
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
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200">
              <Users className="text-[56px] mb-3" style={{ color: "#d8b4fe" }} />
              <p className="text-base font-bold text-gray-600">No students found</p>
              <p className="text-sm mt-1 text-gray-400">
                {search ? "Try adjusting your search filters" : "No students are registered yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-gray-100 text-xs font-black text-gray-500 uppercase tracking-widest">
                <div className="col-span-1 flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll} 
                    className="hover:text-[#8b4fa2] transition-colors"
                  >
                    {selectAll ? <CheckSquare size={16} className="text-[#8b4fa2]" /> : <Square size={16} />}
                  </button>
                </div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <User size={14} /> Student
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Mail size={14} /> Email
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <GraduationCap size={14} /> Department
                </div>
                <div className="col-span-1 flex items-center gap-1.5">
                  <BookOpen size={14} /> Sem
                </div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {filtered.map((student) => {
                  const detected = detectGrade(student);

                  return (
                    <div
                      key={student._id}
                      className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 hover:bg-purple-50/40 transition-all duration-200 gap-2 group"
                    >
                      {/* Select */}
                      <div className="col-span-1 flex items-center gap-2">
                        <button 
                          onClick={() => toggleSelectStudent(student._id)}
                          className="hover:scale-110 transition-transform"
                        >
                          {selectedStudents.includes(student._id) ? 
                            <CheckSquare size={18} className="text-[#8b4fa2]" /> : 
                            <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
                          }
                        </button>
                      </div>

                      {/* Avatar + Name */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md"
                          style={{ backgroundColor: getColor(student.name) }}
                        >
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-[#8b4fa2] transition-colors">
                            {student.name}
                          </p>
                          {student.phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} /> {student.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-span-2 hidden md:block">
                        <p className="text-sm text-gray-500 truncate">{student.email}</p>
                      </div>

                      {/* Grade/Department */}
                      <div className="col-span-2 hidden md:block">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${detected.color}`}>
                          {detected.icon} {detected.label}
                        </span>
                      </div>

                      {/* Semester */}
                      <div className="col-span-1 hidden md:block">
                        <span className="text-xs font-semibold text-gray-500">
                          {student.semester ? `Sem ${student.semester}` : "—"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-colors group-hover:shadow-sm"
                          title="View Details"
                        >
                          <Eye size={16} className="text-[#8b4fa2]" />
                        </button>
                        <button
                          onClick={() => startEditing(student)}
                          className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors group-hover:shadow-sm"
                          title="Edit Student"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(student)}
                          className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors group-hover:shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span className="font-medium">
                  Showing <span className="text-gray-600 font-bold">{filtered.length}</span> of <span className="text-gray-600 font-bold">{students.length}</span> students
                </span>
                <span className="font-medium">
                  {selectedStudents.length} selected
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== ADD STUDENT MODAL ===== */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <UserPlus size={22} className="text-[#8b4fa2]" />
                Add Student
              </h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newStudent.name}
                    onChange={handleAddStudentChange}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newStudent.email}
                    onChange={handleAddStudentChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={newStudent.password}
                    onChange={handleAddStudentChange}
                    placeholder="Enter password (min 6 characters)"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newStudent.phone}
                    onChange={handleAddStudentChange}
                    placeholder="03XXXXXXXXX"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Grade/Department */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Grade/Department</label>
                  <select
                    name="grade"
                    value={newStudent.grade}
                    onChange={handleAddStudentChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                  >
                    <option value="">Select Grade</option>
                    <option value="cs">Computer Science</option>
                    <option value="math">Mathematics</option>
                    <option value="hssc1">HSSC I</option>
                    <option value="hssc2">HSSC II</option>
                    <option value="10">10 Grade</option>
                    <option value="9">9 Grade</option>
                    <option value="8">8 Grade</option>
                    <option value="7">7 Grade</option>
                    <option value="6">6 Grade</option>
                    <option value="5">5 Grade</option>
                    <option value="other">Other Department</option>
                  </select>
                </div>

                {/* Custom Department - Only shows when "other" is selected */}
                {newStudent.grade === "other" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Custom Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={newStudent.department}
                      onChange={handleAddStudentChange}
                      placeholder="Enter your department name"
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                )}

                {/* Semester */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Semester</label>
                  <select
                    name="semester"
                    value={newStudent.semester}
                    onChange={handleAddStudentChange}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] hover:shadow-lg disabled:opacity-50"
                >
                  {addingStudent ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Add Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== STUDENT DETAIL MODAL ===== */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <User size={22} className="text-[#8b4fa2]" />
                Student Profile
              </h3>
              <button 
                onClick={() => setSelectedStudent(null)} 
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3 ring-4 ring-purple-100"
                style={{ backgroundColor: getColor(selectedStudent.name) }}
              >
                {getInitials(selectedStudent.name)}
              </div>
              <h4 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h4>
              <p className="text-sm text-gray-400">{selectedStudent.email}</p>
              <span className={`mt-2 text-xs font-bold px-3 py-1.5 rounded-full ${getGradeColor(selectedStudent.grade)}`}>
                {getGradeLabel(selectedStudent.grade)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Phone size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Phone</p>
                <p className="text-sm text-gray-700 font-medium">{selectedStudent.phone || "N/A"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <BookOpen size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Semester</p>
                <p className="text-sm text-gray-700 font-medium">
                  {selectedStudent.semester ? `Semester ${selectedStudent.semester}` : selectedStudent.grade || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Award size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Department</p>
                <p className="text-sm text-gray-700 font-medium">
                  {selectedStudent.department || selectedStudent.grade || "N/A"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Calendar size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Joined</p>
                <p className="text-sm text-gray-700 font-medium">
                  {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {/* AI Grade Detection */}
            <div className="p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{detectGrade(selectedStudent).icon}</span>
                <div>
                  <span className="font-semibold text-gray-700">{detectGrade(selectedStudent).label}</span>
                  <p className="text-xs text-gray-400">
                    {selectedStudent.department && !["cs", "math", "hssc1", "hssc2", "10", "9", "8", "7", "6", "5"].includes(selectedStudent.department) 
                      ? "Custom Department" 
                      : "Detected Grade"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setSelectedStudent(null); setConfirmDelete(selectedStudent); }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT STUDENT MODAL ===== */}
      {isEditing && editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => cancelEditing()}
        >
          <div
            className="bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <Edit size={22} className="text-blue-600" />
                Edit Student
              </h3>
              <button 
                onClick={() => cancelEditing()} 
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span>🔒</span> Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <span>🔒</span> Phone cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Grade/Department</label>
                <select
                  name="grade"
                  value={editFormData.grade}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                >
                  <option value="">Select Grade</option>
                  <option value="cs">Computer Science</option>
                  <option value="math">Mathematics</option>
                  <option value="hssc1">HSSC I</option>
                  <option value="hssc2">HSSC II</option>
                  <option value="10">10 Grade</option>
                  <option value="9">9 Grade</option>
                  <option value="8">8 Grade</option>
                  <option value="7">7 Grade</option>
                  <option value="6">6 Grade</option>
                  <option value="5">5 Grade</option>
                  <option value="other">Other Department</option>
                </select>
              </div>

              {editFormData.grade === "other" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Custom Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditChange}
                    placeholder="Enter your department name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                    required={editFormData.grade === "other"}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This will appear as "Detected Grade" in the profile
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Semester</label>
                <select
                  name="semester"
                  value={editFormData.semester}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>Semester {num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => cancelEditing()}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-blue-500 to-blue-600 hover:shadow-lg"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DELETE MODAL ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={36} className="text-red-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Remove Student?</h3>
            <p className="text-sm text-gray-500 mb-1">Are you sure you want to remove</p>
            <p className="text-sm font-bold text-[#8b4fa2] mb-6">"{confirmDelete.name}"</p>

            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <span className="text-[18px] text-red-500 shrink-0">⚠️</span>
              <p className="text-xs text-red-700 font-medium">
                This will permanently delete all data associated with this student.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                disabled={deletingId === confirmDelete._id}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                {deletingId === confirmDelete._id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 size={16} />
                    Yes, Remove
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BULK DELETE MODAL ===== */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={36} className="text-red-400" />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">Bulk Delete?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Are you sure you want to remove
            </p>
            <p className="text-sm font-bold text-[#8b4fa2] mb-6">{selectedStudents.length} selected students?</p>

            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <span className="text-[18px] text-red-500 shrink-0">⚠️</span>
              <p className="text-xs text-red-700 font-medium">
                This action cannot be undone. All selected students will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deletingId === "bulk"}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-black transition-all disabled:opacity-60 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                {deletingId === "bulk" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 size={16} />
                    Delete All
                  </span>
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
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ManageStudents;
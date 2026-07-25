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
  EyeOff,
  Phone,
  Calendar,
  X,
  Search,
  RefreshCw,
  Users,
  Mail,
  User,
  Sparkles,
  Briefcase,
  Building,
  Clock,
  UserPlus,
  Award,
  AlertCircle,
  Edit,
  Save
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ManageOrganizers = () => {
  const { token } = useAuth();

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newOrganizer, setNewOrganizer] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    phone: ""
  });
  const [addingOrganizer, setAddingOrganizer] = useState(false);

  // ── Edit Organizer State ──
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setError("");
      setIsRefreshing(true);
      const res = await axios.get(`${API_URL}/api/organizers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.organizers || res.data?.data || [];
      setOrganizers(list);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load organizers.");
      showToast("Failed to load organizers", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/api/organizers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganizers((prev) => prev.filter((o) => o._id !== id));
      setConfirmDelete(null);
      if (selectedOrganizer?._id === id) setSelectedOrganizer(null);
      showToast("Organizer removed successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Add Organizer Functions ──
  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    
    if (!newOrganizer.name || !newOrganizer.email || !newOrganizer.password) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (newOrganizer.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    try {
      setAddingOrganizer(true);
      const payload = {
        name: newOrganizer.name,
        email: newOrganizer.email,
        password: newOrganizer.password,
        department: newOrganizer.department || "",
        phone: newOrganizer.phone || ""
      };

      await axios.post(`${API_URL}/api/organizers/register`, payload);
      await fetchOrganizers();
      
      setShowAddModal(false);
      setNewOrganizer({ name: "", email: "", password: "", department: "", phone: "" });
      showToast("Organizer added successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to add organizer", "error");
    } finally {
      setAddingOrganizer(false);
    }
  };

  // ── Edit Organizer Functions ──
  const startEditing = (organizer) => {
    setEditingOrganizer(organizer);
    setEditFormData({
      name: organizer.name || "",
      email: organizer.email || "",
      phone: organizer.phone || "",
      department: organizer.department || ""
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingOrganizer(null);
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      department: ""
    });
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingOrganizer) return;
    
    try {
      const payload = {
        name: editFormData.name,
        phone: editFormData.phone,
        department: editFormData.department
      };

      await axios.put(`${API_URL}/api/organizers/${editingOrganizer._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrganizers(prev => prev.map(o => 
        o._id === editingOrganizer._id ? { ...o, ...payload } : o
      ));

      if (selectedOrganizer?._id === editingOrganizer._id) {
        setSelectedOrganizer(prev => ({ ...prev, ...payload }));
      }

      showToast("Organizer updated successfully!", "success");
      cancelEditing();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to update organizer.", "error");
    }
  };

  const filtered = organizers.filter((o) => {
    const matchesSearch = 
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.department?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search);
    return matchesSearch;
  });

  const totalOrganizers = organizers.length;
  const withPhone = organizers.filter((o) => o.phone).length;

  const getInitials = (name) => {
    if (!name) return "O";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const avatarColors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6"];
  const getColor = (name) => {
    if (!name) return avatarColors[0];
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
  };

  const csvHeaders = ["Name", "Email", "Phone", "Department", "Joined Date"];
  const csvMapData = (organizer) => [
    organizer.name || "",
    organizer.email || "",
    organizer.phone || "N/A",
    organizer.department || "N/A",
    organizer.createdAt ? new Date(organizer.createdAt).toLocaleDateString() : "N/A"
  ];

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast("Organizers exported successfully!", "success");
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
                Manage Organizers
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                View, manage, and oversee all event organizers
              </p>
            </div>

            {/* Stats Pills - Removed Active */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Total", value: totalOrganizers, color: "#FFE66D", icon: <Users size={14} /> },
                { label: "With Phone", value: withPhone, color: "#FFB347", icon: <Phone size={14} /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-105 duration-200"
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
                placeholder="Search by name, email, department or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-100 bg-white/80 backdrop-blur-sm text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent shadow-sm transition-all"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white font-bold hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <UserPlus size={20} />
                <span>Add Organizer</span>
              </button>

              <DownloadCSVAdvanced
                data={filtered}
                filename="organizers"
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
                onClick={fetchOrganizers}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 text-gray-600 hover:border-[#8b4fa2] hover:text-[#8b4fa2] transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div
                className="w-12 h-12 rounded-full border-[3px] border-t-transparent animate-spin"
                style={{ borderColor: "#9B59B6", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-400 font-medium">Loading organizers...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200">
              <Users className="text-[56px] mb-3" style={{ color: "#d8b4fe" }} />
              <p className="text-base font-bold text-gray-600">No organizers found</p>
              <p className="text-sm mt-1 text-gray-400">
                {search ? "Try adjusting your search" : "No organizers are registered yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Table Header - Removed Status Column */}
              <div className="hidden md:grid grid-cols-12 px-6 py-4 bg-linear-to-r from-purple-50 to-pink-50 border-b border-gray-100 text-xs font-black text-gray-500 uppercase tracking-widest">
                <div className="col-span-4 flex items-center gap-1.5">
                  <User size={14} /> Organizer
                </div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <Mail size={14} /> Email
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Briefcase size={14} /> Department
                </div>
                <div className="col-span-1 flex items-center gap-1.5">
                  <Phone size={14} /> Phone
                </div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Rows - Removed Status */}
              <div className="divide-y divide-gray-50">
                {filtered.map((organizer) => (
                  <div
                    key={organizer._id}
                    className="grid grid-cols-1 md:grid-cols-12 items-center px-6 py-4 hover:bg-purple-50/40 transition-all duration-200 gap-2 group"
                  >
                    {/* Avatar + Name */}
                    <div
                      className="col-span-4 flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedOrganizer(organizer)}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md"
                        style={{ backgroundColor: getColor(organizer.name) }}
                      >
                        {getInitials(organizer.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#8b4fa2] transition-colors">
                          {organizer.name}
                        </p>
                        {organizer.department && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Building size={10} /> {organizer.department}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden md:block">
                      <p className="text-sm text-gray-500 truncate">{organizer.email}</p>
                    </div>

                    {/* Department */}
                    <div className="col-span-2 hidden md:block">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700">
                        {organizer.department || "N/A"}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="col-span-1 hidden md:block">
                      <span className="text-xs font-semibold text-gray-500">
                        {organizer.phone || "—"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrganizer(organizer)}
                        className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition-colors group-hover:shadow-sm"
                        title="View Details"
                      >
                        <Eye size={16} className="text-[#8b4fa2]" />
                      </button>
                      <button
                        onClick={() => startEditing(organizer)}
                        className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors group-hover:shadow-sm"
                        title="Edit Organizer"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(organizer)}
                        className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors group-hover:shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-400 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span className="font-medium">
                  Showing <span className="text-gray-600 font-bold">{filtered.length}</span> of <span className="text-gray-600 font-bold">{organizers.length}</span> organizers
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== ORGANIZER DETAIL MODAL ===== */}
      {selectedOrganizer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setSelectedOrganizer(null)}
        >
          <div
            className="bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl w-full max-w-md p-6 transform transition-all duration-200 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <User size={22} className="text-[#8b4fa2]" />
                Organizer Profile
              </h3>
              <button 
                onClick={() => setSelectedOrganizer(null)} 
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3 ring-4 ring-purple-100"
                style={{ backgroundColor: getColor(selectedOrganizer.name) }}
              >
                {getInitials(selectedOrganizer.name)}
              </div>
              <h4 className="text-xl font-bold text-gray-800">{selectedOrganizer.name}</h4>
              <p className="text-sm text-gray-400">{selectedOrganizer.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Phone size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Phone</p>
                <p className="text-sm text-gray-700 font-medium">{selectedOrganizer.phone || "N/A"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Briefcase size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Department</p>
                <p className="text-sm text-gray-700 font-medium">{selectedOrganizer.department || "N/A"}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Calendar size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Joined</p>
                <p className="text-sm text-gray-700 font-medium">
                  {selectedOrganizer.createdAt ? new Date(selectedOrganizer.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                <Clock size={16} className="text-[#8b4fa2] mb-1" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Last Active</p>
                <p className="text-sm text-gray-700 font-medium">
                  {selectedOrganizer.updatedAt ? new Date(selectedOrganizer.updatedAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrganizer(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setSelectedOrganizer(null); setConfirmDelete(selectedOrganizer); }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-red-500 to-rose-500 hover:shadow-lg"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT ORGANIZER MODAL ===== */}
      {isEditing && editingOrganizer && (
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
                Edit Organizer
              </h3>
              <button 
                onClick={() => cancelEditing()} 
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Full Name - Editable */}
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

              {/* Email - Read Only */}
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

              {/* Phone - Editable */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  placeholder="03XXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                />
              </div>

              {/* Department - Editable */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditChange}
                  placeholder="Enter department"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
                />
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

    {/* ===== ADD ORGANIZER MODAL ===== */}
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
          Add Organizer
        </h3>
        <button 
          onClick={() => setShowAddModal(false)} 
          className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={22} />
        </button>
      </div>

      <form onSubmit={handleAddOrganizer}>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={newOrganizer.name}
              onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={newOrganizer.email}
              onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })}
              placeholder="admin@college.com"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
              required
            />
          </div>

          {/* Password with Eye Icon */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={newOrganizer.password}
                onChange={(e) => setNewOrganizer({ ...newOrganizer, password: e.target.value })}
                placeholder="Enter password (min 8 characters)"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#8b4fa2] transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {newOrganizer.password && newOrganizer.password.length < 8 && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span>⚠️</span> Password must be at least 8 characters
              </p>
            )}
            {newOrganizer.password && newOrganizer.password.length >= 8 && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span>✅</span> Strong password!
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={newOrganizer.department}
              onChange={(e) => setNewOrganizer({ ...newOrganizer, department: e.target.value })}
              placeholder="Enter department (e.g., Computer Science)"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={newOrganizer.phone}
              onChange={(e) => setNewOrganizer({ ...newOrganizer, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              placeholder="03XXXXXXXXX"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">11 digits (e.g., 03331234567)</p>
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
            disabled={addingOrganizer}
            className="flex-1 py-2.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] hover:shadow-lg disabled:opacity-50"
          >
            {addingOrganizer ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Add Organizer
              </>
            )}
          </button>
        </div>
      </form>
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
            <h3 className="text-lg font-black text-gray-800 mb-2">Remove Organizer?</h3>
            <p className="text-sm text-gray-500 mb-1">Are you sure you want to remove</p>
            <p className="text-sm font-bold text-[#8b4fa2] mb-6">"{confirmDelete.name}"</p>

            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 text-left">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                This will permanently delete this organizer and all associated data.
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

      <style jsx>{`
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

export default ManageOrganizers;
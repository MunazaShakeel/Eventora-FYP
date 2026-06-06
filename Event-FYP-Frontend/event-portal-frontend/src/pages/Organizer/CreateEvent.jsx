import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import OrganizerSidebar from "../../components/OrganizerSidebar";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, MapPin, Edit2, PlusCircle, Image as ImageIcon, X, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CreateEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const editEvent = location.state?.event || null;
  const isEditMode = !!editEvent;

  const [formData, setFormData] = useState({
    title: editEvent?.title || "",
    description: editEvent?.description || "",
    venue: editEvent?.venue || "",
    start_date: editEvent?.start_date ? editEvent.start_date.split("T")[0] : "",
    start_time: editEvent?.start_time || "",
    end_date: editEvent?.end_date ? editEvent.end_date.split("T")[0] : "",
    end_time: editEvent?.end_time || "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(editEvent?.image_url || null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const { title, venue, start_date, start_time, end_date, end_time } = formData;
    if (title.trim().length < 3) return "Title must be at least 3 characters.";
    if (!venue.trim()) return "Venue is required.";
    if (!start_date) return "Start date is required.";
    if (!start_time) return "Start time is required.";
    if (!end_date) return "End date is required.";
    if (!end_time) return "End time is required.";
    if (new Date(end_date) < new Date(start_date)) return "End date cannot be before start date.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (image) data.append("image", image);

      if (isEditMode) {
        await axios.put(`${API_URL}/events/${editEvent._id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Event updated successfully!");
      } else {
        await axios.post(`${API_URL}/events`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccess("Event submitted for Admin approval!");
      }

      setTimeout(() => navigate("/organizer/my-events"), 2000);

    } catch (err) {
      setError(err?.response?.data?.message || (isEditMode ? "Failed to update event." : "Failed to create event."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-white to-gray-50 font-sans text-[#1A1A1A]">
      <OrganizerSidebar />
      <main className="md:ml-64 flex-1 pb-20 px-6 md:px-10 pt-10 flex justify-center">
        <div className="w-full max-w-4xl">

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-600 font-medium text-sm">{error}</p>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-600 font-medium text-sm">{success}</p>
            </div>
          )}

          {/* Yellow Border Card */}
          <div className="bg-white border-8 border-yellow-400 rounded-2xl shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">

              {/* Header with Lucide Icons */}
              <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-5">
                  {isEditMode ? (
                    <Edit2 className="w-8 h-8 text-[#8b4fa2]" />
                  ) : (
                    <PlusCircle className="w-8 h-8 text-[#8b4fa2]" />
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
                  {isEditMode ? "Edit" : "Create New"} <span className="text-[#8b4fa2]">Event</span>
                </h1>
                <p className="text-gray-600 text-base md:text-lg">
                  {isEditMode 
                    ? "Update the details of your event" 
                    : "Fill in the details below to create a campus event"}
                </p>
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-bold text-lg text-gray-700">
                  <ImageIcon size={20} className="text-[#8b4fa2]" />
                  Event Cover Image <span className="text-gray-400 font-normal text-sm">(optional)</span>
                </label>
                <div
                  className="relative border-2 border-dashed border-[#8b4fa2] rounded-2xl overflow-hidden bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 transition"
                  style={{ aspectRatio: "16/7" }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-contain bg-white" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
                        className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold z-10 hover:bg-red-600 flex items-center gap-1"
                      >
                        <X size={12} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl mb-2">📁</span>
                      <span className="text-gray-500 font-semibold text-sm">Click to upload event cover image</span>
                      <span className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP supported</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <Calendar size={18} className="text-[#8b4fa2]" />
                    Event Title
                  </label>
                  <input
                    type="text" name="title" onChange={handleChange} value={formData.title}
                    placeholder="e.g. Annual Science Fair 2025"
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-gray-700">Description</label>
                  <textarea
                    name="description" rows={5} onChange={handleChange} value={formData.description}
                    placeholder="Provide a brief description of the event, who can attend, and activities planned..."
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <MapPin size={18} className="text-[#8b4fa2]" />
                    Venue
                  </label>
                  <input
                    type="text" name="venue" onChange={handleChange} value={formData.venue}
                    placeholder="e.g. Main Auditorium, Block B"
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <Calendar size={16} className="text-[#8b4fa2]" />
                    Start Date
                  </label>
                  <input
                    type="date" name="start_date" onChange={handleChange} value={formData.start_date}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <Clock size={16} className="text-[#8b4fa2]" />
                    Start Time
                  </label>
                  <input
                    type="time" name="start_time" onChange={handleChange} value={formData.start_time}
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <Calendar size={16} className="text-[#8b4fa2]" />
                    End Date
                  </label>
                  <input
                    type="date" name="end_date" onChange={handleChange} value={formData.end_date}
                    min={formData.start_date || new Date().toISOString().split("T")[0]}
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 font-bold text-gray-700">
                    <Clock size={16} className="text-[#8b4fa2]" />
                    End Time
                  </label>
                  <input
                    type="time" name="end_time" onChange={handleChange} value={formData.end_time}
                    className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:ring-2 focus:ring-[#8b4fa2] outline-none transition"
                    required
                  />
                </div>

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/organizer/my-events")}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 rounded-xl text-white font-bold shadow-lg bg-linear-to-r from-[#8b4fa2] to-[#7a3d91] hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Event" : "Submit for Approval")}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
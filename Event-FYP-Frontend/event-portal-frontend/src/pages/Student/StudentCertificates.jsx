import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentSidebar from "../../components/StudentSidebar";
import { Download, Award, Calendar, MapPin, Eye, X, Sparkles, Trophy, Star } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${API_URL}/certificates/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCertificates(data.data || []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId, eventTitle, studentName) => {
    try {
      setDownloading(certificateId);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/certificates/download/${certificateId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/pdf'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `Certificate_${studentName || 'Student'}_${eventTitle || 'Event'}.pdf`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download certificate. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (certificate) => {
    setPreviewCertificate(certificate);
    setShowPreview(true);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCertificateTypeIcon = (type) => {
    switch(type) {
      case 'Winner':
        return <Trophy size={20} />;
      case 'Runner Up':
        return <Award size={20} />;
      default:
        return <Star size={20} />;
    }
  };

  const getCertificateTypeColor = (type) => {
    switch(type) {
      case 'Winner':
        return 'bg-linear-to-r from-yellow-400 to-orange-500 text-white';
      case 'Runner Up':
        return 'bg-linear-to-r from-gray-400 to-gray-500 text-white';
      default:
        return 'bg-linear-to-r from-blue-400 to-purple-500 text-white';
    }
  };

  const getCertificateBadge = (type) => {
    switch(type) {
      case 'Winner':
        return '🏆 Winner';
      case 'Runner Up':
        return '🥈 Runner Up';
      default:
        return '📜 Participation';
    }
  };

  // Filter certificates based on search
  const filteredCertificates = certificates.filter(cert => 
    cert.event_id?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50">
        <StudentSidebar />
        <div className="md:ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-[#8b4fa2] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your achievements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50">
      <StudentSidebar />
      <main className="md:ml-64 flex-1 pb-20 px-6 md:px-10 pt-10">
        <div className="w-full max-w-7xl mx-auto">
          
          {/* Header with Animation */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-4 shadow-sm">
              <Sparkles className="text-[#8b4fa2]" size={20} />
              <span className="text-sm font-semibold text-gray-600">My Achievements</span>
            </div>
            <h1 className="text-6xl font-extrabold mb-4 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] bg-clip-text text-transparent">
              Certificate Gallery
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Celebrate your accomplishments and download your well-deserved certificates
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 border-l-4 p-4 rounded-xl text-sm font-semibold bg-red-50 border-red-500 text-red-600">
              {error}
            </div>
          )}

          {/* Search Bar */}
          {certificates.length > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by event name or certificate type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-[#8b4fa2] focus:border-[#8b4fa2] outline-none transition shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Certificates Grid */}
          {certificates.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-purple-100">
              <div className="text-center py-20 px-4">
                <div className="w-32 h-32 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award size={64} className="text-[#8b4fa2]" />
                </div>
                <h3 className="text-3xl font-bold text-gray-700 mb-3">No Certificates Yet</h3>
                <p className="text-gray-500 text-lg mb-8">
                  You haven't received any certificates yet.<br />
                  Participate in events and get recognized for your achievements!
                </p>
                <button className="px-6 py-3 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105">
                  Explore Events
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Total Certificates</p>
                      <p className="text-4xl font-bold">{certificates.length}</p>
                    </div>
                    <Award size={48} className="opacity-80" />
                  </div>
                </div>
                <div className="bg-linear-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Participation</p>
                      <p className="text-4xl font-bold">{certificates.filter(c => c.certificate_type === 'Participation').length}</p>
                    </div>
                    <Star size={48} className="opacity-80" />
                  </div>
                </div>
                <div className="bg-linear-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm mb-1">Achievements</p>
                      <p className="text-4xl font-bold">{certificates.filter(c => c.certificate_type !== 'Participation').length}</p>
                    </div>
                    <Trophy size={48} className="opacity-80" />
                  </div>
                </div>
              </div>

              {/* Certificates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCertificates.map((cert, index) => (
                  <div 
                    key={cert._id} 
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Certificate Card Header with Gradient */}
                    <div className={`relative p-6 text-white ${getCertificateTypeColor(cert.certificate_type)}`}>
                      <div className="absolute top-4 right-4 opacity-20">
                        {getCertificateTypeIcon(cert.certificate_type)}
                      </div>
                      <div className="relative z-10">
                        <div className="mb-3 text-5xl">🏅</div>
                        <h3 className="text-xl font-bold mb-1 line-clamp-1">{cert.event_id?.title || "Event"}</h3>
                        <p className="text-white/90 text-sm">
                          {formatDate(cert.issued_date)}
                        </p>
                      </div>
                    </div>

                    {/* Certificate Body */}
                    <div className="p-6">
                      {/* Certificate Badge */}
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-purple-100 to-pink-100 rounded-full text-sm font-semibold text-purple-700">
                          {getCertificateTypeIcon(cert.certificate_type)}
                          <span>{getCertificateBadge(cert.certificate_type)}</span>
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-600">
                          <Calendar size={16} className="mr-3 text-purple-500" />
                          <span className="text-sm">{formatDate(cert.event_id?.start_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin size={16} className="mr-3 text-purple-500" />
                          <span className="text-sm">{cert.event_id?.venue || "College Campus"}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handlePreview(cert)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-semibold transition transform hover:scale-105"
                        >
                          <Eye size={18} />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleDownload(cert._id, cert.event_id?.title, cert.student_id?.name)}
                          disabled={downloading === cert._id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] hover:from-[#724286] hover:to-[#3db8ae] text-white rounded-xl font-semibold transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloading === cert._id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>...</span>
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* No search results */}
              {filteredCertificates.length === 0 && (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl">
                  <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No certificates match your search.</p>
                </div>
              )}
            </>
          )}

          {/* Inspirational Quote */}
          {certificates.length > 0 && (
            <div className="mt-12 p-6 bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl text-white text-center shadow-xl">
              <p className="text-lg font-medium italic">
                "Every certificate is a step towards greatness. Keep shining! ✨"
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && previewCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <Award size={24} />
                <h2 className="text-xl font-bold">Certificate Preview</h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Certificate Preview */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-8 border-purple-200">
                {/* Certificate Header */}
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h1 className="text-3xl font-bold text-purple-700 mb-2">Certificate of {previewCertificate.certificate_type}</h1>
                  <div className="w-24 h-1 bg-linear-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
                </div>

                {/* Certificate Body */}
                <div className="text-center mb-8">
                  <p className="text-gray-600 mb-2">This certificate is proudly presented to</p>
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 mb-6">
                    {previewCertificate.student_id?.name || "Student"}
                  </h2>
                  <p className="text-gray-600 mb-2">for successfully participating in</p>
                  <h3 className="text-2xl font-bold text-purple-700 mb-4">
                    {previewCertificate.event_id?.title}
                  </h3>
                  <div className="flex justify-center gap-6 text-sm text-gray-500 mt-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatDate(previewCertificate.event_id?.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{previewCertificate.event_id?.venue || "College Campus"}</span>
                    </div>
                  </div>
                </div>

                {/* Certificate Footer */}
                <div className="text-center pt-6 border-t border-purple-200">
                  <p className="text-sm text-gray-500">
                    Issued on: {formatDate(previewCertificate.issued_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    Certificate ID: {previewCertificate._id}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewCertificate._id, previewCertificate.event_id?.title, previewCertificate.student_id?.name);
                  setShowPreview(false);
                }}
                className="px-6 py-2 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                Download
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
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
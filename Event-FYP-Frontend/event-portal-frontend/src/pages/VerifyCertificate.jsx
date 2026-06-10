import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Award, Calendar, MapPin, CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/certificates/verify/${certificateId}`);
        if (response.data.success) {
          setCertificate(response.data.data);
        } else {
          setError("Certificate not found");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to verify certificate");
      } finally {
        setLoading(false);
      }
    };
    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-[#8b4fa2] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Certificate</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/" className="inline-block px-6 py-3 bg-[#8b4fa2] text-white rounded-xl font-semibold hover:bg-[#724286] transition">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Green Success Header */}
        <div className="bg-linear-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
          <CheckCircle size={48} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">✓ Verified Certificate</h1>
          <p className="text-green-100 text-sm mt-1">This is an official certificate from College Event Management</p>
        </div>

        {/* Certificate Preview */}
        <div className="p-8">
          <div className="border-4 border-purple-200 rounded-2xl p-6 bg-linear-to-br from-purple-50 to-pink-50">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <h2 className="text-2xl font-bold text-purple-700">Certificate of {certificate.certificate_type}</h2>
              <div className="w-16 h-1 bg-linear-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-3"></div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">This certificate is proudly presented to</p>
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600 my-4">
                {certificate.student_id?.name}
              </h3>
              <p className="text-gray-600">for successfully participating in</p>
              <h4 className="text-xl font-bold text-purple-700 my-3">{certificate.event_id?.title}</h4>
              <div className="flex justify-center gap-4 text-sm text-gray-500 mt-3">
                <span>📅 {new Date(certificate.event_id?.start_date).toLocaleDateString()}</span>
                <span>📍 {certificate.event_id?.venue || "College Campus"}</span>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-purple-200 mt-6">
              <p className="text-sm text-gray-500">Issued on: {new Date(certificate.issued_date).toLocaleDateString()}</p>
              <p className="text-xs text-gray-400 mt-2 font-mono">Certificate ID: {certificate._id}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-400">🔗 This certificate can be verified online at any time</p>
        </div>
      </div>
    </div>
  );
}
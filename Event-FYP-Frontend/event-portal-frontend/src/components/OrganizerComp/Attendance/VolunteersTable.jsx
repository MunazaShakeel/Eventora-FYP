import React, { useState } from "react";
import { Calendar, Clock, MapPin, Edit2, PlusCircle, Download, X, AlertCircle, CheckCircle, User, Mail, GraduationCap, Users } from "lucide-react";
import DownloadCSVAdvanced from "../../DownloadCSVAdvanced";

const colors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#FFE66D", "#9B59B6", "#3498db", "#e74c3c", "#2ecc71"];

const getAvatar = (name, i) => ({
  bg: colors[i % colors.length],
  letter: name?.charAt(0)?.toUpperCase() || "S",
});

const VolunteersTable = ({ volunteers, onDownload, eventTitle }) => {
  const [filter, setFilter] = useState("all");

  // Calculate counts
  const presentCount = volunteers.filter(v => v.attendance_status === "Present").length;
  const absentCount = volunteers.filter(v => v.attendance_status !== "Present").length;

  // Filter volunteers
  const filteredVolunteers = volunteers.filter((vol) => {
    if (filter === "present") return vol.attendance_status === "Present";
    if (filter === "absent") return vol.attendance_status !== "Present";
    return true;
  });

  // Prepare data for CSV download
  const csvData = volunteers.map((vol, idx) => ({
    "S.No": idx + 1,
    "Name": vol.student_id?.name || "N/A",
    "Email": vol.student_id?.email || "N/A",
    "Department": vol.student_id?.department || vol.student_id?.grade || "N/A",
    "Semester": vol.student_id?.semester || "N/A",
    "Role": vol.role || "Volunteer",
    "Registration Date": new Date(vol.createdAt).toLocaleDateString(),
    "Attendance Status": vol.attendance_status || "Not Marked"
  }));

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All Volunteers", count: volunteers.length, icon: Users },
            { key: "present", label: "Present", count: presentCount, icon: CheckCircle },
            { key: "absent", label: "Absent", count: absentCount, icon: X },
          ].map((tab) => (
            <button 
              key={tab.key} 
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
              style={{
                background: filter === tab.key ? "#8b4fa2" : "white",
                color: filter === tab.key ? "white" : "#6b7280",
                border: filter === tab.key ? "none" : "1px solid #e5e7eb",
                boxShadow: filter === tab.key ? "0 4px 12px rgba(139,79,162,0.25)" : "none"
              }}
            >
              <tab.icon size={14} />
              {tab.label}
              <span 
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: filter === tab.key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                  color: filter === tab.key ? "white" : "#9ca3af"
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Download Button */}
        <DownloadCSVAdvanced 
          data={csvData}
          filename={`volunteers_${eventTitle || "event"}`}
          buttonText="Download Volunteers CSV"
          size="md"
        />
      </div>

      {/* Table */}
      {filteredVolunteers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-[#8b4fa2] opacity-50" />
          </div>
          <p className="text-lg font-bold text-gray-500">No volunteers found</p>
          <p className="text-sm text-gray-400 mt-1">Try changing the filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-6 py-4 bg-linear-to-r from-purple-50 to-teal-50 border-b border-gray-100">
            <p className="col-span-1 text-xs font-bold uppercase tracking-wider text-[#8b4fa2]">#</p>
            <p className="col-span-4 text-xs font-bold uppercase tracking-wider text-[#8b4fa2]">Volunteer</p>
            <p className="col-span-3 text-xs font-bold uppercase tracking-wider text-[#8b4fa2]">Department</p>
            <p className="col-span-2 text-xs font-bold uppercase tracking-wider text-[#8b4fa2]">Semester</p>
            <p className="col-span-2 text-xs font-bold uppercase tracking-wider text-[#8b4fa2]">Status</p>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-50">
            {filteredVolunteers.map((vol, index) => {
              const student = vol.student_id;
              const isPresent = vol.attendance_status === "Present";
              const avatar = getAvatar(student?.name, index);
              
              return (
                <div 
                  key={vol._id}
                  className="grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-purple-50/30 transition-all duration-200"
                >
                  {/* Serial Number */}
                  <div className="col-span-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-purple-50 text-[#8b4fa2]">
                      {index + 1}
                    </div>
                  </div>

                  {/* Volunteer Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${avatar.bg}, #4ECDC4)` }}
                    >
                      {avatar.letter}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{student?.name || "—"}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail size={10} className="text-gray-400" />
                        <p className="text-xs text-gray-400 truncate">{student?.email || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#8b4fa2]" />
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {student?.department || student?.grade || "—"}
                      </p>
                    </div>
                    {student?.section && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Section {student.section}</p>
                    )}
                  </div>

                  {/* Semester */}
                  <div className="col-span-2">
                    {student?.semester ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-[#8b4fa2]">
                        <Calendar size={10} />
                        Semester {student.semester}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span 
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        isPresent 
                          ? "bg-green-50 text-green-600" 
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {isPresent ? (
                        <CheckCircle size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              Showing {filteredVolunteers.length} of {volunteers.length} volunteers
            </p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {presentCount} Present
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                {absentCount} Absent
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VolunteersTable;
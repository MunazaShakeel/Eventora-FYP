import React, { useState } from "react";

const colors = ["#8b4fa2", "#4ECDC4", "#FF6B6B", "#FFE66D", "#9B59B6"];
const getAvatar = (name, i) => ({
  bg: colors[i % colors.length],
  letter: name?.charAt(0)?.toUpperCase() || "S",
});

const AttendanceTable = ({ registrations, presentCount, absentCount, onDownload }) => {
  const [filter, setFilter] = useState("all");

  const filtered = registrations.filter((reg) => {
    if (filter === "present") return reg.attendance_status === "Present";
    if (filter === "absent") return reg.attendance_status !== "Present";
    return true;
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All", count: registrations.length },
            { key: "present", label: "Present", count: presentCount },
            { key: "absent", label: "Absent", count: absentCount },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: filter === tab.key ? "#8b4fa2" : "white",
                color: filter === tab.key ? "white" : "#6b7280",
                border: filter === tab.key ? "none" : "1px solid #f0e8f8",
                boxShadow: filter === tab.key ? "0 4px 12px rgba(139,79,162,0.3)" : "none"
              }}>
              {tab.label}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: filter === tab.key ? "rgba(255,255,255,0.2)" : "#f3f4f6",
                  color: filter === tab.key ? "white" : "#9ca3af"
                }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button onClick={onDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #8b4fa2, #4ECDC4)",
            boxShadow: "0 4px 15px rgba(139,79,162,0.35)"
          }}>
          <span className="material-symbols-outlined text-[18px]">download</span>
          Download CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: "#d8b4fe" }}>group_off</span>
          <p className="text-base font-bold text-gray-500">No students found</p>
          <p className="text-sm text-gray-400 mt-1">Try changing the filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: "1px solid #f0e8f8" }}>

          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-6 py-4"
            style={{ background: "linear-gradient(90deg, #f5eefa, #edfafa)" }}>
            <p className="col-span-1 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#8b4fa2" }}>#</p>
            <p className="col-span-4 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#8b4fa2" }}>Student</p>
            <p className="col-span-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#8b4fa2" }}>Dept / Grade</p>
            <p className="col-span-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#8b4fa2" }}>Role</p>
            <p className="col-span-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#8b4fa2" }}>Status</p>
          </div>

          {/* Rows */}
          {filtered.map((reg, index) => {
            const student = reg.student_id;
            const isPresent = reg.attendance_status === "Present";
            const avatar = getAvatar(student?.name, index);
            return (
              <div key={reg._id}
                className="grid grid-cols-12 gap-2 px-6 py-4 items-center transition-colors hover:bg-purple-50/30"
                style={{ borderBottom: "1px solid #faf5ff" }}>

                <div className="col-span-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "#f5eefa", color: "#8b4fa2" }}>
                    {index + 1}
                  </div>
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-extrabold shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${avatar.bg}, #4ECDC4)` }}>
                    {avatar.letter}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{student?.name || "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{student?.email || "—"}</p>
                  </div>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-semibold text-gray-700 truncate">
                    {student?.department || student?.grade || "—"}
                  </p>
                  {student?.semester && (
                    <p className="text-[10px] text-gray-400">Semester {student.semester}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: reg.role === "Volunteer" ? "#edfafa" : "#f5eefa",
                      color: reg.role === "Volunteer" ? "#4ECDC4" : "#8b4fa2"
                    }}>
                    {reg.role}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full w-fit"
                    style={{
                      background: isPresent ? "#f0fdf4" : "#f9fafb",
                      color: isPresent ? "#22c55e" : "#9ca3af"
                    }}>
                    <span className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPresent ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    {isPresent ? "Present" : "Absent"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ background: "#faf5ff", borderTop: "1px solid #f0e8f8" }}>
            <p className="text-xs text-gray-400 font-semibold">
              Showing {filtered.length} of {registrations.length} students
            </p>
            <p className="text-xs font-bold" style={{ color: "#8b4fa2" }}>
              {presentCount} Present · {absentCount} Absent
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceTable;
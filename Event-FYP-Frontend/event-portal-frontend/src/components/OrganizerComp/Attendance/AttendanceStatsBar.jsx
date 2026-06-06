import React from "react";

const AttendanceStatsBar = ({ registrations, presentCount, absentCount, attendanceRate }) => {
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Registered", value: registrations.length, icon: "group", bg: "#f5eefa", color: "#8b4fa2" },
          { label: "Present", value: presentCount, icon: "check_circle", bg: "#f0fdf4", color: "#22c55e" },
          { label: "Absent", value: absentCount, icon: "cancel", bg: "#fff1f2", color: "#f87171" },
          { label: "Attendance Rate", value: `${attendanceRate}%`, icon: "bar_chart", bg: "linear-gradient(135deg,#8b4fa2,#4ECDC4)", color: "#fff", isGradient: true },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-5 shadow-sm flex items-center gap-4"
            style={{ background: stat.isGradient ? stat.bg : "white", border: stat.isGradient ? "none" : "1px solid #f0e8f8" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: stat.isGradient ? "rgba(255,255,255,0.2)" : stat.bg }}>
              <span className="material-symbols-outlined text-[22px]"
                style={{ color: stat.isGradient ? "#fff" : stat.color, fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-tight"
                style={{ color: stat.isGradient ? "#fff" : "#1a1a1a" }}>{stat.value}</p>
              <p className="text-xs font-semibold mt-0.5"
                style={{ color: stat.isGradient ? "rgba(255,255,255,0.75)" : "#9ca3af" }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {registrations.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Overall Attendance</p>
            <span className="text-sm font-extrabold text-[#8b4fa2]">{attendanceRate}%</span>
          </div>
          <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "#f0e8f8" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${attendanceRate}%`,
                background: "linear-gradient(90deg, #8b4fa2, #4ECDC4)",
                boxShadow: "0 2px 8px rgba(139,79,162,0.4)"
              }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-green-500 font-semibold">{presentCount} present</span>
            <span className="text-xs text-red-400 font-semibold">{absentCount} absent</span>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceStatsBar;
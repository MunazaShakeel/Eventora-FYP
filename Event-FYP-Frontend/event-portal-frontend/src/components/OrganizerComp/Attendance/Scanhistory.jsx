import React from "react";

const ScanHistory = ({ scanHistory, clearHistory }) => {
  return (
    <div className="bg-white rounded-2xl shadow-premium overflow-hidden">
      <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-base">history</span>
            </div>
            <h3 className="font-bold text-gray-800">Recent Scans</h3>
            {scanHistory.length > 0 && (
              <span className="px-2 py-0.5 bg-[#8b4fa2]/10 text-[#8b4fa2] text-xs rounded-full font-semibold">
                {scanHistory.length}
              </span>
            )}
          </div>
          {scanHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
        {scanHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl text-gray-300">history</span>
            </div>
            <p className="text-sm text-gray-400">No scans yet</p>
            <p className="text-xs text-gray-300 mt-1">Start scanning to see history</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((entry, idx) => (
              <div 
                key={entry.id} 
                className={`p-3 rounded-xl transition-all duration-300 hover:shadow-md ${
                  entry.type === "success" ? "bg-green-50 border border-green-100" : 
                  entry.type === "warning" ? "bg-yellow-50 border border-yellow-100" : "bg-red-50 border border-red-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    entry.type === "success" ? "bg-green-100" : 
                    entry.type === "warning" ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    <span className={`material-symbols-outlined text-base ${
                      entry.type === "success" ? "text-green-600" : 
                      entry.type === "warning" ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {entry.type === "success" ? "check_circle" : 
                       entry.type === "warning" ? "warning" : "error"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {entry.studentName && entry.studentName !== "Unknown Student" 
                        ? entry.studentName 
                        : entry.message}
                    </p>
                    {entry.eventTitle && entry.eventTitle !== "Unknown Event" && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{entry.eventTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="material-symbols-outlined text-xs text-gray-400">schedule</span>
                      <p className="text-xs text-gray-400">{entry.time}</p>
                      <span className="text-xs text-gray-300">•</span>
                      <p className="text-xs text-gray-400">{entry.date}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">#{scanHistory.length - idx}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistory;
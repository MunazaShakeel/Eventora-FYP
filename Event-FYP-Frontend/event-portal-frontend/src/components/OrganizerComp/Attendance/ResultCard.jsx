import React from "react";

const ResultCard = ({ result, resultConfig }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-2xl shadow-premium p-8 text-center">
        <div className="w-20 h-20 bg-linear-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl text-[#8b4fa2]">qr_code_scanner</span>
        </div>
        <p className="text-gray-500 font-medium">Ready to Scan</p>
        <p className="text-xs text-gray-400 mt-1">Scan result will appear here</p>
      </div>
    );
  }

  const config = resultConfig[result.type];
  
  return (
    <div className={`rounded-2xl shadow-premium overflow-hidden border-l-8 ${config.border}`}>
      <div className={`${config.bg} p-6`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${config.iconBg} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined text-3xl ${config.iconColor}`}>
              {config.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-xl ${config.title}`}>
              {result.type === "success" ? "Attendance Marked!" : 
               result.type === "warning" ? "Already Registered" : 
               "Scan Failed"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
            
            {result.studentName && result.studentName !== "Unknown Student" && (
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[#8b4fa2] text-base">person</span>
                  <span className="font-semibold text-gray-800">{result.studentName}</span>
                </div>
                {result.studentEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-gray-400 text-base">email</span>
                    <span className="text-gray-600">{result.studentEmail}</span>
                  </div>
                )}
                {result.eventTitle && result.eventTitle !== "Unknown Event" && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[#8b4fa2] text-base">event</span>
                    <span className="font-semibold text-gray-800">{result.eventTitle}</span>
                  </div>
                )}
                {result.eventVenue && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-gray-400 text-sm">location_on</span>
                    <span className="text-gray-500">{result.eventVenue}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{result.timestamp} • {result.date}</span>
                </div>
              </div>
            )}
            
            {(!result.studentName || result.studentName === "Unknown Student") && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Student details not found. Please check registration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
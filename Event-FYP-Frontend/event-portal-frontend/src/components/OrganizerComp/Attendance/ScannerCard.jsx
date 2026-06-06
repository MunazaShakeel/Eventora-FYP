import React from "react";

const ScannerCard = ({ 
  selectedEvent, 
  setSelectedEvent, 
  events, 
  loadingEvents, 
  scanning, 
  loading, 
  startScanner, 
  stopScanner, 
  result, 
  handleScanAgain,
  viewEventAttendance,
  cameraError,
  scanningState
}) => {
  const selectedEventDetails = events.find(e => e._id === selectedEvent);

  return (
    <div className="bg-white rounded-2xl shadow-premium overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-[#8b4fa2] to-[#6b3d82] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-2xl">qr_code_scanner</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">QR Scanner</h2>
            <p className="text-purple-200 text-xs">Point camera at student's QR code</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Event Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Event
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">event</span>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              disabled={scanning || loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8b4fa2] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all"
            >
              <option value="">-- Choose an event --</option>
              {loadingEvents ? (
                <option disabled>Loading events...</option>
              ) : (
                events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title} • {new Date(event.start_date).toLocaleDateString()}
                  </option>
                ))
              )}
            </select>
          </div>
          {selectedEventDetails && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {selectedEventDetails.venue || "TBA"}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {new Date(selectedEventDetails.start_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Camera View */}
        <div className="relative rounded-xl overflow-hidden bg-linear-to-br from-gray-900 to-black mb-4 shadow-inner" style={{ minHeight: "320px" }}>
          <div id="qr-reader" className="w-full" />

          {!scanningState && !loading && !result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-gray-900 to-black">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-5xl text-gray-500">photo_camera</span>
              </div>
              <p className="text-white text-sm font-medium">Camera Inactive</p>
              <p className="text-gray-400 text-xs mt-2">Select an event and start scanner</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 backdrop-blur-sm">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-[#8b4fa2] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#8b4fa2] text-xl animate-pulse">qr_code</span>
                </div>
              </div>
              <p className="text-white text-sm font-medium mt-4">Processing...</p>
              <p className="text-gray-400 text-xs mt-1">Verifying attendance</p>
            </div>
          )}

          {scanningState && (
            <>
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1.5 z-10 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-white rounded-full absolute animate-pulse"></div>
                <span className="text-white text-xs font-bold">SCANNING</span>
              </div>
              <div className="absolute inset-0 border-2 border-green-400 rounded-xl pointer-events-none animate-pulse m-2"></div>
              <div className="absolute inset-0 bg-linear-to-tr from-green-500/5 to-transparent rounded-xl"></div>
            </>
          )}
        </div>

        {cameraError && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {cameraError}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {!scanningState && !result && (
            <button
              onClick={startScanner}
              disabled={loading || !selectedEvent}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#6b3d82] text-white font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Start Scanner
            </button>
          )}

          {scanningState && (
            <button
              onClick={stopScanner}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">stop_circle</span>
              Stop Scanner
            </button>
          )}

          {result && !scanningState && (
            <button
              onClick={handleScanAgain}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] text-white font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Scan Another
            </button>
          )}
        </div>

        <button
          onClick={viewEventAttendance}
          disabled={!selectedEvent}
          className="mt-3 w-full py-2.5 rounded-xl bg-purple-50 text-[#8b4fa2] text-sm font-semibold hover:bg-purple-100 transition-all duration-300 border border-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">analytics</span>
          View Full Attendance Report
        </button>
      </div>
    </div>
  );
};

export default ScannerCard;
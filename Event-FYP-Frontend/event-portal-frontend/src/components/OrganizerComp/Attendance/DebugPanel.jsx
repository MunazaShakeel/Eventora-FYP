import React from "react";

const DebugPanel = ({ debugInfo, qrContent }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-all z-50"
      >
        <span className="material-symbols-outlined text-sm">bug_report</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-green-400 text-sm">bug_report</span>
          <span className="text-xs font-semibold text-gray-300">Debug Console</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">info</span>
          <p className="text-xs text-green-400 font-mono break-all">{debugInfo || "Waiting for action..."}</p>
        </div>
        {qrContent && (
          <div className="flex items-start gap-2 pt-2 border-t border-gray-700">
            <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">qr_code</span>
            <p className="text-xs text-blue-400 font-mono break-all">{qrContent}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
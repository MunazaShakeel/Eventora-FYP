import React from "react";

const InfoCard = () => {
  return (
    <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#8b4fa2] rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-xl">lightbulb</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-[#8b4fa2] mb-2">Quick Tips</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-[#8b4fa2] text-xs font-bold">1</span>
              <span>Select event first</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-[#8b4fa2] text-xs font-bold">2</span>
              <span>Start camera scanner</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-[#8b4fa2] text-xs font-bold">3</span>
              <span>Hold phone steady</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-[#8b4fa2] text-xs font-bold">4</span>
              <span>Wait for confirmation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
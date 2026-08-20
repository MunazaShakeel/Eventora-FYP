import React from 'react';

const LightboxModal = ({
  lightbox,
  lightboxIndex,
  filteredMedia,
  savedItems,
  toast,
  onClose,
  onPrev,
  onNext,
  onSave,
  onDownload,

  
  onCopyLink,

  BASE_URL
}) => {
  return (
    <>
      {/* LIGHTBOX */}
      {lightbox && (
        <div onClick={onClose} className="fixed inset-0 z-200 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <button onClick={onClose} className="fixed top-4 right-4 z-201 w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-white/20 transition">✕</button>

          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-201 bg-white/10 backdrop-blur-md text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
            {lightboxIndex + 1} / {filteredMedia.length}
          </div>

          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-201 flex gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-2 border border-white/20">
            <button onClick={e => onSave(e, lightbox._id)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-white/80 hover:bg-white/10 transition cursor-pointer">
              <span className="material-symbols-outlined text-lg">{savedItems.includes(lightbox._id) ? 'bookmark' : 'bookmark_border'}</span>
              <span className="text-[0.58rem] opacity-60">Save</span>
            </button>
            <button onClick={e => onDownload(e, lightbox)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-white/80 hover:bg-white/10 transition cursor-pointer">
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="text-[0.58rem] opacity-60">Download</span>
            </button>
           
          </div>

          {filteredMedia.length > 1 && (
            <>
              <button onClick={onPrev} className="fixed left-3 top-1/2 -translate-y-1/2 z-201 w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-purple-600/50 transition">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={onNext} className="fixed right-3 top-1/2 -translate-y-1/2 z-201w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center cursor-pointer hover:bg-purple-600/50 transition">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}

          <div onClick={e => e.stopPropagation()} className="max-w-[88vw] max-h-[78vh]">
            {lightbox.media_type === 'Video' ? (
              <video src={`${BASE_URL}${lightbox.media_url}`} controls autoPlay className="max-w-[88vw] max-h-[78vh] rounded-xl shadow-2xl block" />
            ) : (
              <img src={`${BASE_URL}${lightbox.media_url}`} alt="full" className="max-w-[88vw] max-h-[78vh] rounded-xl shadow-2xl block object-contain" />
            )}
            <p className="text-white/30 text-[0.68rem] text-center mt-2 font-medium">
              {new Date(lightbox.uploaded_at).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

     

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-400 px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shadow-lg animate-toastIn"
          style={{
            background: toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#ede9fe' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: toast.type === 'error' ? '#991b1b' : toast.type === 'info' ? '#5b21b6' : '#fff'
          }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-scaleIn { animation: scaleIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .animate-toastIn { animation: toastIn 0.3s ease; }
      `}</style>
    </>
  );
};

export default LightboxModal;
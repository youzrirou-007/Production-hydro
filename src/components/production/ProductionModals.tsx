import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  modal: { title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ modal, onClose }) => {
  return (
    <AnimatePresence>
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#b8860b]" />
              </div>
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                {modal.title}
              </h3>
            </div>
            <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
              {modal.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  if (modal.onCancel) modal.onCancel();
                  onClose();
                }}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  modal.onConfirm();
                  onClose();
                }}
                className="px-4 py-1.5 bg-[#b8860b] hover:bg-[#a07409] text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface InfoModalProps {
  modal: { title: string; message: string; type: 'error' | 'info' | 'success' } | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ modal, onClose }) => {
  return (
    <AnimatePresence>
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                {modal.title}
              </h3>
            </div>
            <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
              {modal.message}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                Compris
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface SuccessToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ show, message, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-slate-100 shadow-2xl rounded-2xl flex flex-col p-4 border-l-4 border-l-emerald-500 overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-blue-500/20 to-transparent"></div>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-[11px] font-black uppercase text-slate-950 tracking-widest">
                  SMI HYDROMINES
                </h4>
                <button 
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-emerald-650 font-extrabold uppercase tracking-wider">
                ✓ Enregistrement Confirmé
              </p>
              <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

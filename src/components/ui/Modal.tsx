import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer }) => {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-3 backdrop-blur"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-[520px] max-w-[95vw] overflow-y-auto border border-slate-700 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <span className="text-lg font-bold tracking-[0.08em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif]">{title}</span>
          <button className="inline-flex items-center rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

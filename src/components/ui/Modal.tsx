import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, width }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      e.preventDefault();

      const footerEl = e.currentTarget.querySelector('.modal-foot');
      if (footerEl) {
        const buttons = footerEl.querySelectorAll('button');
        let submitBtn: HTMLButtonElement | null = null;

        for (let i = 0; i < buttons.length; i++) {
          const btn = buttons[i];
          const text = btn.textContent?.toLowerCase() || '';

          const isCancel = text.includes('cancel') || 
                           text.includes('close') || 
                           btn.classList.contains('btn-ghost') || 
                           btn.classList.contains('btn-light');

          if (!isCancel) {
            submitBtn = btn;
            break;
          }
        }

        if (!submitBtn && buttons.length > 0) {
          submitBtn = buttons[buttons.length - 1];
        }

        if (submitBtn) {
          submitBtn.click();
        }
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="modal" style={width ? { maxWidth: width, width: '100%' } : undefined}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

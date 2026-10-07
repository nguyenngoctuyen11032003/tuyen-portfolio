import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-6 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`liquid-glass-strong relative rounded-3xl bg-[#131313] w-full max-h-full flex flex-col ${
          size === 'lg' ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 text-white/50 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
        {/* Scroll inside the glass frame so its gradient border stays pinned to the edges. */}
        <div className={`overflow-y-auto overscroll-contain ${size === 'lg' ? 'p-5 md:p-8' : 'p-8 md:p-10'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

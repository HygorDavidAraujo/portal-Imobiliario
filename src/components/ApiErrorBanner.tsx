import React from 'react';
import { XCircle, X as XIcon } from 'lucide-react';

type Props = {
  message: string;
  onClose?: () => void;
  className?: string;
};

export const ApiErrorBanner: React.FC<Props> = ({ message, onClose, className = '' }) => {
  return (
    <div
      role="alert"
      className={`bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 flex items-start gap-3 ${className}`}
    >
      <XCircle className="mt-0.5 flex-shrink-0" size={18} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">Ocorreu um problema</div>
        <div className="text-sm whitespace-pre-wrap break-words">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="p-1 rounded hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50"
        >
          <XIcon size={18} />
        </button>
      )}
    </div>
  );
};

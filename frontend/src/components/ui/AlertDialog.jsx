import Dialog from './Dialog';
import { AlertTriangle } from 'lucide-react';

export default function AlertDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Delete'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-rose-600" />
        </div>
        <p className="text-sm text-gray-600">
          {message || 'This action cannot be undone. Are you sure you want to proceed?'}
        </p>
      </div>
    </Dialog>
  );
}

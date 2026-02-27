import { Fragment } from 'react';
import { Dialog as HDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Dialog({ isOpen, onClose, title, size = 'md', children, footer }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HDialog.Panel
                className={`w-full ${sizeMap[size]} bg-white rounded-card shadow-dropdown overflow-hidden`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cp-border">
                  <HDialog.Title className="text-lg font-heading font-bold text-gray-900">
                    {title}
                  </HDialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-3 border-t border-cp-border bg-gray-50 flex items-center justify-end gap-3">
                    {footer}
                  </div>
                )}
              </HDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HDialog>
    </Transition>
  );
}

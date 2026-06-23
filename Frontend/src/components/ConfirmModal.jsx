// src/components/ConfirmModal.jsx
import React from 'react';

export default function ConfirmModal({ isOpen, title, message, type = 'warning', onConfirm, onCancel }) {
  if (!isOpen) return null;

  const iconClasses = {
    warning: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-500 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400',
  };

  const iconName = {
    warning: 'fa-exclamation-triangle',
    danger: 'fa-trash-alt',
    info: 'fa-info-circle',
  };

  const btnClasses = {
    warning: 'bg-primary hover:bg-red-700 shadow-red-500/20 hover:shadow-red-500/30',
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/20 hover:shadow-red-500/30',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden border border-gray-100 dark:border-slate-700 animate-scale-up transform transition-all duration-300">
        
        {/* Bouncing Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner mx-auto animate-bounce ${iconClasses[type] || iconClasses.warning}`}>
          <i className={`fas ${iconName[type] || iconName.warning}`} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          {title || 'Xác nhận'}
        </h3>

        {/* Message */}
        <div className="text-sm text-gray-500 dark:text-slate-300 text-center mb-6 leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 transition-colors text-center cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={onConfirm}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white text-center shadow-lg transition-all cursor-pointer ${btnClasses[type] || btnClasses.warning}`}
          >
            Xác Nhận
          </button>
        </div>
      </div>
    </div>
  );
}

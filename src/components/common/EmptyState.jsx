import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({ icon: Icon = AlertCircle, title, description, actionText, onAction }) {
  return (
    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-800/30">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

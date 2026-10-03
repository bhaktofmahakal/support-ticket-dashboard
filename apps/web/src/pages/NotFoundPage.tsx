import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 - Page Not Found | SupportDesk';
  }, []);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto my-12">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 font-mono font-bold text-xl">
        404
      </div>
      <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2">
        The requested page does not exist or may have been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

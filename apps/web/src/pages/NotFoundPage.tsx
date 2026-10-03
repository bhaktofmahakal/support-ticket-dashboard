import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 - Page Not Found | SupportDesk';
  }, []);
  return (
    <div className="bg-surface rounded-lg border border-border p-12 text-center max-w-lg mx-auto my-12">
      <div className="w-16 h-16 bg-surface-raised text-text-muted rounded-xl border border-border flex items-center justify-center mx-auto mb-4 font-mono font-semibold text-xl">
        404
      </div>
      <h1 className="text-xl font-semibold text-text-primary">Page Not Found</h1>
      <p className="text-sm text-text-muted mt-2">
        The requested page does not exist or may have been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

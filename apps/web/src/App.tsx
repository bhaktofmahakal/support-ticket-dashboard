import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

// Global query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
          <Header />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tickets" element={<Navigate to="/" replace />} />
              {/* Placeholders for Phase 5 */}
              <Route
                path="/tickets/new"
                element={
                  <div className="p-8 text-center text-slate-500">
                    Create Ticket Form (Phase 5)
                  </div>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <div className="p-8 text-center text-slate-500">
                    Ticket Detail View (Phase 5)
                  </div>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

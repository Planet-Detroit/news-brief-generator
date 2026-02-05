'use client';

import CurationPanel from '@/components/CurationPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              News Brief Generator
            </h1>
            <p className="text-sm text-gray-600">
              Weekly news curation for Planet Detroit
            </p>
          </div>
          <a
            href="https://planetdetroit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Planet Detroit →
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full overflow-hidden flex flex-col">
            <CurationPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2">
        <p className="text-center text-xs text-gray-600">
          Built for Planet Detroit • Content should be reviewed before publishing
        </p>
      </footer>
    </div>
  );
}

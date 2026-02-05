'use client';

import { useState } from 'react';
import CurationPanel from '@/components/CurationPanel';

export default function Home() {
  const [showAbout, setShowAbout] = useState(false);

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <span>ℹ️</span>
              <span>{showAbout ? 'Hide' : 'About'}</span>
            </button>
            <a
              href="https://planetdetroit.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Planet Detroit →
            </a>
          </div>
        </div>

        {/* About Section */}
        {showAbout && (
          <div className="max-w-7xl mx-auto mt-4 p-4 bg-[#e8f4fa] border border-[#b3d4e8] rounded-lg">
            <h2 className="font-semibold text-gray-900 mb-3">How it works:</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>
                <span className="font-medium">1. Paste</span> — Open the{' '}
                <a
                  href="https://gemini.google.com/gem/1k53wHUaIr5cMHEpNkwaX_GwbNblNEacs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2982c4] hover:underline"
                >
                  Planet Detroit News Curator Gem
                </a>{' '}
                in Gemini, type the command: &quot;run&quot;, then paste the output into the tool
              </li>
              <li>
                <span className="font-medium">2. Review</span> — Drag to reorder stories, delete any you don&apos;t want, and add additional articles by URL (or paste text for paywalled content)
              </li>
              <li>
                <span className="font-medium">3. SEO</span> — AI generates headline suggestions in sentence case and meta descriptions. Pick one or customize.
              </li>
              <li>
                <span className="font-medium">4. Image</span> — Search iStock for a featured image. The tool auto-generates alt text and captions.
              </li>
              <li>
                <span className="font-medium">5. Publish</span> — Creates a WordPress draft with everything in one click (headline, content, SEO fields, featured image, and the Newspack subtitle)
              </li>
              <li>
                <span className="font-medium">6. Newsletter</span> — Copy the formatted text for ActiveCampaign. It includes a &quot;Learn more&quot; link to the published WordPress post.
              </li>
            </ol>
          </div>
        )}
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

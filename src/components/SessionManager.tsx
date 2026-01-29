'use client';

import { useState, useEffect, useCallback } from 'react';

interface SiteSession {
  key: string;
  name: string;
  domains: string[];
  hasSession: boolean;
  isCustom: boolean;
}

export default function SessionManager() {
  const [sites, setSites] = useState<SiteSession[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for adding custom sites
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [newSiteLoginUrl, setNewSiteLoginUrl] = useState('');
  const [addingCustomSite, setAddingCustomSite] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        setSites(data.sites);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchSessions();
  }, [fetchSessions]);

  // Prevent hydration mismatch by not rendering until mounted on client
  if (!mounted) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  const handleLogin = async (siteKey: string) => {
    setActionInProgress(siteKey);
    setMessage(null);

    try {
      const response = await fetch('/api/sessions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteKey }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.message || 'Login failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open login window' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLogout = async (siteKey: string) => {
    setActionInProgress(siteKey);
    setMessage(null);

    try {
      const response = await fetch('/api/sessions/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteKey }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Logout failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear session' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddCustomSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCustomSite(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sessions/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSiteName,
          domain: newSiteDomain,
          loginUrl: newSiteLoginUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setNewSiteName('');
        setNewSiteDomain('');
        setNewSiteLoginUrl('');
        setShowAddForm(false);
        await fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add site' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add custom site' });
    } finally {
      setAddingCustomSite(false);
    }
  };

  const handleRemoveCustomSite = async (siteKey: string) => {
    if (!confirm('Are you sure you want to remove this custom site?')) {
      return;
    }

    setActionInProgress(siteKey);
    setMessage(null);

    try {
      const response = await fetch('/api/sessions/custom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: siteKey }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchSessions();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove site' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove custom site' });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  const builtInSites = sites.filter((s) => !s.isCustom);
  const customSites = sites.filter((s) => s.isCustom);

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Paywalled Site Logins
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Log in once to each site. Your session will be saved for future use.
      </p>

      {message && (
        <div
          className={`mb-3 p-2 rounded text-xs ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Built-in Sites */}
      <div className="space-y-2 mb-4">
        {builtInSites.map((site) => (
          <div
            key={site.key}
            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {site.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {site.domains.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {site.hasSession ? (
                <>
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Logged in
                  </span>
                  <button
                    onClick={() => handleLogout(site.key)}
                    disabled={actionInProgress !== null}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    {actionInProgress === site.key ? '...' : 'Logout'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleLogin(site.key)}
                  disabled={actionInProgress !== null}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionInProgress === site.key ? 'Opening...' : 'Login'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Sites Section */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-700">Custom Sites</h4>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showAddForm ? '✕ Cancel' : '+ Add Site'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCustomSite} className="mb-3 p-3 bg-white rounded border border-blue-200">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g., Wall Street Journal"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  placeholder="e.g., wsj.com"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Login URL
                </label>
                <input
                  type="url"
                  value={newSiteLoginUrl}
                  onChange={(e) => setNewSiteLoginUrl(e.target.value)}
                  placeholder="e.g., https://wsj.com/login"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingCustomSite}
                className="w-full px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {addingCustomSite ? 'Adding...' : 'Add Site'}
              </button>
            </div>
          </form>
        )}

        {customSites.length > 0 ? (
          <div className="space-y-2">
            {customSites.map((site) => (
              <div
                key={site.key}
                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {site.name}
                    <span className="ml-1 text-xs text-gray-400">(custom)</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {site.domains.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {site.hasSession ? (
                    <>
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Logged in
                      </span>
                      <button
                        onClick={() => handleLogout(site.key)}
                        disabled={actionInProgress !== null}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        {actionInProgress === site.key ? '...' : 'Logout'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleLogin(site.key)}
                      disabled={actionInProgress !== null}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionInProgress === site.key ? 'Opening...' : 'Login'}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveCustomSite(site.key)}
                    disabled={actionInProgress !== null}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Remove custom site"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showAddForm && (
            <p className="text-xs text-gray-500 italic">
              No custom sites added yet.
            </p>
          )
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        A browser window will open for you to log in manually.
        Sessions are saved locally in <code className="bg-gray-200 px-1 rounded">.sessions/</code>
      </p>
    </div>
  );
}

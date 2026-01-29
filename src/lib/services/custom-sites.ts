import * as fs from 'fs';
import * as path from 'path';

// Directory to store custom site configurations
const CUSTOM_SITES_FILE = path.join(process.cwd(), '.sessions', 'custom-sites.json');

export interface CustomSiteConfig {
  name: string;
  domains: string[];
  loginUrl: string;
  // For custom sites, we use generic selectors
}

export interface CustomSitesData {
  sites: Record<string, CustomSiteConfig>;
}

// Ensure the .sessions directory exists
function ensureDir() {
  const dir = path.dirname(CUSTOM_SITES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load custom sites from file
export function loadCustomSites(): Record<string, CustomSiteConfig> {
  ensureDir();

  if (!fs.existsSync(CUSTOM_SITES_FILE)) {
    return {};
  }

  try {
    const data = fs.readFileSync(CUSTOM_SITES_FILE, 'utf-8');
    const parsed: CustomSitesData = JSON.parse(data);
    return parsed.sites || {};
  } catch (error) {
    console.error('Failed to load custom sites:', error);
    return {};
  }
}

// Save custom sites to file
function saveCustomSites(sites: Record<string, CustomSiteConfig>): void {
  ensureDir();

  const data: CustomSitesData = { sites };
  fs.writeFileSync(CUSTOM_SITES_FILE, JSON.stringify(data, null, 2));
}

// Generate a unique key from the domain
function generateSiteKey(domain: string): string {
  // Remove common prefixes and convert to a simple key
  const cleaned = domain
    .replace('www.', '')
    .replace(/\.(com|org|net|co\.uk|io|biz)$/i, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();

  return `custom-${cleaned}`;
}

// Add a new custom site
export function addCustomSite(
  name: string,
  domain: string,
  loginUrl: string
): { success: boolean; key?: string; error?: string } {
  try {
    // Validate inputs
    if (!name || !domain || !loginUrl) {
      return { success: false, error: 'Name, domain, and login URL are required' };
    }

    // Clean domain (remove protocol and www)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase();

    // Validate login URL
    try {
      new URL(loginUrl);
    } catch {
      return { success: false, error: 'Invalid login URL format' };
    }

    const key = generateSiteKey(cleanDomain);
    const sites = loadCustomSites();

    // Check if domain already exists
    for (const existing of Object.values(sites)) {
      if (existing.domains.includes(cleanDomain)) {
        return { success: false, error: `A site with domain "${cleanDomain}" already exists` };
      }
    }

    // Add the new site
    sites[key] = {
      name,
      domains: [cleanDomain],
      loginUrl,
    };

    saveCustomSites(sites);

    return { success: true, key };
  } catch (error) {
    console.error('Failed to add custom site:', error);
    return { success: false, error: 'Failed to save custom site' };
  }
}

// Remove a custom site
export function removeCustomSite(key: string): { success: boolean; error?: string } {
  try {
    const sites = loadCustomSites();

    if (!sites[key]) {
      return { success: false, error: 'Site not found' };
    }

    delete sites[key];
    saveCustomSites(sites);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove custom site:', error);
    return { success: false, error: 'Failed to remove custom site' };
  }
}

// Get all custom sites
export function getCustomSites(): Array<{ key: string; name: string; domains: string[]; loginUrl: string }> {
  const sites = loadCustomSites();
  return Object.entries(sites).map(([key, config]) => ({
    key,
    name: config.name,
    domains: config.domains,
    loginUrl: config.loginUrl,
  }));
}

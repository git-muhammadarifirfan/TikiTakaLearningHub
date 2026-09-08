import { ApiResponse } from '../types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

class ApiClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 300000; // 5 Menit Cache TTL

  async request<T>(action: string, data?: any, options?: { skipCache?: boolean }): Promise<T> {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
      throw new Error('Google Apps Script URL belum dikonfigurasi di file .env');
    }

    const cacheKey = `${action}_${JSON.stringify(data || {})}`;

    // 1. Read from In-Memory or LocalStorage Cache for GET-type requests (unless skipCache is set)
    const isGet = action.includes('/list') || action.includes('/get') || action.includes('/stats');
    if (isGet && !options?.skipCache) {
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < this.CACHE_TTL) {
          return cached.data as T;
        }
      } else {
        const lsData = localStorage.getItem(`tikatrack_cache_${cacheKey}`);
        if (lsData) {
          try {
            const parsed = JSON.parse(lsData);
            if (Date.now() - parsed.timestamp < this.CACHE_TTL) {
              this.cache.set(cacheKey, parsed);
              return parsed.data as T;
            }
          } catch (e) {}
        }
      }
    }

    const token = localStorage.getItem('tikatrack_token') || '';
    const payload = {
      action,
      token,
      spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '',
      data,
    };

    const isMutation =
      !action.includes('/list') &&
      !action.includes('/get') &&
      !action.includes('/stats') &&
      !action.includes('/today') &&
      !action.includes('/history') &&
      !action.startsWith('auth/');

    // Note: All request mutations (create, update, delete) are directly awaited via fetch below
    // to guarantee Google Apps Script writes to Google Sheets and returns true verification.

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Terjadi kesalahan pada sistem backend');
      }

      // Invalidate cache if mutation succeeded
      if (isMutation) {
        this.invalidateCache();
      }

      // Store in Cache if successful GET-type list request
      if (action.includes('/list') || action.includes('/get') || action.includes('/stats')) {
        const cacheEntry = { data: result.data, timestamp: Date.now() };
        this.cache.set(cacheKey, cacheEntry);
        localStorage.setItem(`tikatrack_cache_${cacheKey}`, JSON.stringify(cacheEntry));
      }

      return result.data;
    } catch (error: any) {
      console.error(`[API Error] Action: ${action}`, error);
      
      // Fallback to stale cache if network fails or slow
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!.data as T;
      }
      throw new Error(error.message || 'Gagal terhubung ke server Google Apps Script');
    }
  }

  // Synchronously get cached data if available without waiting
  getCached<T>(action: string, data?: any): T | null {
    const cacheKey = `${action}_${JSON.stringify(data || {})}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.data as T;
    }
    const lsData = localStorage.getItem(`tikatrack_cache_${cacheKey}`);
    if (lsData) {
      try {
        const parsed = JSON.parse(lsData);
        this.cache.set(cacheKey, parsed);
        return parsed.data as T;
      } catch (e) {}
    }
    return null;
  }

  // Clear cache manually when writing data (create/update/delete)
  invalidateCache() {
    this.cache.clear();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('tikatrack_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const api = new ApiClient();


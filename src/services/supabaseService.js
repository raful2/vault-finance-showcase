/**
 * Supabase Cloud Sync Service
 * Seamlessly interfaces with Supabase REST API and Auth
 */

export class SupabaseService {
  constructor(url = '', key = '') {
    this.url = (url || '').replace(/\/+$/, '');
    this.key = key || '';
    this.currentUser = null;
  }

  isConfigured() {
    return Boolean(this.url && this.key);
  }

  getHeaders(token = null) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Authorization': `Bearer ${token || this.key}`
    };
    return headers;
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'Supabase URL or API Key is missing.' };
    }

    try {
      const response = await fetch(`${this.url}/rest/v1/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (response.ok || response.status < 500) {
        return { success: true, message: 'Successfully connected to Supabase endpoint!' };
      } else {
        return { success: false, message: `Server returned status: ${response.status} ${response.statusText}` };
      }
    } catch (err) {
      return { success: false, message: `Network error: ${err.message}` };
    }
  }

  /**
   * Upload local state to Supabase tables
   */
  async syncToCloud(state) {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured yet');
    }

    // Call server helper or direct REST
    const response = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });

    return response.ok;
  }
}

export const supabaseService = new SupabaseService();

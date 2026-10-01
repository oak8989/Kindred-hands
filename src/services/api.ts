const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  body?: string;
}

class ApiService {
  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async setPassword(newPassword: string) {
    return this.request('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getEvents() {
    return this.request('/events');
  }

  async createEvent(eventData: Record<string, any>) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async registerForEvent(eventId: string) {
    return this.request('/registrations', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  }

  async checkIn(eventId: string, method: string = 'walkin') {
    return this.request('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ eventId, method }),
    });
  }
}

export const api = new ApiService();

const API_BASE = '/api/admin';

class ApiClient {
    async request(endpoint, options = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth
    async login(password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
    }

    async logout() {
        return this.request('/logout', { method: 'POST' });
    }

    async checkAuth() {
        return this.request('/auth-status');
    }

    // Buses
    async getBuses() {
        return this.request('/buses');
    }

    async createBus(busData) {
        return this.request('/buses', {
            method: 'POST',
            body: JSON.stringify(busData)
        });
    }

    async updateBus(id, updates) {
        return this.request(`/buses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteBus(id) {
        return this.request(`/buses/${id}`, { method: 'DELETE' });
    }

    // Schedules
    async getSchedules(busId = null) {
        const query = busId ? `?busId=${busId}` : '';
        return this.request(`/schedules${query}`);
    }

    async createSchedule(scheduleData) {
        return this.request('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    async updateSchedule(id, updates) {
        return this.request(`/schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteSchedule(id) {
        return this.request(`/schedules/${id}`, { method: 'DELETE' });
    }

    // Sessions
    async getSessions() {
        return this.request('/sessions');
    }

    async getSession(busId) {
        return this.request(`/sessions/${busId}`);
    }

    async closeSession(busId) {
        return this.request(`/sessions/${busId}/close`, { method: 'POST' });
    }
}

export default new ApiClient();

// =============================================
// Database API Handler
// =============================================

const API_BASE = '/api';

const Database = {
    // =============================================
    // Health Check
    // =============================================
    health: async () => {
        try {
            const response = await fetch('/health');
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', error: error.message };
        }
    },

    // =============================================
    // Projects API
    // =============================================
    projects: {
        getAll: async () => {
            try {
                const response = await fetch(`${API_BASE}/projects`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching projects:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // =============================================
    // Developers API
    // =============================================
    developers: {
        getAll: async () => {
            try {
                const response = await fetch(`${API_BASE}/developers`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching developers:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // =============================================
    // Bugs API
    // =============================================
    bugs: {
        getAll: async (filters = {}) => {
            try {
                const params = new URLSearchParams();

                if (filters.search) params.append('search', filters.search);
                if (filters.projectId) params.append('projectId', filters.projectId);
                if (filters.status) params.append('status', filters.status);
                if (filters.priority) params.append('priority', filters.priority);
                if (filters.developerId) params.append('developerId', filters.developerId);
                if (filters.page) params.append('page', filters.page);
                if (filters.pageSize) params.append('pageSize', filters.pageSize);

                const response = await fetch(`${API_BASE}/bugs?${params}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching bugs:', error);
                return { success: false, error: error.message };
            }
        },

        getById: async (id) => {
            try {
                const response = await fetch(`${API_BASE}/bugs/${id}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching bug:', error);
                return { success: false, error: error.message };
            }
        },

        create: async (data) => {
            try {
                const response = await fetch(`${API_BASE}/bugs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Error creating bug:', error);
                return { success: false, error: error.message };
            }
        },

        update: async (id, data) => {
            try {
                const response = await fetch(`${API_BASE}/bugs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await response.json();
            } catch (error) {
                console.error('Error updating bug:', error);
                return { success: false, error: error.message };
            }
        },

        delete: async (id) => {
            try {
                const response = await fetch(`${API_BASE}/bugs/${id}`, {
                    method: 'DELETE'
                });
                return await response.json();
            } catch (error) {
                console.error('Error deleting bug:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // =============================================
    // Dashboard API
    // =============================================
    dashboard: {
        getOverview: async () => {
            try {
                const response = await fetch(`${API_BASE}/dashboard/overview`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching dashboard overview:', error);
                return { success: false, error: error.message };
            }
        },

        getStats: async (period = 'week') => {
            try {
                const response = await fetch(`${API_BASE}/dashboard/stats?period=${period}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                return { success: false, error: error.message };
            }
        },

        getRecent: async (limit = 10) => {
            try {
                const response = await fetch(`${API_BASE}/dashboard/recent?limit=${limit}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching recent bugs:', error);
                return { success: false, error: error.message };
            }
        },

        getCritical: async () => {
            try {
                const response = await fetch(`${API_BASE}/dashboard/critical`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching critical bugs:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // =============================================
    // Reports API
    // =============================================
    reports: {
        getDaily: async (date) => {
            try {
                const params = date ? `?date=${date}` : '';
                const response = await fetch(`${API_BASE}/reports/daily${params}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching daily report:', error);
                return { success: false, error: error.message };
            }
        }
    },

    // =============================================
    // Comments API
    // =============================================
    comments: {
        add: async (bugId, developerId, content) => {
            try {
                const response = await fetch(`${API_BASE}/bugs/${bugId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ developerId, content })
                });
                return await response.json();
            } catch (error) {
                console.error('Error adding comment:', error);
                return { success: false, error: error.message };
            }
        }
    }
};

// Log API availability
console.log('📡 Database API module loaded');
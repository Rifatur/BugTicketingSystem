// Database API Handler for ASP.NET Core Backend
const API_BASE = '/api';

const Database = {
    // Bugs API
    bugs: {
        getAll: async (filters = {}) => {
            const params = new URLSearchParams();
            
            if (filters.search) params.append('search', filters.search);
            if (filters.project_id) params.append('projectId', filters.project_id);
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.developer_id) params.append('developerId', filters.developer_id);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('pageSize', filters.limit);
            
            const response = await fetch(`${API_BASE}/bugs?${params}`);
            return response.json();
        },
        
        getById: async (id) => {
            const response = await fetch(`${API_BASE}/bugs/${id}`);
            return response.json();
        },
        
        getByTicketId: async (ticketId) => {
            const response = await fetch(`${API_BASE}/bugs/ticket/${ticketId}`);
            return response.json();
        },
        
        create: async (data) => {
            const response = await fetch(`${API_BASE}/bugs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: data.project_id,
                    moduleId: data.module_id || null,
                    title: data.title,
                    description: data.description,
                    stepsToReproduce: data.steps_to_reproduce,
                    expectedResult: data.expected_result,
                    actualResult: data.actual_result,
                    priority: data.priority,
                    severity: data.severity,
                    assignedDeveloperId: data.assigned_developer_id || null,
                    reportedById: data.reported_by || null,
                    estimatedFixHours: data.estimated_fix_hours || null,
                    deadline: data.deadline || null,
                    environment: data.environment,
                    browser: data.browser,
                    os: data.os
                })
            });
            return response.json();
        },
        
        update: async (data) => {
            const response = await fetch(`${API_BASE}/bugs/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    stepsToReproduce: data.steps_to_reproduce,
                    expectedResult: data.expected_result,
                    actualResult: data.actual_result,
                    priority: data.priority,
                    severity: data.severity,
                    status: data.status,
                    assignedDeveloperId: data.assigned_developer_id,
                    moduleId: data.module_id,
                    estimatedFixHours: data.estimated_fix_hours,
                    deadline: data.deadline,
                    environment: data.environment,
                    browser: data.browser,
                    os: data.os,
                    updatedById: data.updated_by
                })
            });
            return response.json();
        },
        
        delete: async (id) => {
            const response = await fetch(`${API_BASE}/bugs/${id}`, {
                method: 'DELETE'
            });
            return response.json();
        }
    },
    
    // Dashboard API
    dashboard: {
        getOverview: async () => {
            const response = await fetch(`${API_BASE}/dashboard/overview`);
            return response.json();
        },
        
        getStats: async (period = 'week') => {
            const response = await fetch(`${API_BASE}/dashboard/stats?period=${period}`);
            return response.json();
        },
        
        getRecent: async (limit = 10) => {
            const response = await fetch(`${API_BASE}/dashboard/recent?limit=${limit}`);
            return response.json();
        },
        
        getCritical: async () => {
            const response = await fetch(`${API_BASE}/dashboard/critical`);
            return response.json();
        }
    },
    
    // Reports API
    reports: {
        getDaily: async (date) => {
            const response = await fetch(`${API_BASE}/reports/daily?date=${date}`);
            return response.json();
        },
        
        getWeekly: async (endDate) => {
            const response = await fetch(`${API_BASE}/reports/weekly?endDate=${endDate}`);
            return response.json();
        },
        
        getMonthly: async (month) => {
            const [year, monthNum] = month.split('-');
            const response = await fetch(`${API_BASE}/reports/monthly?year=${year}&month=${monthNum}`);
            return response.json();
        }
    },
    
    // Projects API
    projects: {
        getAll: async () => {
            const response = await fetch(`${API_BASE}/projects`);
            return response.json();
        },
        
        getById: async (id) => {
            const response = await fetch(`${API_BASE}/projects/${id}`);
            return response.json();
        },
        
        create: async (data) => {
            const response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.json();
        },
        
        createModule: async (projectId, name) => {
            const response = await fetch(`${API_BASE}/projects/${projectId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, name })
            });
            return response.json();
        }
    },
    
    // Developers API
    developers: {
        getAll: async () => {
            const response = await fetch(`${API_BASE}/developers`);
            return response.json();
        },
        
        getById: async (id) => {
            const response = await fetch(`${API_BASE}/developers/${id}`);
            return response.json();
        },
        
        getBugs: async (id, status = null) => {
            const params = status ? `?status=${status}` : '';
            const response = await fetch(`${API_BASE}/developers/${id}/bugs${params}`);
            return response.json();
        }
    },
    
    // Comments API
    comments: {
        getByBugId: async (bugId) => {
            const response = await fetch(`${API_BASE}/bugs/${bugId}/comments`);
            return response.json();
        },
        
        add: async (bugId, developerId, content) => {
            const response = await fetch(`${API_BASE}/bugs/${bugId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ developerId, content })
            });
            return response.json();
        },
        
        delete: async (bugId, commentId) => {
            const response = await fetch(`${API_BASE}/bugs/${bugId}/comments/${commentId}`, {
                method: 'DELETE'
            });
            return response.json();
        }
    },
    
    // Notifications API
    notifications: {
        getByDeveloper: async (developerId, unreadOnly = false) => {
            const response = await fetch(`${API_BASE}/notifications/developer/${developerId}?unreadOnly=${unreadOnly}`);
            return response.json();
        },
        
        markAsRead: async (id) => {
            const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'PUT'
            });
            return response.json();
        },
        
        markAllAsRead: async (developerId) => {
            const response = await fetch(`${API_BASE}/notifications/developer/${developerId}/read-all`, {
                method: 'PUT'
            });
            return response.json();
        }
    },
    
    // Attachments API
    attachments: {
        getByBugId: async (bugId) => {
            const response = await fetch(`${API_BASE}/bugs/${bugId}/attachments`);
            return response.json();
        },
        
        upload: async (bugId, file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE}/bugs/${bugId}/attachments`, {
                method: 'POST',
                body: formData
            });
            return response.json();
        },
        
        delete: async (bugId, attachmentId) => {
            const response = await fetch(`${API_BASE}/bugs/${bugId}/attachments/${attachmentId}`, {
                method: 'DELETE'
            });
            return response.json();
        }
    },
    
    // Health Check
    health: async () => {
        const response = await fetch(`${API_BASE}/health`);
        return response.json();
    }
};

// Check API availability on load
(async () => {
    try {
        const health = await Database.health();
        console.log('API Status:', health);
    } catch (error) {
        console.warn('API not available, falling back to local storage mode');
    }
})();
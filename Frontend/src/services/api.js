import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('pms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle 401 errors and network errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors (server not reachable)
        if (!error.response) {
            console.error('[API] Network Error:', {
                message: error.message,
                code: error.code,
                baseURL: apiClient.defaults.baseURL,
                url: error.config?.url
            });
            
            // Provide helpful error message
            error.userMessage = `Cannot connect to backend server at ${apiClient.defaults.baseURL}. Please ensure the backend is running.`;
        }
        
        if (error.response?.status === 401) {
            localStorage.removeItem('pms_token');
            localStorage.removeItem('pms_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const api = {
    meta: {
        departments: async () => {
            const response = await apiClient.get('/departments');
            return response.data;
        },
        subDepartments: async (deptId) => {
            const response = await apiClient.get(`/sub-departments${deptId ? `?department_id=${deptId}` : ''}`);
            return response.data;
        },
        sprints: {
            list: async () => {
                const response = await apiClient.get('/sprints');
                return response.data;
            },
            get: async (id) => {
                const response = await apiClient.get(`/sprints/${id}`);
                return response.data;
            },
            create: async (data) => {
                const response = await apiClient.post('/sprints', data);
                return response.data;
            }
        }
    },
    users: {
        list: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        get: async (id) => {
            const response = await apiClient.get(`/users/${id}`);
            return response.data;
        },
        offboard: async (id) => {
            const response = await apiClient.post(`/users/${id}/offboard`);
            return response.data;
        },
        initiateExit: async (id) => {
            const response = await apiClient.post(`/users/${id}/exit`);
            return response.data;
        }
    },
    clients: {
        list: async () => {
            const response = await apiClient.get('/clients');
            return response.data || [];
        },
        create: async (name) => {
            if (!name || !name.trim()) {
                throw new Error('Client name is required');
            }
            const response = await apiClient.post('/clients', { name: name.trim() });
            // Backend returns client object directly: { id, name }
            return response.data;
        }
    },
    auth: {
        login: async (email, password) => {
            const response = await apiClient.post('/auth/login', { email, password });
            const { access_token, user } = response.data;
            localStorage.setItem('pms_token', access_token);
            localStorage.setItem('pms_user', JSON.stringify(user));
            return response.data;
        },
        logout: async () => {
            localStorage.removeItem('pms_token');
            localStorage.removeItem('pms_user');
            return true;
        },
        signup: async (name, email, password, role) => {
            const response = await apiClient.post('/auth/signup', { name, email, password, role });
            const { access_token, user } = response.data;
            localStorage.setItem('pms_token', access_token);
            localStorage.setItem('pms_user', JSON.stringify(user));
            return response.data;
        }
    },
    projects: {
        list: async () => {
            const response = await apiClient.get('/projects');
            return response.data;
        },
        create: async (data) => {
            const response = await apiClient.post('/projects', data);
            // Backend returns { project: {...}, pocs: [...], members: [...] }
            // Return the full response data so we can access project.id
            return response.data.project || response.data;
        },
        get: async (id) => {
            const response = await apiClient.get(`/projects/${id}`);
            return response.data;
        },
        addMember: async (projectId, userId) => {
            const response = await apiClient.post(`/projects/${projectId}/members`, { user_id: userId });
            return response.data;
        },
        removeMember: async (projectId, userId) => {
            const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
            return response.data;
        },
        responseSheets: async (projectId) => {
            const response = await apiClient.get(`/response-sheets?project_id=${projectId}`);
            return response.data.data;
        },
        update: async (id, data) => {
            const response = await apiClient.patch(`/projects/${id}`, data);
            return response.data;
        },
        delete: async (id) => {
            const response = await apiClient.delete(`/projects/${id}`);
            return response.data;
        },
        alerts: async (projectId) => {
            const response = await apiClient.get(`/projects/${projectId}/alerts`);
            return response.data;
        }
    },
    tickets: {
        list: async (filters = {}) => {
            if (filters.assigned_to === 'me') {
                const response = await apiClient.get('/tickets/assigned/me');
                return response.data;
            }
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.project_id) params.append('project_id', filters.project_id);
            if (filters.sprint_id) params.append('sprint_id', filters.sprint_id);

            const response = await apiClient.get(`/tickets?${params.toString()}`);
            return response.data;
        },
        get: async (id) => {
            const response = await apiClient.get(`/tickets/${id}`);
            return response.data;
        },
        create: async (data) => {
            const response = await apiClient.post('/tickets', data);
            return response.data;
        },
        iterations: async (id) => {
            const response = await apiClient.get(`/tickets/${id}/iterations`);
            return response.data;
        },
        comments: async (id) => {
            const response = await apiClient.get(`/tickets/${id}/comments`);
            return response.data;
        },
        addComment: async (id, userId, content) => {
            const response = await apiClient.post(`/tickets/${id}/comments`, { user_id: userId, content });
            return response.data;
        },
        uploadFile: async (data) => {
            const response = await apiClient.post('/files/upload', data);
            return response.data;
        },
        approve: async (id, approverId) => {
            const response = await apiClient.post(`/tickets/${id}/approve`, { approved_by: approverId });
            return response.data;
        },
        reject: async (id, approverId, reason) => {
            const response = await apiClient.post(`/tickets/${id}/reject`, { approved_by: approverId, reason });
            return response.data;
        },
        accept: async (id) => {
            // Move to IN_PROGRESS
            const response = await apiClient.patch(`/tickets/${id}/status`, { status: 'IN_PROGRESS' });
            return response.data;
        },
        updateStatus: async (id, status) => {
            const response = await apiClient.patch(`/tickets/${id}/status`, { status });
            return response.data;
        },
        assign: async (id, userId) => {
            const response = await apiClient.post(`/tickets/${id}/assign`, { user_id: userId });
            return response.data;
        },
        unassign: async (id) => {
            const response = await apiClient.post(`/tickets/${id}/unassign`);
            return response.data;
        },
        alerts: async (id) => {
            const response = await apiClient.get(`/tickets/${id}/alerts`);
            return response.data;
        }
    },
    files: {
        upload: async (formData) => {
            const response = await apiClient.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        },
        list: async (ticketId) => {
            const response = await apiClient.get(`/tickets/${ticketId}/files`);
            return response.data;
        },
        delete: async (id) => {
            const response = await apiClient.delete(`/files/${id}`);
            return response.data;
        }
    },
    responseSheets: {
        list: async (projectId) => {
            const params = projectId ? `?project_id=${projectId}` : '';
            const response = await apiClient.get(`/response-sheets${params}`);
            return response.data.data || response.data;
        },
        get: async (id) => {
            const response = await apiClient.get(`/response-sheets/${id}`);
            return response.data;
        },
        generate: async (projectId) => {
            const response = await apiClient.post('/response-sheets', { project_id: projectId });
            return response.data;
        },
        send: async (id, emailAddresses) => {
            const response = await apiClient.post(`/response-sheets/${id}/send`, { 
                recipients: Array.isArray(emailAddresses) ? emailAddresses : emailAddresses.split(',').map(e => e.trim())
            });
            return response.data;
        }
    },
    analytics: {
        overview: async () => {
            const [overviewRes, alertCountRes] = await Promise.all([
                apiClient.get('/analytics/overview'),
                apiClient.get('/alerts/count')
            ]);

            const data = overviewRes.data.data;
            const alertCount = alertCountRes.data.count;

            return {
                activeProjects: data.summary.total_projects,
                openTickets: data.summary.active_tickets,
                riskTickets: alertCount,
                avgResolution: `${data.resolution.avg_hours.toFixed(1)}h`,
                ftr: data.ftr.percentage,
                // Add raw data for detailed charts
                raw: data
            };
        },
        sprint: async (id) => {
            const response = await apiClient.get(`/analytics/sprints/${id}`);
            return response.data.data;
        },
        users: async () => {
            const response = await apiClient.get('/analytics/users');
            return response.data.data;
        },
        user: async (userId) => {
            const response = await apiClient.get(`/analytics/users/${userId}`);
            return response.data.data;
        }
    },
    alerts: {
        list: async (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.reason) params.append('reason', filters.reason);
            if (filters.project_id) params.append('project_id', filters.project_id);
            if (filters.ticket_id) params.append('ticket_id', filters.ticket_id);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);
            
            const response = await apiClient.get(`/alerts?${params.toString()}`);
            return response.data.map(alert => ({
                id: alert.id,
                type: alert.reason === 'SLA_BREACH' ? 'danger' : 'warning',
                title: alert.reason.replace('_', ' '),
                message: alert.ticket_title || `Alert on ticket ${alert.ticket_id}`,
                ...alert
            }));
        },
        statistics: async () => {
            const response = await apiClient.get('/alerts/statistics');
            return response.data;
        },
        recent: async (hours = 24) => {
            const response = await apiClient.get(`/alerts/recent?hours=${hours}`);
            return response.data;
        },
        count: async () => {
            const response = await apiClient.get('/alerts/count');
            return response.data.count;
        },
        scan: async () => {
            const response = await apiClient.post('/alerts/scan');
            return response.data;
        },
        resolve: async (ticketId) => {
            const response = await apiClient.post(`/tickets/${ticketId}/alerts/resolve`);
            return response.data;
        }
    },
    notifications: {
        getAll: async (userId) => {
            const response = await apiClient.get(`/notifications?user_id=${userId}`);
            return response.data.map(n => ({
                id: n.id,
                type: 'info', // generic
                title: n.title,
                message: n.message,
                time: new Date(n.created_at).toLocaleString(),
                read: n.is_read
            }));
        },
        markRead: async (id) => {
            const response = await apiClient.patch(`/notifications/${id}/read`);
            return response.data;
        },
        unreadCount: async (userId) => {
            const response = await apiClient.get(`/notifications/unread/count?user_id=${userId}`);
            return response.data.count;
        }
    }
};

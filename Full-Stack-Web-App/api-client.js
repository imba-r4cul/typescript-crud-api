const API_BASE_URL = 'http://localhost:4000';

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

function clearAuthToken() {
    localStorage.removeItem('auth_token');
}

async function apiRequest(path, options) {
    const opts = options || {};
    const headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
    };

    const token = getAuthToken();
    if (token) {
        headers.Authorization = 'Bearer ' + token;
    }

    const response = await fetch(API_BASE_URL + path, {
        ...opts,
        headers,
    });

    const data = await response.json().catch(function() {
        return null;
    });

    if (!response.ok) {
        const message = data && data.message ? data.message : 'Request failed';
        throw new Error(message);
    }

    return data;
}

window.apiClient = {
    health: function() {
        return apiRequest('/health', { method: 'GET' });
    },
    register: function(payload) {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    login: function(payload) {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    me: function() {
        return apiRequest('/auth/me', { method: 'GET' });
    },
    getUsers: function() {
        return apiRequest('/users', { method: 'GET' });
    },
    createUser: function(payload) {
        return apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    updateUser: function(id, payload) {
        return apiRequest('/users/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
    deleteUser: function(id) {
        return apiRequest('/users/' + id, { method: 'DELETE' });
    },
    getDepartments: function() {
        return apiRequest('/departments', { method: 'GET' });
    },
    createDepartment: function(payload) {
        return apiRequest('/departments', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    updateDepartment: function(id, payload) {
        return apiRequest('/departments/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
    deleteDepartment: function(id) {
        return apiRequest('/departments/' + id, { method: 'DELETE' });
    },
    getEmployees: function() {
        return apiRequest('/employees', { method: 'GET' });
    },
    createEmployee: function(payload) {
        return apiRequest('/employees', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    updateEmployee: function(id, payload) {
        return apiRequest('/employees/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
    deleteEmployee: function(id) {
        return apiRequest('/employees/' + id, { method: 'DELETE' });
    },
    getRequests: function() {
        return apiRequest('/requests', { method: 'GET' });
    },
    createRequest: function(payload) {
        return apiRequest('/requests', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    setRequestStatus: function(id, status) {
        return apiRequest('/requests/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status: status }),
        });
    },
    setAuthToken,
    clearAuthToken,
};

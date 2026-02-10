/**
 * API Service - 后端接口封装
 * 对接后端API: http://localhost:31943/api
 */

const API_BASE = '/api';

// 通用请求封装
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // 未授权，跳转登录
      localStorage.removeItem('token');
      window.location.href = '/#/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============ Auth API ============
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    request<any>('/auth/me'),
};

// ============ Project API ============
export const projectApi = {
  list: () =>
    request<any[]>('/projects'),

  get: (id: string) =>
    request<any>(`/projects/${id}`),

  create: (data: any) =>
    request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getVersions: (projectId: string) =>
    request<any[]>(`/projects/${projectId}/versions`),

  getMembers: (projectId: string) =>
    request<any[]>(`/projects/${projectId}/members`),
};

// ============ Version API ============
export const versionApi = {
  get: (versionId: string) =>
    request<any>(`/versions/${versionId}`),

  create: (projectId: string, data: any) =>
    request<any>(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (versionId: string, data: any) =>
    request<any>(`/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============ LineItem API ============
export const lineItemApi = {
  list: (versionId: string, category: 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE') =>
    request<any[]>(`/versions/${versionId}/line-items?category=${category}`),

  create: (versionId: string, data: any) =>
    request<any>(`/versions/${versionId}/line-items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (itemId: string, data: any) =>
    request<any>(`/line-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  batchUpdate: (versionId: string, items: any[]) =>
    request<any>(`/versions/${versionId}/line-items/batch`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),

  delete: (itemId: string) =>
    request(`/line-items/${itemId}`, {
      method: 'DELETE',
    }),
};

// ============ Indicator API ============
export const indicatorApi = {
  list: (versionId: string) =>
    request<any[]>(`/versions/${versionId}/indicators`),

  trace: (versionId: string, indicatorKey: string) =>
    request<any>(`/versions/${versionId}/indicators/${indicatorKey}/trace`),

  recalculate: (versionId: string) =>
    request<any>(`/versions/${versionId}/indicators/recalculate`, {
      method: 'POST',
    }),
};

// ============ Template API ============
export const templateApi = {
  list: () =>
    request<any[]>('/templates'),

  get: (id: string) =>
    request<any>(`/templates/${id}`),
};

// ============ Workflow API ============
export const workflowApi = {
  list: () =>
    request<any[]>('/workflows'),

  get: (id: string) =>
    request<any>(`/workflows/${id}`),

  getVersionWorkflow: (versionId: string) =>
    request<any>(`/versions/${versionId}/workflow`),
};

// ============ Import/Export API ============
export const importExportApi = {
  exportExcel: async (versionId: string, category: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE}/versions/${versionId}/export?category=${category}`,
      {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      }
    );
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  importExcel: (versionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    
    return fetch(`${API_BASE}/versions/${versionId}/import`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Import failed');
      return res.json();
    });
  },
};

// ============ Utility Functions ============
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

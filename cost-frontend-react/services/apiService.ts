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
    if (result && typeof result === 'object' && 'code' in result && result.code !== 0) {
      throw new Error(result.message || '请求失败');
    }
    return result?.data ?? result;

  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============ Auth API ============
export const authApi = {
  login: (loginId: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; expiresIn: number; userInfo: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    }),

  sendPasswordResetCode: (email: string) =>
    request('/auth/password/email-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPasswordByEmail: (data: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    request<any>('/auth/me'),

  updateProfile: (data: { email?: string; phone?: string }) =>
    request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============ Project API ============
export const projectApi = {
  list: (params?: { page?: number; size?: number; sort?: string }) => {
    const search = new URLSearchParams();
    if (params?.page !== undefined) search.set('page', String(params.page));
    if (params?.size !== undefined) search.set('size', String(params.size));
    if (params?.sort) search.set('sort', params.sort);
    const query = search.toString();
    return request<any>(`/projects${query ? `?${query}` : ''}`);
  },

  get: (id: string) =>
    request<any>(`/projects/${id}`),

  create: (data: any) =>
    request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, data: any) =>
    request<any>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  archive: (projectId: string) =>
    request<void>(`/projects/${projectId}/archive`, {
      method: 'POST',
    }),

  importFromExcel: async (project: any, file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'project',
      new Blob([JSON.stringify(project)], { type: 'application/json' })
    );
    const response = await fetch(`${API_BASE}/projects/import/excel`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.message || 'Excel导入失败');
    }
    if (result && typeof result === 'object' && 'code' in result && result.code !== 0) {
      throw new Error(result.message || 'Excel导入失败');
    }
    return result?.data ?? result;
  },

  getVersions: (projectId: string) =>
    request<any[]>(`/projects/${projectId}/versions`),

  getMembers: (projectId: string) =>
    request<any[]>(`/projects/${projectId}/members`),
  addMember: (
    projectId: string,
    data: {
      username?: string;
      userId?: number;
      projectRole?: string;
      dataScope?: string;
      permissions?: string[];
    }
  ) => {
    const permissionToRole = (permissions?: string[]) => {
      if (!permissions || permissions.length === 0) return 'VIEWER';
      if (permissions.includes('SEAL') || permissions.includes('VERSION_ISSUE')) return 'SEAL_ADMIN';
      if (permissions.includes('VERSION_REVIEW')) return 'APPROVER';
      if (permissions.includes('ITEM_WRITE') || permissions.includes('PROJ_WRITE')) return 'EDITOR';
      return 'VIEWER';
    };

    const payload = {
      username: data.username,
      userId: data.userId,
      projectRole: data.projectRole || permissionToRole(data.permissions),
      dataScope: data.dataScope || 'ALL',
    };
    return request<any>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 后端当前无独立“更新权限”接口，先走删除+新增兼容旧调用。
  updateMemberPermissions: async (projectId: string, userId: number, data: { permissions: string[] }) => {
    await request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
    return request<any>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        projectRole: data.permissions?.includes('ITEM_WRITE') ? 'EDITOR' : 'VIEWER',
        dataScope: 'ALL',
      }),
    });
  },

  removeMember: (projectId: string, userId: number) =>
    request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    }),

  getAuditLogs: (projectId: string, versionId?: string) =>
    request<any[]>(
      versionId
        ? `/audit/projects/${projectId}/audit-logs?versionId=${versionId}`
        : `/audit/projects/${projectId}/audit-logs`
    ),
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

  submit: (versionId: string) =>
    request<void>(`/versions/${versionId}/submit`, {
      method: 'POST',
    }),

  withdraw: (versionId: string) =>
    request<void>(`/versions/${versionId}/withdraw`, {
      method: 'POST',
    }),

  approve: (versionId: string) =>
    request<void>(`/versions/${versionId}/approve`, {
      method: 'POST',
    }),

  reject: (versionId: string) =>
    request<void>(`/versions/${versionId}/reject`, {
      method: 'POST',
    }),

  issue: (versionId: string) =>
    request<void>(`/versions/${versionId}/issue`, {
      method: 'POST',
    }),

  archive: (versionId: string) =>
    request<void>(`/versions/${versionId}/archive`, {
      method: 'POST',
    }),

  updateSealPosition: (versionId: string, data: { sealPosX: number; sealPosY: number }) =>
    request<any>(`/versions/${versionId}/seal-position`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};


// ============ LineItem API ============
const normalizeLineItem = (item: any) => {
  const quantity = Number(item?.quantity ?? 0);
  const unitPrice = Number(item?.unitPrice ?? 0);
  const totalAmount = Number(item?.totalAmount ?? quantity * unitPrice);
  const taxRate = Number(item?.taxRate ?? 0);
  const taxAmount = totalAmount * (taxRate / 100);
  const preTaxAmount = totalAmount - taxAmount;
  return {
    ...item,
    quantity,
    unitPrice,
    totalAmount,
    taxRate,
    taxAmount,
    preTaxAmount,
    remarks: item?.remarks ?? item?.remark ?? '',
  };
};

const toLineItemPayload = (item: any, index: number) => ({
  id: item?.id,
  itemName: item?.itemName ?? '',
  specification: item?.specification ?? '',
  unit: item?.unit ?? '',
  quantity: item?.quantity ?? 0,
  unitPrice: item?.unitPrice ?? 0,
  totalAmount: item?.totalAmount ?? 0,
  taxRate: item?.taxRate ?? 0,
  remark: item?.remarks ?? item?.remark ?? '',
  sortNo: item?.sortNo ?? index + 1,
  category: item?.category,
});

export const lineItemApi = {
  list: (versionId: string, module: 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE', category?: string) =>
    request<any[]>(`/versions/${versionId}/line-items?module=${module}${category ? `&category=${category}` : ''}`)
      .then(items => items.map(normalizeLineItem)),

  batchUpdate: (versionId: number, module: 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE', items: any[]) =>
    request<any>(`/versions/${versionId}/line-items/batch`, {
      method: 'POST',
      body: JSON.stringify({
        module,
        items: items.map(toLineItemPayload),
      }),
    }),

  delete: (versionId: number, itemId: number) =>
    request(`/versions/${versionId}/line-items/${itemId}`, {
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
    request<any>(`/versions/${versionId}/recalc`, {
      method: 'POST',
    }),
};

// ============ Template API ============
export const templateApi = {
  list: (status?: string) =>
    request<any[]>(`/templates${status ? `?status=${status}` : ''}`),

  listPublished: () =>
    request<any[]>('/templates/published'),

  get: (id: string | number) =>
    request<any>(`/templates/${id}`),

  create: (data: { name: string; templateVersion: string; schemaJson: string }) =>
    request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string | number, data: { name: string; templateVersion: string; schemaJson: string }) =>
    request<any>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  publish: (id: string | number) =>
    request<any>(`/templates/${id}/publish`, {
      method: 'POST',
    }),

  disable: (id: string | number) =>
    request<any>(`/templates/${id}/disable`, {
      method: 'POST',
    }),
};


// ============ Workflow API ============
export const workflowApi = {
  list: () =>
    request<any[]>('/workflows'),

  get: (id: string) =>
    request<any>(`/workflows/${id}`),

  getVersionWorkflow: (versionId: string) =>
    request<any>(`/workflow/versions/${versionId}`),

  getActiveDefinition: (projectId?: string) =>
    request<any>(`/workflow/definitions/active${projectId ? `?projectId=${projectId}` : ''}`),

  saveSystemDefinition: (data: { name: string; nodes: any[] }) =>
    request<any>(`/workflow/definitions/active`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  saveProjectDefinition: (projectId: string | number, data: { name: string; nodes: any[] }) =>
    request<any>(`/workflow/definitions/active/project?projectId=${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMyTasks: () =>
    request<any[]>('/workflow/my-tasks'),

  approveTask: (versionId: string, taskId: number, comment?: string) =>
    request<any>(`/workflow/versions/${versionId}/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment: comment || '' }),
    }),

  rejectTask: (versionId: string, taskId: number, comment: string) =>
    request<any>(`/workflow/versions/${versionId}/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  transferTask: (versionId: string, taskId: number, targetUserId: number, comment?: string) =>
    request<any>(`/workflow/versions/${versionId}/tasks/${taskId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({
        targetUserId,
        comment: comment || '',
      }),
    }),
};

// ============ Import/Export API ============
export const fileApi = {
  exportExcel: (versionId: number) =>
    request<any>(`/versions/${versionId}/export/excel`),

  exportPdf: (versionId: number) =>
    request<any>(`/versions/${versionId}/export/pdf`),

  sealVersion: (versionId: number) =>
    request<any>(`/versions/${versionId}/seal`, {
      method: 'POST',
    }),

  listVersionFiles: (versionId: number) =>
    request<any[]>(`/versions/${versionId}/files`),

  listSealRecords: (versionId: number) =>
    request<any[]>(`/versions/${versionId}/seal-records`),

  downloadFile: async (fileId: number) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('下载失败');
    const contentDisposition = response.headers.get('content-disposition') || '';
    let filename = '';
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      filename = decodeURIComponent(utf8Match[1]);
    } else {
      const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (asciiMatch && asciiMatch[1]) {
        filename = asciiMatch[1];
      }
    }
    const blob = await response.blob();
    return { blob, filename };
  },
};

export const importExportApi = {
  importExcel: (versionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    return fetch(`${API_BASE}/versions/${versionId}/import/excel`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error('导入失败');
      const result = await res.json().catch(() => ({}));
      if (result && typeof result === 'object' && 'code' in result && result.code !== 0) {
        throw new Error(result.message || '导入失败');
      }
      return result?.data ?? result;
    });
  },
};


// ============ Utility Functions ============
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
  window.dispatchEvent(new Event('auth-changed'));
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth-changed'));
};


export const getAuthToken = () => {
  return localStorage.getItem('token');
};

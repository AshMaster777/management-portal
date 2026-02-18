const API = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || res.statusText);
  return res.json();
}

async function fetchFormData(path: string, formData: FormData, method = 'POST') {
  const res = await fetch(`${API}${path}`, {
    method,
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.statusText }))).error || res.statusText);
  return res.json();
}

async function verifyAdminPassword(password: string) {
  return fetchApi<{ success: boolean }>('/auth/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export const api = {
  verifyAdminPassword,
  categories: {
    list: () => fetchApi<{ id: number; slug: string; name: string; product_count: number }[]>(`/categories`),
    create: (data: { name: string; icon_url?: string; description?: string }) => fetchApi(`/categories`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string; icon_url?: string; description?: string }) => fetchApi(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/categories/${id}`, { method: 'DELETE' }),
    uploadIcon: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/image`, fd);
    },
  },
  tags: {
    list: () => fetchApi<{ id: number; slug: string; name: string; product_count: number }[]>(`/tags`),
    create: (data: { name: string }) => fetchApi(`/tags`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name: string }) => fetchApi(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/tags/${id}`, { method: 'DELETE' }),
  },
  developers: {
    list: () => fetchApi<{ id: number; name: string; email: string }[]>(`/developers`),
    create: (data: { name?: string; email: string }) => fetchApi(`/developers`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; email?: string }) => fetchApi(`/developers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/developers/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: (params?: { category?: string }) => {
      const q = params?.category ? `?category=${params.category}` : '';
      return fetchApi<any[]>(`/products${q}`);
    },
    get: (id: number) => fetchApi<any>(`/products/${id}?admin=1`),
    create: (data: { name: string; price: number; category_id: number; description?: string; visibility?: string; tags?: string[] }) =>
      fetchApi(`/products`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; price: number; category_id: number; description: string; visibility: string; tags: string[] }>) =>
      fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
    uploadImage: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/${id}/image`, fd);
    },
    uploadImages: (id: number, files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      return fetchFormData(`/upload/${id}/images`, fd);
    },
    uploadFile: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/${id}/file`, fd);
    },
  },
  orders: {
    list: () => fetchApi<any[]>(`/orders`),
    get: (id: number) => fetchApi<any>(`/orders/${id}`),
  },
  faqs: {
    list: () => fetchApi<{ id: number; question: string; answer: string; order: number }[]>(`/faqs`),
    create: (data: { question: string; answer: string; order?: number }) =>
      fetchApi(`/faqs`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { question?: string; answer?: string; order?: number }) =>
      fetchApi(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/faqs/${id}`, { method: 'DELETE' }),
  },
  stats: (period?: 'daily' | 'weekly' | 'monthly' | 'all') => {
    const q = period ? `?period=${period}` : '';
    return fetchApi<{
      products: number;
      orders: number;
      customers: number;
      users: number;
      revenue: number;
      revenue_usd: number;
      revenue_robux: number;
      platform_revenue: number;
      platform_revenue_usd: number;
      platform_revenue_robux: number;
      users_by_month: { name: string; users: number }[];
      sales_by_month: { name: string; sales: number }[];
      sales_by_month_usd: { name: string; usd: number; platform_usd: number }[];
      sales_by_month_robux: { name: string; robux: number; platform_robux: number }[];
    }>(`/stats${q}`);
  },
  downloads: {
    list: () => fetchApi<{ id: number; order_id: number; product_id: number; product_name: string; user_email: string; source: string; created_at: string }[]>(`/downloads`),
  },
  users: {
    list: () => fetchApi<{ id: number; email: string; username: string; discord_username?: string; wallet_credits: number; blocked: boolean; created_at: string }[]>(`/users`),
    update: (id: number, data: { username?: string; wallet_credits?: number; blocked?: boolean }) =>
      fetchApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  staff: {
    list: () => fetchApi<{ id: number; user_id: number; email?: string; username?: string; permissions: Record<string, boolean>; created_at: string }[]>(`/staff`),
    create: (data: { user_id: number; permissions: string[] }) =>
      fetchApi(`/staff`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { permissions: string[] }) =>
      fetchApi(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/staff/${id}`, { method: 'DELETE' }),
  },
  partners: {
    list: () => fetchApi<{ id: number; name: string; logo_url: string | null; link: string | null }[]>(`/partners`),
    create: (data: { name: string; logo_url?: string; link?: string }) =>
      fetchApi(`/partners`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; logo_url?: string; link?: string }) =>
      fetchApi(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<{ success: boolean }>(`/partners/${id}`, { method: 'DELETE' }),
    uploadLogo: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/image`, fd) as Promise<{ url: string }>;
    },
  },
  partnershipRequests: {
    list: (params?: { status?: string }) => {
      const q = params?.status ? `?status=${params.status}` : '';
      return fetchApi<any[]>(`/partnership-requests${q}`);
    },
    accept: (id: number) => fetchApi(`/partnership-requests/${id}/accept`, { method: 'POST' }),
    reject: (id: number) => fetchApi(`/partnership-requests/${id}/reject`, { method: 'POST' }),
    getSettings: () => fetchApi<{ payment_rate_per_partnership: number; discord_channel_webhook: string }>(`/partnership-requests/settings`),
    updateSettings: (data: { payment_rate_per_partnership?: number; discord_channel_webhook?: string }) =>
      fetchApi(`/partnership-requests/settings`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  creditPackages: {
    list: () => fetchApi<{ id: number; name: string; credits: number; price_usd: number; roblox_product_id: string | null }[]>(`/credit-packages`),
    create: (data: { name: string; credits: number; price_usd?: number; roblox_product_id?: string }) =>
      fetchApi(`/credit-packages`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/credit-packages/${id}`, { method: 'DELETE' }),
  },
  visits: () =>
    fetchApi<{ today: number; yesterday: number; this_month: number; last_month: number }>(`/visits/stats`),
};

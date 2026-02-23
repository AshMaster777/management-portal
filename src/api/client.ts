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

const DEFAULT_UPLOAD_TIMEOUT = 120000;   // 2 min for images/small files
const LARGE_FILE_UPLOAD_TIMEOUT = 600000; // 10 min for product files (.rbxm etc)

async function fetchFormData(
  path: string,
  formData: FormData,
  method = 'POST',
  retries = 2,
  timeoutMs = DEFAULT_UPLOAD_TIMEOUT
) {
  let lastError: Error | null = null;
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? path : '/' + path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, {
        method,
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        if (res.status === 413) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          const msg = body?.error || 'File too large - maximum size is 100MB per file.';
          throw new Error(msg + ' If the file is under 100MB, the server (nginx) may be blocking it — set client_max_body_size 100M.');
        }
        const errorText = await res.text().catch(() => res.statusText);
        throw new Error(errorText || res.statusText);
      }
      
      return res.json();
    } catch (err) {
      clearTimeout(timeout);
      lastError = err as Error;
      
      if ((err as Error).name === 'AbortError') {
        const mins = Math.round(timeoutMs / 60000);
        throw new Error(`Upload timed out after ${mins} min. Try a smaller file or check your connection.`);
      }
      
      // Don't retry on 413 (file too large)
      if ((err as Error).message.includes('too large')) {
        throw err;
      }
      
      // Retry on CORS/network errors, but not on 400/500 errors
      if (attempt < retries && (err as Error).message.includes('Failed to fetch')) {
        console.warn(`Upload attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000)); // 1s, 2s delay
        continue;
      }
      
      throw err;
    }
  }
  
  throw lastError || new Error('Upload failed');
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
    list: () => fetchApi<{ id: number; name: string; email: string; revenue_percent: number; created_at: string }[]>(`/developers`),
    getProducts: (id: number) => fetchApi<{ id: number; name: string }[]>(`/developers/${id}/products`),
    create: (data: { name?: string; email: string; password?: string; revenue_percent?: number }) => fetchApi(`/developers`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; email?: string; password?: string; revenue_percent?: number }) => fetchApi(`/developers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/developers/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: (params?: { category?: string }) => {
      const q = params?.category ? `?category=${params.category}` : '';
      return fetchApi<any[]>(`/products${q}`);
    },
    get: (id: number) => fetchApi<any>(`/products/${id}?admin=1`),
    create: (data: { name: string; price: number; category_id: number; description?: string; visibility?: string; tags?: string[]; robux_price?: number | null; developer_id?: number | null }) =>
      fetchApi(`/products`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; price: number; category_id: number; description: string; visibility: string; tags: string[]; image_urls: string[]; video_url: string | null; robux_price: number | null; developer_id: number | null }>) =>
      fetchApi(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi(`/products/${id}`, { method: 'DELETE' }),
    uploadImage: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/${id}/image`, fd, 'POST', 2, LARGE_FILE_UPLOAD_TIMEOUT);
    },
    uploadImages: (id: number, files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      return fetchFormData(`/upload/${id}/images`, fd, 'POST', 2, LARGE_FILE_UPLOAD_TIMEOUT);
    },
    uploadFile: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/${id}/file`, fd, 'POST', 2, LARGE_FILE_UPLOAD_TIMEOUT);
    },
    uploadVideo: (id: number, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return fetchFormData(`/upload/${id}/video`, fd, 'POST', 2, LARGE_FILE_UPLOAD_TIMEOUT) as Promise<{ url: string }>;
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
      by_product?: Record<number, { sales: number; revenue: number }>;
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
  staffEarnings: {
    summary: () => fetchApi<{ staff: { staff_id: number; user_id: number; email?: string; username?: string; total: number; partnerships_count: number }[] }>(`/staff-earnings?summary=1`),
    reset: (staffId: number) => fetchApi<{ success: boolean }>(`/staff-earnings/reset`, { method: 'POST', body: JSON.stringify({ staff_id: staffId }) }),
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

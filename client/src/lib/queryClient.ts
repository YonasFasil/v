import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token');
}

// Create headers with auth token
function createHeaders(includeContentType: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Overload signatures
export async function apiRequest(url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<any>;
export async function apiRequest(method: string, url: string, data?: any): Promise<any>;

// Implementation
export async function apiRequest(
  urlOrMethod: string,
  optionsOrUrl?: { method?: string; body?: string; headers?: Record<string, string> } | string,
  data?: any
): Promise<any> {
  let url: string;
  let method: string;
  let body: string | undefined;
  let customHeaders: Record<string, string> = {};

  // Handle different call patterns
  if (typeof optionsOrUrl === 'string') {
    // Pattern: apiRequest("POST", "/api/venues", data)
    method = urlOrMethod;
    url = optionsOrUrl;
    body = data ? JSON.stringify(data) : undefined;
  } else {
    // Pattern: apiRequest("/api/venues", { method: "POST", body: "..." })
    url = urlOrMethod;
    const options = optionsOrUrl || {};
    method = options.method || 'GET';
    body = options.body;
    customHeaders = options.headers || {};
  }
  
  const headers = {
    ...createHeaders(!!body),
    ...customHeaders
  };

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: createHeaders(false),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Utility function to clear tenant-specific cache when switching tenants
export function clearTenantCache() {
  console.log("🔥 CLEARING TENANT CACHE - Removing all cached data to prevent cross-tenant contamination");
  
  // Clear all queries to prevent cross-tenant data contamination
  queryClient.clear();
  
  // Also clear any specific tenant-related queries including analytics
  const tenantQueries = [
    '/api/bookings',
    '/api/customers', 
    '/api/customers/analytics', // Critical: Clear customer analytics cache
    '/api/companies',
    '/api/venues',
    '/api/spaces',
    '/api/proposals',
    '/api/communications',
    '/api/tasks',
    '/api/packages',
    '/api/services',
    '/api/tax-settings',
    '/api/setup-styles',
    '/api/leads',
    '/api/dashboard',
    '/api/dashboard/metrics',
    '/api/reports',
    '/api/users'
  ];
  
  tenantQueries.forEach(queryKey => {
    queryClient.removeQueries({ queryKey: [queryKey] });
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  });
  
  console.log("✅ Tenant cache cleared successfully");
}

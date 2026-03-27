const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiClient {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.userId) {
      headers["x-user-id"] = this.userId;
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user?.id) {
            headers["x-user-id"] = user.id;
            this.userId = user.id;
          }
        }
      } catch {}
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; role: string }) {
    return this.request<{ user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Categories
  async getCategories() {
    return this.request<any[]>("/api/categories");
  }

  async createCategory(data: { name: string; description?: string }) {
    return this.request<any>("/api/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: any) {
    return this.request<any>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/api/categories/${id}`, { method: "DELETE" });
  }

  // Menu Items
  async getMenuItems(categoryId?: string) {
    const query = categoryId ? `?category=${categoryId}` : "";
    return this.request<any[]>(`/api/menu-items${query}`);
  }

  async getActiveMenuItems() {
    return this.request<any[]>("/api/menu-items/active");
  }

  async createMenuItem(data: any) {
    return this.request<any>("/api/menu-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(id: string, data: any) {
    return this.request<any>(`/api/menu-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Stock
  async getStockMonitor() {
    return this.request<any[]>("/api/stock/monitor");
  }

  async createStockIn(data: any) {
    return this.request<any>("/api/stock/in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStockInHistory() {
    return this.request<any[]>("/api/stock/in");
  }

  async getStockOutHistory() {
    return this.request<any[]>("/api/stock/out");
  }

  // Transactions
  async createTransaction(data: any) {
    return this.request<any>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTransactions() {
    return this.request<any[]>("/api/transactions");
  }

  async getTransaction(id: string) {
    return this.request<any>(`/api/transactions/${id}`);
  }

  async getReceipt(id: string) {
    return this.request<any>(`/api/transactions/${id}/receipt`);
  }

  // Shifts
  async openShift() {
    return this.request<any>("/api/shifts/open", { method: "POST" });
  }

  async getActiveShift() {
    return this.request<any>("/api/shifts/active");
  }

  async closeShift(data: { physicalCash?: string; notes?: string }) {
    return this.request<any>("/api/shifts/close", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Stock Requests
  async createStockRequest(items: any[]) {
    return this.request<any>("/api/stock-requests", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  async getStockRequests() {
    return this.request<any[]>("/api/stock-requests");
  }

  async approveRequest(id: string, approvedQty: number) {
    return this.request<any>(`/api/stock-requests/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approvedQty }),
    });
  }

  async rejectRequest(id: string, notes: string) {
    return this.request<any>(`/api/stock-requests/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ notes }),
    });
  }

  async fulfillRequest(id: string) {
    return this.request<any>(`/api/stock-requests/${id}/fulfill`, {
      method: "POST",
    });
  }

  // Reports
  async getSalesReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return this.request<any>(`/api/reports/sales?${params}`);
  }

  async getFinancialReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return this.request<any>(`/api/reports/financial?${params}`);
  }

  async getStockInReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return this.request<any[]>(`/api/reports/stock-in?${params}`);
  }

  async getStockOutReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return this.request<any[]>(`/api/reports/stock-out?${params}`);
  }

  async getDailySalesReport() {
    return this.request<any[]>("/api/reports/daily-sales");
  }
}

export const api = new ApiClient(API_URL);

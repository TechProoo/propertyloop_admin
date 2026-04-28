import { api } from "./client";
import type {
  AdminOverview,
  AuthResponse,
  Listing,
  ListingStatus,
  Paginated,
  User,
  WaitlistEntry,
} from "./types";

// ─── Auth ────────────────────────────────────────────────────────────────

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — we still clear locally
    }
  },
};

// ─── Admin ───────────────────────────────────────────────────────────────

export const adminService = {
  async overview(): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>("/admin/overview");
    return data;
  },

  // Users
  async listUsers(params: { page?: number; limit?: number; search?: string }) {
    const { data } = await api.get<Paginated<User>>("/admin/users", { params });
    return data;
  },
  async setUserActive(id: string, isActive: boolean) {
    const { data } = await api.patch<User>(`/admin/users/${id}/active`, {
      isActive,
    });
    return data;
  },

  // Listings
  async listListings(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ListingStatus;
  }) {
    const { data } = await api.get<Paginated<Listing>>("/admin/listings", {
      params,
    });
    return data;
  },
  async setListingStatus(id: string, status: ListingStatus) {
    const { data } = await api.patch<Listing>(`/admin/listings/${id}/status`, {
      status,
    });
    return data;
  },

  // Agents
  async listAgents(params: {
    page?: number;
    limit?: number;
    search?: string;
    verified?: boolean;
  }) {
    const { data } = await api.get<Paginated<User>>("/admin/agents", { params });
    return data;
  },
  async setAgentVerified(id: string, verified: boolean) {
    const { data } = await api.patch(`/admin/agents/${id}/verified`, {
      verified,
    });
    return data;
  },

  // Vendors
  async listVendors(params: {
    page?: number;
    limit?: number;
    search?: string;
    verified?: boolean;
  }) {
    const { data } = await api.get<Paginated<User>>("/admin/vendors", { params });
    return data;
  },
  async setVendorVerified(id: string, verified: boolean) {
    const { data } = await api.patch(`/admin/vendors/${id}/verified`, {
      verified,
    });
    return data;
  },
};

// ─── Waitlist ────────────────────────────────────────────────────────────

export const waitlistService = {
  async list(): Promise<WaitlistEntry[]> {
    const { data } = await api.get<WaitlistEntry[]>("/waitlist");
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/waitlist/${id}`);
  },
  async exportCsv(): Promise<Blob> {
    const res = await api.get<Blob>("/waitlist/export", {
      responseType: "blob",
    });
    return res.data;
  },
};

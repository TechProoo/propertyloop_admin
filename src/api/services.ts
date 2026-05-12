import { api } from "./client";
import type {
  AdminOverview,
  AppWaitlistEntry,
  AuthResponse,
  CreateFeaturedPropertyPayload,
  FeaturedProperty,
  Listing,
  ListingStatus,
  Paginated,
  Report,
  ReportStatus,
  ReportTargetType,
  UpdateFeaturedPropertyPayload,
  User,
  Viewing,
  ViewingStatus,
  WaitlistEntry,
} from "./types";

export type UpdateListingPayload = {
  title?: string;
  type?: "SALE" | "RENT" | "SHORTLET";
  propertyType?: string;
  priceNaira?: number;
  period?: string;
  address?: string;
  location?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  yearBuilt?: string;
  description?: string;
  features?: string[];
  coverImage?: string;
  images?: string[];
  virtualTourUrl?: string;
  videoUrl?: string;
  status?: ListingStatus;
};

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
  async updateListing(id: string, payload: UpdateListingPayload) {
    const { data } = await api.patch<Listing>(`/admin/listings/${id}`, payload);
    return data;
  },

  // Agents
  async listAgents(params: {
    page?: number;
    limit?: number;
    search?: string;
    verified?: boolean;
  }) {
    const { data } = await api.get<Paginated<User>>("/admin/agents", {
      params,
    });
    return data;
  },
  async setAgentVerified(id: string, verified: boolean) {
    const { data } = await api.patch(`/admin/agents/${id}/verified`, {
      verified,
    });
    return data;
  },
  async overrideAgentSubscription(
    agentId: string,
    tier: string,
    status: string,
  ) {
    const { data } = await api.patch(`/admin/agents/${agentId}/subscription`, {
      tier,
      status,
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
    const { data } = await api.get<Paginated<User>>("/admin/vendors", {
      params,
    });
    return data;
  },
  async setVendorVerified(id: string, verified: boolean) {
    const { data } = await api.patch(`/admin/vendors/${id}/verified`, {
      verified,
    });
    return data;
  },

  // Viewings
  async listViewings(params: {
    page?: number;
    limit?: number;
    status?: ViewingStatus;
    upcoming?: boolean;
    search?: string;
  }) {
    const { data } = await api.get<Paginated<Viewing>>("/admin/viewings", {
      params,
    });
    return data;
  },
  async setViewingStatus(id: string, status: ViewingStatus) {
    const { data } = await api.patch<Viewing>(`/admin/viewings/${id}/status`, {
      status,
    });
    return data;
  },
  async deleteViewing(id: string) {
    const { data } = await api.delete<{ success: boolean }>(
      `/admin/viewings/${id}`,
    );
    return data;
  },

  // App waitlist (mobile app launch subscribers)
  async listAppWaitlist(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { data } = await api.get<Paginated<AppWaitlistEntry>>(
      "/admin/app-waitlist",
      { params },
    );
    return data;
  },
  async deleteAppWaitlistEntry(id: string) {
    const { data } = await api.delete<{ success: boolean }>(
      `/admin/app-waitlist/${id}`,
    );
    return data;
  },
  async exportAppWaitlist(): Promise<Blob> {
    const res = await api.get<Blob>("/admin/app-waitlist/export", {
      responseType: "blob",
    });
    return res.data;
  },

  // Featured Properties (hero gallery ad slots)
  async listFeaturedProperties(): Promise<FeaturedProperty[]> {
    const { data } = await api.get<FeaturedProperty[]>(
      "/admin/featured-properties",
    );
    return data;
  },
  async createFeaturedProperty(
    payload: CreateFeaturedPropertyPayload,
  ): Promise<FeaturedProperty> {
    const { data } = await api.post<FeaturedProperty>(
      "/admin/featured-properties",
      payload,
    );
    return data;
  },
  async updateFeaturedProperty(
    id: string,
    payload: UpdateFeaturedPropertyPayload,
  ): Promise<FeaturedProperty> {
    const { data } = await api.patch<FeaturedProperty>(
      `/admin/featured-properties/${id}`,
      payload,
    );
    return data;
  },
  async deleteFeaturedProperty(id: string): Promise<{ success: boolean }> {
    const { data } = await api.delete<{ success: boolean }>(
      `/admin/featured-properties/${id}`,
    );
    return data;
  },
};

// ─── Reports (user-submitted agent/vendor/listing reports) ───────────────

export const reportsService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: ReportStatus;
    targetType?: ReportTargetType;
  }): Promise<Paginated<Report>> {
    const { data } = await api.get<Paginated<Report>>("/reports", { params });
    return data;
  },
  async update(
    id: string,
    payload: { status?: ReportStatus; adminNote?: string },
  ): Promise<Report> {
    const { data } = await api.patch<Report>(`/reports/${id}`, payload);
    return data;
  },
};

// ─── Upload ──────────────────────────────────────────────────────────────

export const uploadService = {
  async uploadFeaturedPropertyImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ url: string }>(
      "/upload/featured-property-image",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.url;
  },

  async uploadFeaturedPropertyVideo(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ url: string }>(
      "/upload/featured-property-video",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.url;
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

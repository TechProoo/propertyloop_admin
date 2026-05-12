export type Role = "BUYER" | "AGENT" | "VENDOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  agentProfile?: AgentProfile | null;
  vendorProfile?: VendorProfile | null;
}

export type SubscriptionTier = "FOUNDING" | "STANDARD" | "PRO";
export type SubscriptionStatus =
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "LAPSED"
  | "CANCELLED";

export interface AgentProfile {
  id?: string;
  userId?: string;
  agencyName?: string | null;
  licenseNumber?: string | null;
  businessAddress?: string | null;
  bio?: string | null;
  rating?: number;
  listingsCount?: number;
  soldRentedCount?: number;
  verified: boolean;
  subscriptionTier?: SubscriptionTier | null;
  subscriptionStatus?: SubscriptionStatus | null;
  subscriptionRenewsAt?: string | null;
}

export interface VendorProfile {
  id?: string;
  userId?: string;
  serviceCategory?: string;
  yearsExperience?: string;
  serviceArea?: string;
  bannerImage?: string | null;
  rating?: number;
  jobsCount?: number;
  availableForHire?: boolean;
  verified: boolean;
}

export type ListingStatus =
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD"
  | "RENTED"
  | "ARCHIVED";

export interface Listing {
  id: string;
  slug: string;
  title: string;
  type: "SALE" | "RENT" | "SHORTLET";
  propertyType: string;
  priceNaira: number;
  priceLabel: string;
  period?: string | null;
  address: string;
  location: string;
  beds: number;
  baths: number;
  sqft?: string;
  yearBuilt?: string;
  description?: string;
  features?: string[];
  coverImage?: string;
  images?: string[];
  virtualTourUrl?: string | null;
  videoUrl?: string | null;
  rating?: number;
  verified?: boolean;
  status: ListingStatus;
  viewsCount?: number;
  createdAt: string;
  updatedAt?: string;
  agent?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    agentProfile?: { agencyName?: string | null; verified: boolean } | null;
  };
}

export interface FeaturedProperty {
  id: string;
  title: string;
  location: string;
  priceNaira: number;
  priceLabel: string;
  type: "SALE" | "RENT" | "SHORTLET";
  propertyType: string;
  beds: number;
  baths: number;
  sqft?: string | null;
  description?: string | null;
  imageUrls: string[];
  videoUrl?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeaturedPropertyPayload {
  title: string;
  location: string;
  priceNaira: number;
  priceLabel: string;
  type: "SALE" | "RENT" | "SHORTLET";
  propertyType: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  description?: string;
  imageUrls: string[];
  videoUrl?: string;
  active?: boolean;
}

export type UpdateFeaturedPropertyPayload =
  Partial<CreateFeaturedPropertyPayload>;

export interface AppWaitlistEntry {
  id: string;
  email: string;
  source?: string | null;
  notifiedAt?: string | null;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string | null;
  location?: string | null;
  phone: string;
  email: string;
  type:
    | "REAL_ESTATE_AGENT"
    | "BUILDER"
    | "BUILDING_MATERIALS_SUPPLIER_INSTALLER"
    | "PARTNER_INVESTOR";
  activated?: boolean;
  activatedAt?: string | null;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminOverview {
  totalUsers: number;
  totalAgents: number;
  totalVendors: number;
  totalListings: number;
  activeListings: number;
  totalOrders: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type ViewingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Viewing {
  id: string;
  agentId: string;
  listingId: string;
  buyerUserId?: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  scheduledFor: string;
  status: ViewingStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  listing?: {
    id: string;
    title: string;
    coverImage?: string;
    location?: string;
    slug?: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

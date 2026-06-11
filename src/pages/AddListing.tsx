import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  KeyRound,
  Moon,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Heart,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ChevronLeft,
} from "lucide-react";
import { adminService } from "@/api/services";
import type { CreateListingPayload } from "@/api/services";
import type { ListingStatus, User } from "@/api/types";
import { Spinner } from "@/components/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { actionLoader } from "@/lib/actionLoader";

type ListingType = "SALE" | "RENT" | "SHORTLET";

const TYPE_CARDS: {
  value: ListingType;
  label: string;
  hint: string;
  icon: typeof Home;
}[] = [
  { value: "SALE", label: "For sale", hint: "One-time purchase", icon: Home },
  { value: "RENT", label: "For rent", hint: "Yearly tenancy", icon: KeyRound },
  { value: "SHORTLET", label: "Shortlet", hint: "Nightly stays", icon: Moon },
];

const PROPERTY_TYPES = [
  "Apartment",
  "Flat / Apartment",
  "Detached House",
  "Semi-Detached House",
  "Terraced House",
  "Duplex",
  "Bungalow",
  "Penthouse",
  "Studio",
  "Maisonette",
  "Land",
  "Commercial",
];

const FEATURE_OPTIONS = [
  "Borehole",
  "Inverter",
  "Generator",
  "Swimming Pool",
  "Gym",
  "Parking Space",
  "Furnished",
  "24/7 Security",
  "Fitted Kitchen",
  "Air Conditioning",
  "CCTV",
  "Boys' Quarters",
];

const STATUS_OPTIONS: { value: ListingStatus; label: string; hint: string }[] = [
  {
    value: "PENDING_REVIEW",
    label: "Pending review",
    hint: "Goes through the normal verification flow before it's public.",
  },
  {
    value: "ACTIVE",
    label: "Publish now",
    hint: "Listing is live and visible to buyers immediately.",
  },
];

// ─── Small styled primitives (mirroring the web redesign look) ──────────────

const inputCls =
  "w-full h-[50px] px-[15px] rounded-[13px] bg-white border-[1.5px] border-border-light text-[14.5px] font-medium text-primary-dark placeholder:text-text-subtle placeholder:font-normal focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-colors";
const textareaCls =
  "w-full px-[15px] py-[13px] rounded-[13px] bg-white border-[1.5px] border-border-light text-[14.5px] font-medium leading-relaxed text-primary-dark placeholder:text-text-subtle placeholder:font-normal focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-colors resize-none";

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-text-secondary mb-[7px]">
        {label}
        {optional && (
          <span className="font-medium text-text-subtle"> · optional</span>
        )}
      </label>
      {children}
    </div>
  );
}

function SecTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-extrabold text-primary uppercase tracking-[0.08em] mt-7 mb-3.5 first:mt-0">
      {children}
    </div>
  );
}

export default function AddListing() {
  usePageTitle("Add Listing");
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Agents (for the owner picker — the admin isn't an agent, so a listing must
  // be explicitly assigned to one).
  const [agents, setAgents] = useState<User[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentSearch, setAgentSearch] = useState("");

  // Form state
  const [type, setType] = useState<ListingType>("SALE");
  const [agentId, setAgentId] = useState("");
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [priceNaira, setPriceNaira] = useState<string>("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [beds, setBeds] = useState<string>("");
  const [baths, setBaths] = useState<string>("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [features, setFeatures] = useState<string[]>(["Borehole", "Inverter"]);
  const [coverImage, setCoverImage] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [virtualTourUrl, setVirtualTourUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<ListingStatus>("PENDING_REVIEW");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAgentsLoading(true);
    adminService
      .listAgents({ limit: 100, search: agentSearch.trim() || undefined })
      .then((res) => {
        if (active) setAgents(res.items);
      })
      .catch(() => {
        if (active) setAgents([]);
      })
      .finally(() => {
        if (active) setAgentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [agentSearch]);

  // Default the rent/shortlet period sensibly when the type changes.
  useEffect(() => {
    if (type === "SALE") setPeriod("");
    else if (type === "RENT") setPeriod((p) => p || "year");
    else if (type === "SHORTLET") setPeriod((p) => p || "night");
  }, [type]);

  const galleryImages = useMemo(
    () =>
      imagesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [imagesText],
  );

  const selectedAgent = agents.find((a) => a.id === agentId);
  const priceNum = Number(priceNaira.replace(/[, ]/g, "")) || 0;

  const toggleFeature = (f: string) =>
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  // Validation gates per step.
  const step1Valid =
    agentId &&
    title.trim() &&
    propertyType.trim() &&
    priceNum > 0 &&
    address.trim() &&
    location.trim() &&
    beds !== "" &&
    baths !== "" &&
    sqft.trim() &&
    description.trim();
  const step2Valid = !!coverImage.trim();

  const goStep = (n: number) => {
    setError(null);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!step1Valid) {
      setError("Please complete the required property details (Step 1).");
      setStep(1);
      return;
    }
    if (!step2Valid) {
      setError("A cover image URL is required (Step 2).");
      setStep(2);
      return;
    }

    const trimmedOrUndef = (v: string) => {
      const t = v.trim();
      return t.length > 0 ? t : undefined;
    };

    const payload: CreateListingPayload = {
      agentId,
      title: title.trim(),
      type,
      propertyType: propertyType.trim(),
      priceNaira: priceNum,
      period: trimmedOrUndef(period),
      address: address.trim(),
      location: location.trim(),
      beds: Number(beds) || 0,
      baths: Number(baths) || 0,
      sqft: sqft.trim(),
      yearBuilt: trimmedOrUndef(yearBuilt),
      description: description.trim(),
      features,
      coverImage: coverImage.trim(),
      images: galleryImages,
      // Backend validates these with @IsUrl() — only send them if non-empty,
      // otherwise an empty string 400s the whole request.
      virtualTourUrl: trimmedOrUndef(virtualTourUrl),
      videoUrl: trimmedOrUndef(videoUrl),
      status,
    };

    setSubmitting(true);
    actionLoader.show("Creating listing…");
    try {
      await adminService.createListing(payload);
      navigate("/listings");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? "Failed to create listing"),
      );
    } finally {
      setSubmitting(false);
      actionLoader.hide();
    }
  };

  const fmtPrice = priceNum > 0 ? `₦${priceNum.toLocaleString("en-NG")}` : "₦—";
  const periodSuffix = period ? `/${period}` : "";

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/listings")}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-subtle hover:text-primary transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Listings / <b className="text-primary-dark">Add property</b>
      </button>

      {/* Hero */}
      <div className="relative rounded-[26px] overflow-hidden px-8 py-10 sm:px-12 sm:py-12 text-white min-h-[220px] flex flex-col justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#16261c_0%,#1f6f43_58%,#2c8a55_100%)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 78% 30%, rgba(255,255,255,.10), transparent 45%)",
          }}
        />
        <div className="relative max-w-[620px]">
          <h1 className="font-heading text-[40px] sm:text-[52px] leading-[1.02] font-semibold tracking-tight m-0">
            List a <span className="text-white/50">Property</span>
          </h1>
          <p className="text-[15px] leading-relaxed opacity-85 mt-4 max-w-[520px]">
            Create a listing on behalf of an agent. Assign the owning agent,
            fill in the details, and choose whether to publish now or queue it
            for verification.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center my-8">
        {[
          { n: 1, t: "Property Details" },
          { n: 2, t: "Photos & Media" },
          { n: 3, t: "Review & Submit" },
        ].map((s, idx) => (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => goStep(s.n)}
              className="flex items-center gap-2.5"
            >
              <span
                className={`w-[38px] h-[38px] rounded-full grid place-items-center font-extrabold text-[15px] transition-all ${
                  step === s.n
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : step > s.n
                      ? "bg-primary text-white"
                      : "bg-bg-accent text-text-subtle"
                }`}
              >
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </span>
              <span
                className={`text-[15px] font-bold hidden sm:block ${
                  step >= s.n ? "text-primary-dark" : "text-text-subtle"
                }`}
              >
                {s.t}
              </span>
            </button>
            {idx < 2 && (
              <span
                className={`w-10 sm:w-[70px] h-0.5 mx-3 sm:mx-4 ${
                  step > s.n ? "bg-primary" : "bg-border-light"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ─── STEP 1 · Details ─── */}
      {step === 1 && (
        <div className="bg-white border border-border-light rounded-[24px] p-6 sm:p-9 shadow-sm">
          <h2 className="font-heading text-[24px] font-semibold m-0">
            Tell us about the property
          </h2>
          <p className="text-sm text-text-secondary mt-1 mb-0">
            The clearer the listing, the more enquiries it gets.
          </p>

          <SecTitle>Assign to agent</SecTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Search agents">
              <input
                className={inputCls}
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Name or email…"
              />
            </Field>
            <Field label="Owning agent">
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-9`}
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                >
                  <option value="">
                    {agentsLoading ? "Loading agents…" : "Select an agent"}
                  </option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.agentProfile?.agencyName
                        ? ` · ${a.agentProfile.agencyName}`
                        : ""}
                      {a.agentProfile?.verified ? " · ✓" : ""}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-text-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>
          </div>
          {selectedAgent && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-text-secondary">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-accent">
                {selectedAgent.email}
              </span>
              {selectedAgent.agentProfile?.subscriptionTier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-accent">
                  {selectedAgent.agentProfile.subscriptionTier} ·{" "}
                  {selectedAgent.agentProfile.subscriptionStatus}
                </span>
              )}
              {selectedAgent.agentProfile?.verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                  Not KYC-verified
                </span>
              )}
            </div>
          )}

          <SecTitle>Listing type</SecTitle>
          <div className="grid grid-cols-3 gap-3">
            {TYPE_CARDS.map((t) => {
              const Icon = t.icon;
              const on = type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`text-left border-[1.5px] rounded-[16px] p-4 transition-colors ${
                    on
                      ? "border-primary bg-primary/[0.06]"
                      : "border-border-light bg-white hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-[11px] grid place-items-center mb-2.5 ${
                      on ? "bg-white text-primary" : "bg-bg-accent text-text-secondary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <b className="text-[14.5px] font-bold block text-primary-dark">
                    {t.label}
                  </b>
                  <span className="text-[12px] text-text-subtle">{t.hint}</span>
                </button>
              );
            })}
          </div>

          <SecTitle>The basics</SecTitle>
          <Field label="Listing title">
            <input
              className={inputCls}
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sandbridge Court · 3-bed apartment"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Property type">
              <select
                className={`${inputCls} appearance-none`}
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                {PROPERTY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Asking price (₦)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={priceNaira}
                  onChange={(e) =>
                    setPriceNaira(e.target.value.replace(/[^\d,]/g, ""))
                  }
                  placeholder="4,800,000"
                />
              </Field>
              <Field label={type === "SALE" ? "Period" : "Period"} optional={type === "SALE"}>
                <input
                  className={inputCls}
                  value={period}
                  maxLength={20}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder={type === "SHORTLET" ? "night" : "year"}
                  disabled={type === "SALE"}
                />
              </Field>
            </div>
          </div>
          <div className="mt-4">
            <Field label="Description">
              <textarea
                className={textareaCls}
                rows={3}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A bright, recently refurbished home moments from the marina…"
              />
            </Field>
          </div>

          <SecTitle>Location</SecTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Address">
              <input
                className={inputCls}
                value={address}
                maxLength={240}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, area"
              />
            </Field>
            <Field label="City / LGA (location)">
              <input
                className={inputCls}
                value={location}
                maxLength={120}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lekki, Lagos"
              />
            </Field>
          </div>

          <SecTitle>Specifications</SecTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Bedrooms">
              <input
                className={inputCls}
                type="number"
                min={0}
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field label="Bathrooms">
              <input
                className={inputCls}
                type="number"
                min={0}
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field label="Area (m² / sqft)">
              <input
                className={inputCls}
                value={sqft}
                maxLength={40}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="142"
              />
            </Field>
            <Field label="Year built" optional>
              <input
                className={inputCls}
                value={yearBuilt}
                maxLength={20}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="2021"
              />
            </Field>
          </div>

          <SecTitle>Features · optional</SecTitle>
          <div className="flex flex-wrap gap-2.5">
            {FEATURE_OPTIONS.map((f) => {
              const on = features.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFeature(f)}
                  className={`inline-flex items-center gap-1.5 px-[15px] py-2.5 rounded-full text-[13.5px] font-semibold border-[1.5px] transition-colors ${
                    on
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-border-light text-text-secondary hover:border-primary/40"
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5" />}
                  {f}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
            <span className="text-[13px] font-semibold text-text-subtle">
              {step1Valid ? "Ready for the next step" : "Fill the required fields to continue"}
            </span>
            <button
              onClick={() => step1Valid && goStep(2)}
              disabled={!step1Valid}
              className="inline-flex items-center gap-2 h-[52px] px-7 rounded-[14px] text-[15px] font-bold bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue · Photos &amp; media <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2 · Photos & Media ─── */}
      {step === 2 && (
        <div className="bg-white border border-border-light rounded-[24px] p-6 sm:p-9 shadow-sm">
          <h2 className="font-heading text-[24px] font-semibold m-0">
            Photos &amp; media
          </h2>
          <p className="text-sm text-text-secondary mt-1 mb-0">
            Listings with 6+ photos get up to 4× more enquiries. Paste hosted
            image URLs — the first becomes the cover.
          </p>

          <SecTitle>Cover image</SecTitle>
          <Field label="Cover image URL (required)">
            <input
              className={inputCls}
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          {coverImage.trim() && (
            <div className="mt-3 h-44 w-full rounded-[14px] overflow-hidden bg-bg-accent">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <SecTitle>Gallery images</SecTitle>
          <Field label="Gallery image URLs · one per line" optional>
            <textarea
              className={textareaCls}
              rows={4}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://…\nhttps://…"}
            />
          </Field>
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {galleryImages.slice(0, 8).map((src, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-[12px] overflow-hidden bg-bg-accent"
                >
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity =
                        "0.2";
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <SecTitle>Tour &amp; video · optional</SecTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Virtual tour URL" optional>
              <input
                className={inputCls}
                value={virtualTourUrl}
                onChange={(e) => setVirtualTourUrl(e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Video URL" optional>
              <input
                className={inputCls}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-[14px] bg-bg-accent">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-text-secondary leading-relaxed m-0">
              Verified documents (C&nbsp;of&nbsp;O, survey plan, building permit)
              aren't part of listing creation — add them from the listing's Edit
              view once it exists, where each can be marked verified.
            </p>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
            <button
              onClick={() => goStep(1)}
              className="inline-flex items-center gap-2 h-[52px] px-6 rounded-[14px] text-[15px] font-bold text-text-secondary hover:text-primary-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => step2Valid && goStep(3)}
              disabled={!step2Valid}
              className="inline-flex items-center gap-2 h-[52px] px-7 rounded-[14px] text-[15px] font-bold bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue · Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3 · Review & Submit ─── */}
      {step === 3 && (
        <div className="bg-white border border-border-light rounded-[24px] p-6 sm:p-9 shadow-sm">
          <h2 className="font-heading text-[24px] font-semibold m-0">
            Review &amp; submit
          </h2>
          <p className="text-sm text-text-secondary mt-1 mb-6">
            This is exactly what buyers will see. Looks good?
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            {/* Buyer preview card */}
            <div className="rounded-[18px] overflow-hidden border border-border-light shadow-[0_8px_30px_rgba(0,0,0,.06)] bg-white">
              <div className="h-[200px] bg-bg-accent relative">
                {coverImage.trim() ? (
                  <img
                    src={coverImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-text-subtle">
                    <Home className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute top-3.5 left-3.5 bg-primary text-white text-[11px] font-bold px-2.5 py-1.5 rounded-full">
                  {type === "SALE"
                    ? "For sale"
                    : type === "RENT"
                      ? "For rent"
                      : "Shortlet"}
                </span>
                <span className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 grid place-items-center">
                  <Heart className="w-4 h-4 text-primary-dark" />
                </span>
              </div>
              <div className="p-5">
                <div className="font-heading text-[26px] font-bold text-primary-dark">
                  {fmtPrice}
                  <span className="font-sans text-[13px] text-text-subtle font-semibold">
                    {periodSuffix}
                  </span>
                </div>
                <div className="text-[17px] font-bold mt-1 text-primary-dark">
                  {title || "Untitled listing"}
                </div>
                <div className="text-text-subtle text-[13px] mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{" "}
                  {address || "Address"}
                  {location ? `, ${location}` : ""}
                </div>
                <div className="flex gap-5 mt-3.5 pt-3.5 border-t border-border-light text-[13.5px] font-semibold text-text-secondary">
                  <span>🛏 {beds || 0} beds</span>
                  <span>🛁 {baths || 0} baths</span>
                  <span>📐 {sqft || "—"} m²</span>
                </div>
              </div>
            </div>

            {/* Health checklist + status */}
            <div>
              <SecTitle>Listing health</SecTitle>
              <div className="flex flex-col">
                <Check2
                  ok={!!coverImage.trim()}
                  title={
                    coverImage.trim()
                      ? `${galleryImages.length + 1} image${
                          galleryImages.length ? "s" : ""
                        } added`
                      : "Cover image missing"
                  }
                  hint="Cover image is required"
                />
                <Check2
                  ok={!!selectedAgent}
                  title={
                    selectedAgent
                      ? `Assigned to ${selectedAgent.name}`
                      : "No agent assigned"
                  }
                  hint="Every listing needs an owning agent"
                />
                <Check2
                  ok={!!(priceNum > 0 && sqft.trim() && beds !== "")}
                  title="Specs & price filled"
                />
                <Check2
                  ok={description.trim().length >= 60}
                  warn={description.trim().length < 60}
                  title={
                    description.trim().length >= 60
                      ? "Description looks good"
                      : "Add a fuller description"
                  }
                  hint="60+ characters boosts buyer trust"
                />
              </div>

              <SecTitle>Publish status</SecTitle>
              <div className="flex flex-col gap-2.5">
                {STATUS_OPTIONS.map((s) => {
                  const on = status === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`text-left border-[1.5px] rounded-[14px] p-3.5 transition-colors ${
                        on
                          ? "border-primary bg-primary/[0.06]"
                          : "border-border-light bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full border-[1.5px] grid place-items-center ${
                            on ? "border-primary" : "border-border-light"
                          }`}
                        >
                          {on && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <b className="text-[14px] font-bold text-primary-dark">
                          {s.label}
                        </b>
                      </div>
                      <span className="text-[12px] text-text-subtle block mt-1 ml-6">
                        {s.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3.5 rounded-[14px] bg-primary/[0.06] text-[12.5px] text-primary leading-relaxed">
                A PropertyLoop inspector verifies the home before it goes live —
                usually within <b>2 hours</b> during business hours.
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-[13px] font-semibold mt-5">{error}</p>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
            <button
              onClick={() => goStep(2)}
              disabled={submitting}
              className="inline-flex items-center gap-2 h-[52px] px-6 rounded-[14px] text-[15px] font-bold text-text-secondary hover:text-primary-dark transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 h-[52px] px-7 rounded-[14px] text-[15px] font-bold bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <>
                  <Spinner className="w-4 h-4" /> Creating…
                </>
              ) : (
                <>
                  {status === "ACTIVE" ? "Create & publish" : "Create listing"}
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Check2({
  ok,
  warn,
  title,
  hint,
}: {
  ok: boolean;
  warn?: boolean;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-t border-border-light first:border-t-0">
      <span
        className={`w-6 h-6 rounded-[7px] grid place-items-center shrink-0 ${
          ok
            ? "bg-primary text-white"
            : warn
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-600"
        }`}
      >
        {ok ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5" />
        )}
      </span>
      <div>
        <b className="text-[13.5px] font-bold text-primary-dark block">
          {title}
        </b>
        {hint && <span className="text-[12px] text-text-subtle">{hint}</span>}
      </div>
    </div>
  );
}

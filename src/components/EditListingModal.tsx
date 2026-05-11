import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { adminService, type UpdateListingPayload } from "@/api/services";
import type { Listing, ListingStatus } from "@/api/types";
import { Button, Spinner } from "@/components/ui";
import { actionLoader } from "@/lib/actionLoader";

interface Props {
  listing: Listing;
  onClose: () => void;
  onSaved: (updated: Listing) => void;
}

const LISTING_TYPES = ["SALE", "RENT", "SHORTLET"] as const;
const STATUSES: ListingStatus[] = [
  "PENDING_REVIEW",
  "ACTIVE",
  "PAUSED",
  "SOLD",
  "RENTED",
  "ARCHIVED",
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors";
const textareaCls =
  "w-full px-3 py-2 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors resize-none";

export default function EditListingModal({ listing, onClose, onSaved }: Props) {
  const [form, setForm] = useState<UpdateListingPayload>({
    title: listing.title,
    type: listing.type,
    propertyType: listing.propertyType,
    priceNaira: listing.priceNaira,
    period: listing.priceLabel?.match(/\/ ?(\w+)$/)?.[1] ?? "",
    address: listing.address,
    location: listing.location,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft ?? "",
    yearBuilt: listing.yearBuilt ?? "",
    description: listing.description ?? "",
    features: listing.features ?? [],
    coverImage: listing.coverImage ?? "",
    images: listing.images ?? [],
    virtualTourUrl: listing.virtualTourUrl ?? "",
    videoUrl: listing.videoUrl ?? "",
    status: listing.status,
  });

  const [featuresText, setFeaturesText] = useState(
    (listing.features ?? []).join("\n"),
  );
  const [imagesText, setImagesText] = useState(
    (listing.images ?? []).join("\n"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = <K extends keyof UpdateListingPayload>(
    key: K,
    value: UpdateListingPayload[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    actionLoader.show("Saving listing…");
    try {
      const payload: UpdateListingPayload = {
        ...form,
        features: featuresText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        images: imagesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const updated = await adminService.updateListing(listing.id, payload);
      onSaved(updated as Listing);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save listing");
    } finally {
      setSaving(false);
      actionLoader.hide();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <h2 className="font-heading font-bold text-primary-dark text-base">
            Edit Listing
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
        >
          {/* Title */}
          <Field label="Title">
            <input
              className={inputCls}
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={160}
            />
          </Field>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className={inputCls}
                value={form.type ?? "SALE"}
                onChange={(e) =>
                  set("type", e.target.value as UpdateListingPayload["type"])
                }
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status ?? "ACTIVE"}
                onChange={(e) => set("status", e.target.value as ListingStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Property type */}
          <Field label="Property Type">
            <input
              className={inputCls}
              value={form.propertyType ?? ""}
              onChange={(e) => set("propertyType", e.target.value)}
              placeholder="e.g. Apartment, Duplex, Bungalow"
              maxLength={80}
            />
          </Field>

          {/* Price + Period */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₦)">
              <input
                type="number"
                className={inputCls}
                value={form.priceNaira ?? ""}
                onChange={(e) => set("priceNaira", Number(e.target.value) || 0)}
                min={0}
                required
              />
            </Field>
            <Field label="Period (for rent)">
              <input
                className={inputCls}
                value={form.period ?? ""}
                onChange={(e) => set("period", e.target.value)}
                placeholder="e.g. year, month"
                maxLength={20}
              />
            </Field>
          </div>

          {/* Address */}
          <Field label="Address">
            <input
              className={inputCls}
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              maxLength={240}
              required
            />
          </Field>

          {/* Location */}
          <Field label="Location">
            <input
              className={inputCls}
              value={form.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
              maxLength={120}
              required
            />
          </Field>

          {/* Beds / Baths / Sqft / Year */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Beds">
              <input
                type="number"
                className={inputCls}
                value={form.beds ?? ""}
                onChange={(e) => set("beds", Number(e.target.value))}
                min={0}
              />
            </Field>
            <Field label="Baths">
              <input
                type="number"
                className={inputCls}
                value={form.baths ?? ""}
                onChange={(e) => set("baths", Number(e.target.value))}
                min={0}
              />
            </Field>
            <Field label="Sqft">
              <input
                className={inputCls}
                value={form.sqft ?? ""}
                onChange={(e) => set("sqft", e.target.value)}
                maxLength={40}
              />
            </Field>
            <Field label="Year Built">
              <input
                className={inputCls}
                value={form.yearBuilt ?? ""}
                onChange={(e) => set("yearBuilt", e.target.value)}
                maxLength={20}
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              className={textareaCls}
              rows={4}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              maxLength={5000}
            />
          </Field>

          {/* Features */}
          <Field label="Features (one per line)">
            <textarea
              className={textareaCls}
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Swimming Pool&#10;24/7 Security&#10;Parking Space"
            />
          </Field>

          {/* Cover Image */}
          <Field label="Cover Image URL">
            <input
              className={inputCls}
              value={form.coverImage ?? ""}
              onChange={(e) => set("coverImage", e.target.value)}
              placeholder="https://…"
            />
          </Field>

          {/* Images */}
          <Field label="Gallery Image URLs (one per line)">
            <textarea
              className={textareaCls}
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder="https://…&#10;https://…"
            />
          </Field>

          {/* Virtual tour + video */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Virtual Tour URL">
              <input
                className={inputCls}
                value={form.virtualTourUrl ?? ""}
                onChange={(e) => set("virtualTourUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Video URL">
              <input
                className={inputCls}
                value={form.videoUrl ?? ""}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          {error && <p className="text-red-600 text-xs font-medium">{error}</p>}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-light">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit as any}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner className="w-3.5 h-3.5" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

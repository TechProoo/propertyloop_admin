import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  ImageOff,
  Upload,
  Video,
  X,
} from "lucide-react";
import { adminService, uploadService } from "@/api/services";
import RichTextEditor from "@/components/ui/RichTextEditor";
import type {
  FeaturedProperty,
  CreateFeaturedPropertyPayload,
} from "@/api/types";
import {
  Button,
  EmptyState,
  GlassCard,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { usePageTitle } from "@/lib/usePageTitle";
import { actionLoader } from "@/lib/actionLoader";

const PROPERTY_TYPES = [
  "Apartment",
  "Duplex",
  "Bungalow",
  "Terraced House",
  "Semi-Detached",
  "Detached",
  "Penthouse",
  "Studio",
  "Land",
  "Commercial",
  "Warehouse",
  "Office",
  "Shop",
  "Other",
];

type ListingType = "SALE" | "RENT" | "SHORTLET";

const EMPTY_FORM: Omit<CreateFeaturedPropertyPayload, "priceNaira"> & {
  priceNaira: string;
} = {
  title: "",
  location: "",
  priceNaira: "",
  priceLabel: "",
  type: "SALE",
  propertyType: "Apartment",
  beds: 0,
  baths: 0,
  sqft: "",
  imageUrls: [],
  videoUrls: [],
  description: "",
  displayOrder: 0,
  active: true,
};

export default function FeaturedAds() {
  usePageTitle("Featured Ads");

  const [items, setItems] = useState<FeaturedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeaturedProperty | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const multiVideoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<FeaturedProperty | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listFeaturedProperties();
      setItems(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load featured properties",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: FeaturedProperty) => {
    setEditing(p);
    setForm({
      title: p.title,
      location: p.location,
      priceNaira: String(p.priceNaira),
      priceLabel: p.priceLabel,
      type: p.type,
      propertyType: p.propertyType,
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft ?? "",
      imageUrls: p.imageUrls ?? [],
      videoUrls: p.videoUrls?.length
        ? p.videoUrls
        : p.videoUrl
          ? [p.videoUrl]
          : [],
      description: p.description ?? "",
      displayOrder: p.displayOrder ?? 0,
      active: p.active,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file.");
      return;
    }
    setUploading(true);
    setFormError(null);
    try {
      const url = await uploadService.uploadFeaturedPropertyImage(file);
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setFormError("Please select a video file.");
      return;
    }
    setVideoUploading(true);
    setFormError(null);
    try {
      const url = await uploadService.uploadFeaturedPropertyVideo(file);
      setForm((f) => ({ ...f, videoUrls: [...(f.videoUrls ?? []), url] }));
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? "Video upload failed.");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleSave = async () => {
    if (uploading || videoUploading) return;
    if (
      !form.title.trim() ||
      !form.location.trim() ||
      form.imageUrls.length === 0 ||
      !form.priceLabel.trim()
    ) {
      setFormError(
        "Title, location, at least one image, and price label are required.",
      );
      return;
    }
    const price = Number(form.priceNaira);
    if (isNaN(price) || price <= 0) {
      setFormError("Enter a valid price.");
      return;
    }

    setSaving(true);
    actionLoader.show(
      editing ? "Saving changes…" : "Creating featured property…",
    );
    try {
      const payload: CreateFeaturedPropertyPayload = {
        title: form.title.trim(),
        location: form.location.trim(),
        priceNaira: price,
        priceLabel: form.priceLabel.trim(),
        type: form.type as ListingType,
        propertyType: form.propertyType,
        beds: Number(form.beds),
        baths: Number(form.baths),
        sqft: form.sqft.trim() || undefined,
        imageUrls: form.imageUrls,
        videoUrls: form.videoUrls ?? [],
        description: form.description || undefined,
        displayOrder: Number(form.displayOrder) || 0,
        active: form.active,
      };

      if (editing) {
        const updated = await adminService.updateFeaturedProperty(
          editing.id,
          payload,
        );
        setItems((prev) =>
          prev.map((p) => (p.id === editing.id ? updated : p)),
        );
      } else {
        const created = await adminService.createFeaturedProperty(payload);
        setItems((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(
        e?.response?.data?.message ?? "Save failed. Please try again.",
      );
    } finally {
      setSaving(false);
      actionLoader.hide();
    }
  };

  const toggleActive = async (p: FeaturedProperty) => {
    actionLoader.show(p.active ? "Hiding property…" : "Showing property…");
    try {
      const updated = await adminService.updateFeaturedProperty(p.id, {
        active: !p.active,
      });
      setItems((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update status.");
    } finally {
      actionLoader.hide();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    actionLoader.show("Deleting…");
    try {
      await adminService.deleteFeaturedProperty(deleteTarget.id);
      setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete.");
    } finally {
      setDeleting(false);
      actionLoader.hide();
    }
  };

  const fmtPrice = (n: number) => "₦" + n.toLocaleString("en-NG");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Featured Ads"
        subtitle="Manage properties shown in the hero gallery on the public waitlist page."
        actions={
          <Button onClick={openAdd} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Property
          </Button>
        }
      />

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <GlassCard className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={load}>Retry</Button>
        </GlassCard>
      )}

      {!loading && !error && items.length === 0 && (
        <>
          <EmptyState
            icon={<Star className="w-10 h-10 text-text-secondary" />}
            title="No featured properties"
            message="Add a property to start featuring it on the hero gallery."
          />
          <div className="flex justify-center mt-4">
            <Button onClick={openAdd}>Add your first property</Button>
          </div>
        </>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <GlassCard key={p.id} className="p-0 overflow-hidden flex flex-col">
              {/* Image */}
              <div className="relative h-44 bg-bg-secondary overflow-hidden">
                {p.imageUrls?.[0] ? (
                  <img
                    src={p.imageUrls[0]}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    <ImageOff className="w-8 h-8" />
                  </div>
                )}
                {p.imageUrls?.length > 1 && (
                  <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/60 text-white">
                    +{p.imageUrls.length - 1} more
                  </span>
                )}
                {/* Status badge */}
                <span
                  className={`absolute top-2 right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    p.active
                      ? "bg-green-500/90 text-white"
                      : "bg-gray-600/90 text-white"
                  }`}
                >
                  {p.active ? "Active" : "Hidden"}
                </span>
                {/* Type badge */}
                <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                  {p.type}
                </span>
                <span className="absolute top-8 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#2f9e61]/90 text-white">
                  #{p.displayOrder + 1}
                </span>
                {((p.videoUrls?.length ?? 0) > 0 || p.videoUrl) && (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/60 text-white">
                    <Video className="w-3 h-3" />
                    {(p.videoUrls?.length ?? 0) > 1 ? `${p.videoUrls!.length} videos` : "Video"}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-1 flex-1">
                <h3 className="font-heading font-bold text-primary-dark text-sm line-clamp-1">
                  {p.title}
                </h3>
                <p className="text-text-secondary text-xs line-clamp-1">
                  {p.location}
                </p>
                <p className="text-[#2f9e61] font-semibold text-sm mt-1">
                  {fmtPrice(p.priceNaira)}
                  {p.priceLabel && (
                    <span className="text-text-secondary font-normal text-xs ml-1">
                      {p.priceLabel}
                    </span>
                  )}
                </p>
                <div className="flex gap-2 text-xs text-text-secondary mt-0.5">
                  <span>{p.beds} bed</span>
                  <span>·</span>
                  <span>{p.baths} bath</span>
                  {p.sqft && (
                    <>
                      <span>·</span>
                      <span>{p.sqft}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-border-light divide-x divide-border-light">
                <button
                  onClick={() => toggleActive(p)}
                  title={p.active ? "Hide from gallery" : "Show in gallery"}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  {p.active ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* ─── Add / Edit Modal ───────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="font-heading font-bold text-primary-dark text-base">
                {editing ? "Edit Featured Property" : "Add Featured Property"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-primary hover:bg-primary/5 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Property Images <span className="text-red-500">*</span>
                  <span className="text-text-subtle ml-1">
                    (first shown as cover, rest shown on detail page)
                  </span>
                </label>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach((file) => handleImageFile(file));
                    e.target.value = "";
                  }}
                />

                {/* Uploaded thumbnails */}
                {form.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.imageUrls.map((url, idx) => (
                      <div
                        key={url}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-border-light group"
                      >
                        <img
                          src={url}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-black/60 text-white py-0.5">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              imageUrls: f.imageUrls.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone / add more button */}
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    files.forEach((file) => handleImageFile(file));
                  }}
                  className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                    uploading
                      ? "border-primary/40 bg-primary/5 cursor-wait"
                      : "border-border-light hover:border-primary/50 bg-white/40"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    {uploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs text-text-secondary">
                          Uploading…
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-text-subtle" />
                        <span className="text-xs text-text-secondary text-center">
                          {form.imageUrls.length > 0
                            ? "Add more images"
                            : "Click or drag & drop to upload"}
                          <br />
                          <span className="text-text-subtle">
                            JPG, PNG, WEBP up to 10 MB
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Video upload */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Property Videos{" "}
                  <span className="text-text-subtle">(optional — multiple allowed)</span>
                </label>

                <input
                  ref={multiVideoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach((file) => handleVideoFile(file));
                    e.target.value = "";
                  }}
                />

                {/* Uploaded videos list */}
                {(form.videoUrls ?? []).length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    {(form.videoUrls ?? []).map((url, idx) => (
                      <div
                        key={url}
                        className="relative rounded-xl overflow-hidden border border-border-light bg-black/5"
                      >
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 border-b border-border-light text-[11px] text-text-secondary font-medium">
                          <Video className="w-3 h-3" /> Video {idx + 1}
                        </div>
                        <video
                          src={url}
                          controls
                          className="w-full max-h-40 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              videoUrls: (f.videoUrls ?? []).filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          title="Remove video"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onClick={() => !videoUploading && multiVideoInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    files.forEach((file) => handleVideoFile(file));
                  }}
                  className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                    videoUploading
                      ? "border-primary/40 bg-primary/5 cursor-wait"
                      : "border-border-light hover:border-primary/50 bg-white/40"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    {videoUploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs text-text-secondary">
                          Uploading video…
                        </span>
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-text-subtle" />
                        <span className="text-xs text-text-secondary text-center">
                          {(form.videoUrls ?? []).length > 0
                            ? "Add another video"
                            : "Click or drag & drop to upload"}
                          <br />
                          <span className="text-text-subtle">
                            MP4, MOV, WEBM up to 200 MB
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Luxury 3-Bedroom Duplex"
                  className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Price + Label */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.priceNaira}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priceNaira: e.target.value }))
                    }
                    placeholder="e.g. 85000000"
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Price Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.priceLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priceLabel: e.target.value }))
                    }
                    placeholder="e.g. /yr or outright"
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Type + Property Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Listing Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as ListingType,
                      }))
                    }
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                    <option value="SHORTLET">Shortlet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Property Type
                  </label>
                  <select
                    value={form.propertyType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, propertyType: e.target.value }))
                    }
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark focus:outline-none focus:border-primary transition-colors"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Beds, Baths, Sqft */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Beds
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.beds}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, beds: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Baths
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.baths}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, baths: Number(e.target.value) }))
                    }
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Sqft
                  </label>
                  <input
                    value={form.sqft}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sqft: e.target.value }))
                    }
                    placeholder="e.g. 1,200"
                    className="w-full h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark placeholder:text-text-subtle focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description{" "}
                  <span className="text-text-subtle">(optional)</span>
                </label>
                <RichTextEditor
                  value={form.description ?? ""}
                  onChange={(html) =>
                    setForm((f) => ({ ...f, description: html }))
                  }
                  placeholder="Describe the property — highlights, features, neighbourhood…"
                />
              </div>

              {/* Display order + Active toggle */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        displayOrder: Number(e.target.value),
                      }))
                    }
                    className="w-20 h-9 px-3 rounded-xl bg-white/70 border border-border-light text-sm text-primary-dark text-center focus:outline-none focus:border-primary transition-colors"
                  />
                  <span className="text-[10px] text-text-subtle">
                    0 = first
                  </span>
                </div>

                <div className="w-px h-12 bg-border-light" />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${
                    form.active ? "bg-primary" : "bg-border-light"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      form.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-text-secondary">
                  {form.active
                    ? "Active — visible on hero gallery"
                    : "Hidden from gallery"}
                </span>
              </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSave}
                disabled={saving || uploading || videoUploading}
              >
                {uploading || videoUploading
                  ? "Uploading…"
                  : saving
                    ? "Saving…"
                    : editing
                      ? "Save Changes"
                      : "Create Property"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Dialog ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h2 className="font-heading font-bold text-primary-dark text-base mb-2">
              Delete Featured Property?
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              <strong className="text-primary-dark">
                {deleteTarget.title}
              </strong>{" "}
              will be permanently removed from the hero gallery. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

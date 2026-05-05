"use client";

import { useState, useEffect, useRef } from "react";

interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
  category: string;
}

interface PhotoGalleryProps {
  jobId: string;
}

const CATEGORIES = ["Site", "Foundation", "Framing", "Roofing", "Exterior", "Interior", "Final", "Other"];

export function PhotoGallery({ jobId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [newCategory, setNewCategory] = useState("Site");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos from localStorage
  useEffect(() => {
    const storageKey = `photos-${jobId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPhotos(parsed);
      } catch {
        // ignore parse errors
      }
    }
    setIsLoaded(true);
  }, [jobId]);

  // Save photos to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = `photos-${jobId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
      setError("");
    } catch {
      setError("Photo storage is full. Delete a few photos or upload smaller ones.");
    }
  }, [photos, jobId, isLoaded]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(String(event.target?.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const compressImage = (src: string) =>
    new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        let { width, height } = img;
        if (width > max || height > max) {
          const ratio = Math.min(max / width, max / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploaded: Photo[] = [];
      for (const file of Array.from(files)) {
        const raw = await fileToDataUrl(file);
        const optimized = await compressImage(raw);
        uploaded.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          url: optimized,
          caption: newCaption || file.name,
          date: new Date().toLocaleDateString(),
          category: newCategory,
        });
      }

      setPhotos((prev) => [...prev, ...uploaded]);
      setError("");
    } catch {
      setError("Upload failed. Try again.");
    }

    // Reset
    setNewCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const updateCaption = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  };

  const filteredPhotos = (selectedCategory === "All"
    ? photos
    : photos.filter((p) => p.category === selectedCategory)
  ).slice().reverse();

  if (!isLoaded) {
    return <div className="p-5 text-zinc-500">Loading photos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Photo Gallery</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          + Add Photos
        </button>
      </div>

      {/* Upload controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Optional caption..."
          value={newCaption}
          onChange={(e) => setNewCaption(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`rounded-full px-3 py-1 text-sm transition ${
            selectedCategory === "All"
              ? "bg-emerald-600 text-white"
              : "border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/5"
          }`}
        >
          All ({photos.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = photos.filter((p) => p.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 bg-black/30 text-zinc-400 hover:bg-white/5"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Photo grid */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
          <p className="text-zinc-500">No photos yet. Click "Add Photos" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-[4/3] w-full cursor-pointer object-cover transition group-hover:opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                <input
                  type="text"
                  value={photo.caption}
                  onChange={(e) => updateCaption(photo.id, e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                  placeholder="Add caption..."
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {photo.category} · {photo.date}
                  </span>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-300">
              <p>{selectedPhoto.caption} · {selectedPhoto.category} · {selectedPhoto.date}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
                    if (idx > 0) setSelectedPhoto(filteredPhotos[idx - 1]);
                  }}
                  className="rounded border border-white/20 px-2 py-1 text-xs"
                >
                  Prev
                </button>
                <button
                  onClick={() => {
                    const idx = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id);
                    if (idx >= 0 && idx < filteredPhotos.length - 1) setSelectedPhoto(filteredPhotos[idx + 1]);
                  }}
                  className="rounded border border-white/20 px-2 py-1 text-xs"
                >
                  Next
                </button>
                <button onClick={() => setSelectedPhoto(null)} className="rounded border border-white/20 px-2 py-1 text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

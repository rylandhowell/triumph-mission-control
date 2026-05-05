"use client";

import { useEffect, useRef, useState } from "react";

type FileItem = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
};

export function FilesClient() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mission-files");
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("mission-files", JSON.stringify(files));
      setError("");
    } catch {
      setError("Storage full. Remove some files.");
    }
  }, [files, loaded]);

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;

    const next: FileItem[] = [];
    for (const file of Array.from(selected)) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = () => reject(new Error("read failed"));
        r.readAsDataURL(file);
      });
      next.push({ id: `${Date.now()}-${Math.random()}`, name: file.name, size: file.size, uploadedAt: new Date().toLocaleString(), dataUrl });
    }

    setFiles((prev) => [...next, ...prev]);
    e.currentTarget.value = "";
  };

  const remove = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="space-y-6">
      <section className="mission-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Files</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Job Files</h2>
          </div>
          <button onClick={() => inputRef.current?.click()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Upload files</button>
          <input ref={inputRef} type="file" multiple onChange={onSelect} className="hidden" />
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      <section className="mission-panel p-6">
        {files.length ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div>
                  <p className="text-sm text-zinc-100">{file.name}</p>
                  <p className="text-xs text-zinc-500">{Math.round(file.size / 1024)} KB · {file.uploadedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={file.dataUrl} download={file.name} className="rounded border border-white/10 px-2 py-1 text-xs text-zinc-300">Open</a>
                  <button onClick={() => remove(file.id)} className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No files uploaded yet.</p>
        )}
      </section>
    </div>
  );
}

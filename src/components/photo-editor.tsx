import { useState, type DragEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, RotateCcw } from "lucide-react";
import { notifyCms } from "@/lib/cms";
import { readPhotoFile } from "@/lib/read-photo-file";
import {
  photoSlots,
  savePhoto,
  stockPhotos,
  type PhotoSlot,
  type SitePhoto,
} from "@/lib/site-photos";

export function usePhotoDesk({
  pin,
  photos,
  onSaved,
}: {
  pin: string;
  photos: Record<string, SitePhoto>;
  onSaved: (photos: Record<string, SitePhoto>) => void;
}) {
  const save = useServerFn(savePhoto);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [libraryFor, setLibraryFor] = useState<string | null>(null);

  async function persist(id: string, src: string, current: SitePhoto) {
    setBusyId(id);
    setStatus((prev) => ({ ...prev, [id]: "Saving…" }));
    try {
      const res = await save({
        data: {
          pin,
          id,
          src,
          alt: current.alt,
          caption: current.caption,
        },
      });
      onSaved(res.photos);
      notifyCms({ photos: res.photos });
      setStatus((prev) => ({ ...prev, [id]: "Live on the site" }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Could not save",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function takeFile(
    id: string,
    current: SitePhoto,
    file: File | undefined,
  ) {
    if (!file) return;
    setBusyId(id);
    setStatus((prev) => ({ ...prev, [id]: "Reading photo…" }));
    try {
      const src = await readPhotoFile(file, {
        keepTransparency: id === "logo",
      });
      await persist(id, src, current);
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Could not read photo",
      }));
      setBusyId(null);
    }
  }

  async function saveCaption(id: string, current: SitePhoto, caption: string) {
    await persist(id, current.src, { ...current, caption });
  }

  async function revert(id: string) {
    const slot = photoSlots.find((item) => item.id === id);
    const current = photos[id];
    if (!slot || !current) return;
    await persist(id, slot.defaultSrc, {
      ...current,
      alt: slot.alt,
      caption: slot.caption || current.caption,
    });
  }

  return {
    photos,
    persist,
    takeFile,
    saveCaption,
    revert,
    status,
    busyId,
    libraryFor,
    setLibraryFor,
  };
}

export function PhotoSlotCard({
  item,
  desk,
  showCaption = false,
  large = false,
}: {
  item: PhotoSlot;
  desk: ReturnType<typeof usePhotoDesk>;
  showCaption?: boolean;
  large?: boolean;
}) {
  const current = desk.photos[item.id];
  const busy = desk.busyId === item.id;
  const note = desk.status[item.id];
  const live = note === "Live on the site";
  const usingDefault =
    current.src.split("?")[0] === item.defaultSrc.split("?")[0];

  return (
    <li className="overflow-hidden border border-line bg-surface">
      <PhotoDrop
        id={item.id}
        label={item.label}
        photo={current}
        busy={busy}
        large={large}
        onFile={(file) => void desk.takeFile(item.id, current, file)}
      />
      <div className="space-y-3 p-3">
        <div className="flex min-h-6 items-start justify-between gap-2">
          <p className="font-medium leading-tight">{item.label}</p>
          {live ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Check className="size-3.5" />
              Live
            </span>
          ) : note ? (
            <span className="text-right text-xs text-primary">{note}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn btn-fill cursor-pointer text-sm">
            Change photo
            <input
              id={`photo-file-${item.id}`}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void desk.takeFile(item.id, current, file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              desk.setLibraryFor((open) =>
                open === item.id ? null : item.id,
              )
            }
            className="btn btn-line"
          >
            House photos
          </button>
          {usingDefault ? null : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void desk.revert(item.id)}
              className="btn btn-line"
            >
              <RotateCcw className="size-4" />
              House default
            </button>
          )}
        </div>
        {desk.libraryFor === item.id ? (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {stockPhotos.map((stock) => (
              <button
                key={stock.src}
                type="button"
                title={stock.label}
                disabled={busy}
                onClick={() => void desk.persist(item.id, stock.src, current)}
                className={`overflow-hidden border ${
                  current.src.split("?")[0] === stock.src
                    ? "border-primary"
                    : "border-line"
                }`}
              >
                <img
                  src={stock.src}
                  alt={stock.label}
                  className="h-12 w-full bg-bg object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
        {showCaption ? (
          <label className="block text-sm text-muted">
            Caption
            <input
              className="mt-1 w-full border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-primary"
              defaultValue={current.caption}
              maxLength={80}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next === current.caption) return;
                void desk.saveCaption(item.id, current, next);
              }}
            />
          </label>
        ) : null}
      </div>
    </li>
  );
}

export function PhotoSlotGrid({
  ids,
  desk,
  captions = false,
  large = false,
}: {
  ids: string[];
  desk: ReturnType<typeof usePhotoDesk>;
  captions?: boolean;
  large?: boolean;
}) {
  const items = ids
    .map((id) => photoSlots.find((slot) => slot.id === id))
    .filter((slot): slot is PhotoSlot => Boolean(slot));
  const cols =
    items.length === 1
      ? "grid-cols-1"
      : items.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <ul className={`grid gap-4 ${cols}`}>
      {items.map((item) => (
        <PhotoSlotCard
          key={item.id}
          item={item}
          desk={desk}
          showCaption={captions}
          large={large || items.length === 1}
        />
      ))}
    </ul>
  );
}

function PhotoDrop({
  id,
  label,
  photo,
  busy,
  large,
  onFile,
}: {
  id: string;
  label: string;
  photo: SitePhoto;
  busy: boolean;
  large: boolean;
  onFile: (file: File) => void;
}) {
  const [over, setOver] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      htmlFor={`photo-file-${id}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`relative block cursor-pointer ${
        over ? "ring-2 ring-inset ring-primary" : ""
      }`}
    >
      <img
        src={photo.src}
        alt={photo.alt || label}
        className={`slot-photo w-full bg-bg ${large ? "is-large" : ""} ${
          id === "logo" ? "object-contain p-6" : "object-cover"
        } ${busy ? "opacity-70" : ""}`}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-fg/80 to-transparent px-3 pb-3 pt-10">
        <span className="bg-primary px-3 py-1.5 text-sm font-medium text-bg">
          {busy ? "Saving…" : over ? "Drop to replace" : "Change photo"}
        </span>
      </span>
    </label>
  );
}

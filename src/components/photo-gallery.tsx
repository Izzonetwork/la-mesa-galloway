import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { photoSlots } from "@/lib/site-photos";
import { usePhotos } from "@/components/site-photos";

function useInView<T extends HTMLElement>(rootMargin = "280px 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}

function LazyThumb({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);

  return (
    <div ref={ref} className="gallery-tile relative w-full bg-fg">
      {!loaded ? (
        <div className="absolute inset-0 bg-fg" aria-hidden="true" />
      ) : null}
      {inView ? (
        <img
          src={src}
          alt={alt}
          decoding="async"
          fetchPriority="low"
          sizes="(min-width: 768px) 25vw, 50vw"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <span className="sr-only">{alt}</span>
      )}
    </div>
  );
}

export function PhotoGallery() {
  const media = usePhotos();
  const gallery = photoSlots
    .filter((slot) => slot.group === "Gallery")
    .map((slot) => ({
      id: slot.id,
      ...(media[slot.id] ?? {
        src: slot.defaultSrc,
        alt: slot.alt,
        caption: slot.caption,
      }),
    }));
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.getElementById("lightbox-close")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") {
        setOpen((i) => (i === null ? i : (i + 1) % gallery.length));
      }
      if (e.key === "ArrowLeft") {
        setOpen((i) =>
          i === null ? i : (i - 1 + gallery.length) % gallery.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnTo?.focus();
    };
  }, [open, gallery.length]);

  const current = open === null ? null : gallery[open];

  return (
    <section id="photos" className="snap band bg-fg text-bg">
      <div className="wrap">
        <p className="eyebrow">Gallery</p>
        <h2 className="display mt-2">The table, the bar, the plate.</h2>
        <div className="mt-10 grid grid-cols-2 gap-2 md:grid-cols-4">
          {gallery.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpen(index)}
              className={`photo-zoom group relative ${index < 2 ? "col-span-2 gallery-wide" : ""}`}
            >
              <LazyThumb src={photo.src} alt={photo.alt} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/90 to-transparent px-3 py-2 text-left text-sm text-bg">
                {photo.caption}
              </span>
            </button>
          ))}
        </div>
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-fg/92 p-5"
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={() => setOpen(null)}
        >
          <button
            id="lightbox-close"
            type="button"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center border border-bg/20 text-bg"
            aria-label="Close photo"
            onClick={() => setOpen(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={current.src}
            alt={current.alt}
            decoding="async"
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
}

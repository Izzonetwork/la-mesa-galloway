import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ImgHTMLAttributes,
} from "react";
import { CMS_EVENT, type CmsPayload } from "@/lib/cms";
import { emptyFlyer, getPublicFlyer, type Flyer } from "@/lib/flyer";
import { defaultCopy, getPublicCopy, type SiteCopy } from "@/lib/site-copy";
import {
  defaultMenu,
  getPublicMenu,
  liveMenu,
  type SiteMenu,
} from "@/lib/site-menu";
import {
  defaultPhotoMap,
  getPublicPhotos,
  type SitePhoto,
} from "@/lib/site-photos";
import { resolveHours, type HoursRow } from "@/lib/restaurant";

const PhotoContext = createContext<Record<string, SitePhoto>>(defaultPhotoMap());
const CopyContext = createContext<SiteCopy>(defaultCopy);
const MenuContext = createContext<SiteMenu>(defaultMenu);
const FlyerContext = createContext<Flyer | null>(emptyFlyer);

export function SitePhotosProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<Record<string, SitePhoto>>(defaultPhotoMap);
  const [copy, setCopy] = useState<SiteCopy>(defaultCopy);
  const [menu, setMenu] = useState<SiteMenu>(defaultMenu);
  const [flyer, setFlyer] = useState<Flyer | null>(emptyFlyer);

  useEffect(() => {
    let live = true;
    function refresh() {
      getPublicPhotos()
        .then((row) => {
          if (live) setPhotos(row);
        })
        .catch(() => {
          if (live) setPhotos(defaultPhotoMap());
        });
      getPublicCopy()
        .then((row) => {
          if (live) setCopy(row);
        })
        .catch(() => {
          if (live) setCopy(defaultCopy);
        });
      getPublicMenu()
        .then((row) => {
          if (live) setMenu(row);
        })
        .catch(() => {
          if (live) setMenu(defaultMenu);
        });
      getPublicFlyer()
        .then((row) => {
          if (live) setFlyer(row);
        })
        .catch(() => {
          if (live) setFlyer(emptyFlyer);
        });
    }
    function onCms(event: Event) {
      const detail = (event as CustomEvent<CmsPayload>).detail;
      if (detail?.photos) setPhotos(detail.photos);
      if (detail?.copy) setCopy(detail.copy);
      if (detail?.menu) setMenu(liveMenu(detail.menu));
      if (detail && "flyer" in detail) setFlyer(detail.flyer ?? null);
      if (
        !detail?.photos &&
        !detail?.copy &&
        !detail?.menu &&
        !(detail && "flyer" in detail)
      ) {
        refresh();
      }
    }
    refresh();
    window.addEventListener(CMS_EVENT, onCms);
    window.addEventListener("focus", refresh);
    return () => {
      live = false;
      window.removeEventListener(CMS_EVENT, onCms);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <PhotoContext.Provider value={photos}>
      <CopyContext.Provider value={copy}>
        <MenuContext.Provider value={menu}>
          <FlyerContext.Provider value={flyer}>{children}</FlyerContext.Provider>
        </MenuContext.Provider>
      </CopyContext.Provider>
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  return useContext(PhotoContext);
}

export function useCopy() {
  return useContext(CopyContext);
}

export function useMenu() {
  return useContext(MenuContext);
}

export function useFlyer() {
  return useContext(FlyerContext);
}

export function useHours(): HoursRow[] {
  return resolveHours(useCopy().hours);
}

export function SiteImg({
  slot,
  className,
  sizes,
  loading: loadingProp,
  ...rest
}: {
  slot: string;
  className?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const photos = usePhotos();
  const photo = photos[slot] ?? defaultPhotoMap()[slot];
  if (!photo) return null;
  const loading =
    rest.fetchPriority === "high" || loadingProp === "eager"
      ? "eager"
      : (loadingProp ?? "lazy");
  return (
    <img
      decoding="async"
      draggable={false}
      {...rest}
      src={photo.src}
      alt={photo.alt}
      className={className}
      loading={loading}
      sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
    />
  );
}

import type { SiteCopy } from "@/lib/site-copy";
import type { SitePhoto } from "@/lib/site-photos";
import type { Flyer } from "@/lib/flyer";
import type { SiteMenu } from "@/lib/site-menu";

export const CMS_EVENT = "lamesa-cms";

export type CmsPayload = {
  photos?: Record<string, SitePhoto>;
  copy?: SiteCopy;
  flyer?: Flyer | null;
  menu?: SiteMenu;
};

export function notifyCms(detail?: CmsPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CmsPayload>(CMS_EVENT, { detail }));
}

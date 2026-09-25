import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Menu, Phone, X } from "lucide-react";
import { openStatus, restaurant } from "@/lib/restaurant";
import { handleHashClick, handleHomeClick } from "@/lib/scroll-to";
import { SiteImg, useHours } from "@/components/site-photos";

const links = [
  { href: "#events", label: "Special Event" },
  { href: "#menu", label: "Menu" },
  { href: "#order", label: "Order" },
  { href: "#drinks", label: "Drinks" },
  { href: "#photos", label: "Photos" },
  { href: "#visit", label: "Visit" },
  { href: "#banquets", label: "Banquets" },
  { href: "#contact", label: "Contact" },
];

const drawerLinks = [{ href: "#top", label: "Home" }, ...links];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const status = openStatus(useHours());
  const drawerId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ids = drawerLinks.map((l) => l.href.slice(1));
    const seen = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best = "";
        let ratio = 0;
        for (const id of ids) {
          const value = seen.get(id) ?? 0;
          if (value > ratio) {
            ratio = value;
            best = `#${id}`;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.2, 0.45, 0.7] },
    );
    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) obs.observe(node);
    }
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(event: MouseEvent<HTMLAnchorElement>, href: string) {
    const wasOpen = open;
    document.body.style.overflow = "";
    setOpen(false);
    handleHashClick(event, href, wasOpen ? 80 : 0);
  }

  return (
    <header className="site-header sticky top-0 z-50 bg-fg text-bg">
      <div className="wrap flex items-center justify-between py-2 md:py-4">
        <a
          href="/"
          className="flex items-center"
          aria-label="La Mesa home"
          onClick={(event) => {
            document.body.style.overflow = "";
            const wasOpen = open;
            setOpen(false);
            handleHomeClick(event, wasOpen ? 80 : 0);
          }}
        >
          <SiteImg
            slot="logo"
            loading="eager"
            width={480}
            height={359}
            sizes="120px"
            className="h-10 w-auto object-contain md:h-16"
          />
        </a>
        <nav className="hidden items-center gap-5 xl:gap-6 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[0.95rem] tracking-wide hover:text-accent ${active === l.href ? "text-accent" : "text-bg/90"}`}
              aria-current={active === l.href ? "true" : undefined}
              onClick={(event) => go(event, l.href)}
            >
              {l.label}
            </a>
          ))}
          <a
            href={restaurant.reserveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sage btn-pill"
          >
            Reserve a Table
          </a>
        </nav>
        <div className="flex items-center gap-1 lg:hidden">
          <a
            href={`tel:${restaurant.phoneTel}`}
            className="inline-flex size-11 items-center justify-center text-bg"
            aria-label={`Call ${restaurant.phone}`}
          >
            <Phone className="size-5" />
          </a>
          <button
            ref={buttonRef}
            type="button"
            className="relative inline-flex size-11 items-center justify-center text-bg"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative size-5">
              <X
                className={`icon-swap ${open ? "is-on" : ""} absolute inset-0 size-5`}
                aria-hidden="true"
              />
              <Menu
                className={`icon-swap ${open ? "" : "is-on"} size-5`}
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`nav-scrim lg:hidden ${open ? "is-open" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => {
          setOpen(false);
          buttonRef.current?.focus();
        }}
      />
      <nav
        ref={panelRef}
        id={drawerId}
        className={`nav-drawer lg:hidden ${open ? "is-open" : ""}`}
        aria-label="Primary"
        aria-hidden={!open}
      >
        <p className="mb-6 flex items-center gap-2 text-sm text-accent">
          <span
            className={`pulse-dot ${status.open ? "is-open" : ""}`}
            aria-hidden="true"
          />
          {status.label}
        </p>
        <div className="nav-list flex flex-col">
          {drawerLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`nav-link ${active === l.href ? "is-here" : ""}`}
              aria-current={active === l.href ? "true" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={(event) => go(event, l.href)}
            >
              {l.label}
            </a>
          ))}
        </div>
        <a
          href={restaurant.reserveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sage btn-pill mt-8"
          tabIndex={open ? 0 : -1}
        >
          Reserve a Table
        </a>
        <a
          href={`tel:${restaurant.phoneTel}`}
          className="btn btn-ghost btn-pill mt-3"
          tabIndex={open ? 0 : -1}
        >
          Call {restaurant.phone}
        </a>
      </nav>
    </header>
  );
}

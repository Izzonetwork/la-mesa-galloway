import { Phone, CalendarDays, Utensils } from "lucide-react";
import { restaurant } from "@/lib/restaurant";
import { handleHashClick } from "@/lib/scroll-to";

export function MobileDock() {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-bg/15 bg-fg px-2 pt-2 text-bg md:hidden"
      aria-label="Quick actions"
    >
      <a
        href={`tel:${restaurant.phoneTel}`}
        className="flex min-h-11 flex-col items-center justify-center gap-1 text-xs text-bg"
      >
        <Phone className="size-4 text-accent" />
        Call
      </a>
      <a
        href={restaurant.reserveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sage mx-1"
      >
        <CalendarDays className="size-4" />
        Reserve
      </a>
      <a
        href="#order"
        className="flex min-h-11 flex-col items-center justify-center gap-1 text-xs text-bg"
        onClick={(event) => handleHashClick(event, "#order")}
      >
        <Utensils className="size-4 text-accent" />
        Order
      </a>
    </nav>
  );
}

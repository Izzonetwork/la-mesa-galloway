import { ExternalLink } from "lucide-react";
import { restaurant } from "@/lib/restaurant";

export function OrderLinks({
  variant = "solid",
}: {
  variant?: "solid" | "ghost";
}) {
  const className = variant === "solid" ? "btn btn-fill w-full sm:w-auto" : "btn btn-line w-full sm:w-auto";

  return (
    <div className="flex flex-wrap gap-3">
      {restaurant.order.map((service) => (
        <a
          key={service.name}
          href={service.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {service.name}
          <ExternalLink className="size-4" />
        </a>
      ))}
    </div>
  );
}

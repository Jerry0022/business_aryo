import {
  ClipboardCheck,
  Droplet,
  Flag,
  GraduationCap,
  Hammer,
  Handshake,
  Laptop,
  Rows3,
  Sun,
  Truck,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { EVENT_TYPES } from "@/lib/business/calendar";

// Colour and icon per event type. The colours are tuned for the dark studio background: all of
// them reach at least 4.5:1 contrast on the panel colour and their lightness is spread from
// L* 56 (Büro) to L* 88 (Einweisung), so neighbouring types stay distinguishable without hue.

export interface TypeStyle {
  key: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

const STYLES: Record<string, { color: string; icon: LucideIcon }> = {
  buero: { color: "#7C8797", icon: Laptop },
  werkzeug: { color: "#5F8FEA", icon: Hammer },
  sprechstunde: { color: "#D27CC2", icon: Video },
  material: { color: "#B4A38F", icon: Truck },
  verlegung: { color: "#EFA055", icon: Rows3 },
  partner: { color: "#B7AEFF", icon: Handshake },
  erstberatung: { color: "#54D3C4", icon: ClipboardCheck },
  pflege: { color: "#9BE08F", icon: Droplet },
  einweisung: { color: "#DDE27E", icon: GraduationCap },
  urlaub: { color: "#F7CD57", icon: Sun },
};

export const HOLIDAY_STYLE: TypeStyle = { key: "feiertag", label: "Feiertag NRW", color: "#F2705F", icon: Flag };

export const TYPE_STYLES: TypeStyle[] = EVENT_TYPES.map((type) => ({
  key: type.key,
  label: type.label,
  color: STYLES[type.key]?.color ?? "#9199a6",
  icon: STYLES[type.key]?.icon ?? Laptop,
}));

export function typeStyle(key: string): TypeStyle {
  return TYPE_STYLES.find((style) => style.key === key) ?? { key, label: key, color: "#9199a6", icon: Laptop };
}

/** Warm hatching for vacation days (inline style, works on any background). */
export const VACATION_HATCH = "repeating-linear-gradient(135deg, rgba(247,205,87,0.22) 0 6px, rgba(247,205,87,0.07) 6px 12px)";

/** Chip colours derived from a type colour. */
export function chipStyle(color: string, options: { muted?: boolean } = {}): CSSProperties {
  return {
    backgroundColor: `${color}${options.muted ? "14" : "24"}`,
    borderColor: `${color}${options.muted ? "40" : "66"}`,
    color,
  };
}

import {
  Banknote,
  BookOpen,
  Car,
  Clapperboard,
  HeartPulse,
  House,
  Package,
  ShoppingBag,
  Smartphone,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/daftary/types";
import { cn } from "@/lib/utils";

const ICONS: Record<IconKey, LucideIcon> = {
  utensils: UtensilsCrossed,
  car: Car,
  zap: Zap,
  bag: ShoppingBag,
  heart: HeartPulse,
  clapper: Clapperboard,
  book: BookOpen,
  package: Package,
  banknote: Banknote,
  phone: Smartphone,
  home: House,
  users: Users,
};

export function CatIcon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={cn("size-4", className)} strokeWidth={1.75} />;
}

export function toneVar(tone: string) {
  return `var(--color-cat-${tone})`;
}

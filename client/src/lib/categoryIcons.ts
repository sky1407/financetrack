import {
  Tag,
  Home,
  Utensils,
  Car,
  Film,
  HeartPulse,
  ShoppingBag,
  Receipt,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: "home", label: "Bývanie", icon: Home },
  { key: "utensils", label: "Jedlo", icon: Utensils },
  { key: "car", label: "Doprava", icon: Car },
  { key: "film", label: "Zábava", icon: Film },
  { key: "heart-pulse", label: "Zdravie", icon: HeartPulse },
  { key: "shopping-bag", label: "Nákupy", icon: ShoppingBag },
  { key: "receipt", label: "Účty", icon: Receipt },
  { key: "briefcase", label: "Práca", icon: Briefcase },
  { key: "laptop", label: "Freelance", icon: Laptop },
  { key: "trending-up", label: "Investície", icon: TrendingUp },
  { key: "gift", label: "Darček", icon: Gift },
  { key: "tag", label: "Ostatné", icon: Tag },
];

const iconMap = new Map(CATEGORY_ICON_OPTIONS.map((option) => [option.key, option.icon]));

export function getCategoryIcon(key: string): LucideIcon {
  return iconMap.get(key) ?? Tag;
}

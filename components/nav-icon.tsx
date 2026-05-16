"use client";

import {
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "@/lib/navigation";

const navIcons: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "graduation-cap": GraduationCap,
  "clipboard-list": ClipboardList,
  users: Users,
  shield: Shield,
  "file-text": FileText,
};

type NavIconProps = {
  name: NavIconName;
  className?: string;
};

export function NavIcon({ name, className }: NavIconProps) {
  const Icon = navIcons[name];
  return <Icon className={className} />;
}

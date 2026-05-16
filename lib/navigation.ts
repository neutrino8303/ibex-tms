import { UserRole } from "@prisma/client";
import {
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { hasAnyRole, type CurrentUser } from "@/lib/auth";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    title: "Expiring qualifications",
    href: "/dashboard/expiring",
    icon: GraduationCap,
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER, UserRole.AUDITOR],
  },
  { title: "Evaluations", href: "/evaluations", icon: ClipboardList },
];

const adminNav: NavItem[] = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER],
  },
  {
    title: "Qualifications",
    href: "/admin/qualifications",
    icon: Shield,
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER],
  },
  {
    title: "Evaluation forms",
    href: "/admin/forms",
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER],
  },
];

function filterByRole(items: NavItem[], user: CurrentUser): NavItem[] {
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return hasAnyRole(user, item.roles);
  });
}

export function getNavigationForUser(user: CurrentUser): NavSection[] {
  const sections: NavSection[] = [
    { items: filterByRole(mainNav, user) },
  ];

  const adminItems = filterByRole(adminNav, user);
  if (adminItems.length > 0) {
    sections.push({ label: "Admin", items: adminItems });
  }

  return sections;
}

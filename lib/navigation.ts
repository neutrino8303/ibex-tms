import { UserRole } from "@prisma/client";
import { hasAnyRole, type CurrentUser } from "@/lib/auth";

export type NavIconName =
  | "layout-dashboard"
  | "graduation-cap"
  | "clipboard-list"
  | "users"
  | "shield"
  | "file-text";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIconName;
  roles?: UserRole[];
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: "layout-dashboard" },
  {
    title: "Expiring qualifications",
    href: "/dashboard/expiring",
    icon: "graduation-cap",
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER, UserRole.AUDITOR],
  },
  { title: "Evaluations", href: "/evaluations", icon: "clipboard-list" },
];

const adminNav: NavItem[] = [
  {
    title: "Users",
    href: "/admin/users",
    icon: "users",
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER],
  },
  {
    title: "Qualifications",
    href: "/admin/qualifications",
    icon: "shield",
    roles: [UserRole.ADMIN, UserRole.TRAINING_MANAGER],
  },
  {
    title: "Evaluation forms",
    href: "/admin/forms",
    icon: "file-text",
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

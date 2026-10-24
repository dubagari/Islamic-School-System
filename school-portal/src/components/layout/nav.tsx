import {
  Bell,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const teacherNav: NavGroup[] = [
  {
    label: "Teaching",
    items: [
      { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
      { label: "My Classes", path: "/teacher/classes", icon: Users },
      { label: "Class Attendance", path: "/teacher/attendance", icon: ClipboardCheck },
      { label: "My Attendance", path: "/teacher/attendance/me", icon: CalendarRange },
      { label: "Assessments", path: "/teacher/assessments", icon: BookOpen },
      { label: "Results", path: "/teacher/results", icon: FileText },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", path: "/announcements", icon: Megaphone },
      { label: "Messages", path: "/messages", icon: MessageSquare },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

export const studentNav: NavGroup[] = [
  {
    label: "My Learning",
    items: [
      { label: "Dashboard", path: "/student", icon: LayoutDashboard },
      { label: "My Results", path: "/student/results", icon: FileText },
      { label: "My Attendance", path: "/student/attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Fees",
    items: [{ label: "My Fees", path: "/student/fees", icon: Wallet }],
  },
  {
    label: "School",
    items: [
      { label: "Announcements", path: "/announcements", icon: Megaphone },
      { label: "Messages", path: "/messages", icon: MessageSquare },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

export const parentNav: NavGroup[] = [
  {
    label: "Home",
    items: [{ label: "Overview", path: "/parent", icon: LayoutDashboard }],
  },
  {
    label: "School",
    items: [{ label: "Announcements", path: "/announcements", icon: Megaphone }],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", path: "/messages", icon: MessageSquare },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
];

export function navForRole(role: string | undefined): NavGroup[] {
  switch (role) {
    case "teacher":
      return teacherNav;
    case "student":
      return studentNav;
    case "parent":
      return parentNav;
    default:
      return [];
  }
}

export function isActivePath(pathname: string, itemPath: string): boolean {
  if (pathname === itemPath) return true;
  if (itemPath !== "/" && pathname.startsWith(itemPath + "/")) return true;
  return false;
}

import {
  Bell,
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Layers,
  ListChecks,
  Megaphone,
  MessageSquare,
  School,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
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

export const adminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Reports", path: "/reports", icon: FileText },
    ],
  },
  {
    label: "Admissions",
    items: [
      { label: "Applications", path: "/admissions", icon: ClipboardList },
      { label: "Payments", path: "/admissions/payments", icon: DollarSign },
      { label: "Registration", path: "/admissions/registration", icon: KeyRound },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Students", path: "/students", icon: GraduationCap },
      { label: "Enrollments", path: "/students/enrollments", icon: UserCheck },
      { label: "Records", path: "/students/records", icon: ScrollText },
      { label: "Teachers", path: "/teachers", icon: Users },
      { label: "Parents", path: "/parents", icon: Shield },
      { label: "User Accounts", path: "/users", icon: ShieldCheck },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Academic Setup", path: "/academic", icon: Building2 },
      { label: "Class Subjects", path: "/academic/class-subjects", icon: Layers },
      { label: "Teacher Assignments", path: "/academic/assignments", icon: ListChecks },
      { label: "Attendance", path: "/attendance", icon: ClipboardCheck },
      { label: "Teacher Attendance", path: "/attendance/teachers", icon: CalendarRange },
      { label: "Assessments", path: "/assessments", icon: BookOpen },
      { label: "Results", path: "/results", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance Overview", path: "/fees", icon: FileText },
      { label: "Fee Structures", path: "/fees/structures", icon: DollarSign },
      { label: "Invoices", path: "/fees/invoices", icon: ScrollText },
      { label: "Payments", path: "/fees/payments", icon: DollarSign },
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
  {
    label: "Administration",
    items: [
      { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
      { label: "Settings", path: "/admin/settings", icon: Settings },
      { label: "System", path: "/admin/system", icon: School },
    ],
  },
];

export const teacherNav: NavGroup[] = [
  {
    label: "Teaching",
    items: [
      { label: "My Classes", path: "/my-classes", icon: Building2 },
      { label: "Attendance", path: "/attendance", icon: ClipboardCheck },
      { label: "Assessments", path: "/assessments", icon: BookOpen },
      { label: "Results", path: "/results", icon: FileText },
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
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "My Results", path: "/results", icon: FileText },
      { label: "My Attendance", path: "/attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Fees",
    items: [{ label: "My Invoices", path: "/fees/invoices", icon: DollarSign }],
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
    items: [{ label: "Overview", path: "/", icon: LayoutDashboard }],
  },
  {
    label: "School",
    items: [{ label: "Notices", path: "/announcements", icon: Megaphone }],
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
    case "admin":
      return adminNav;
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

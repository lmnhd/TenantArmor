"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  ShieldAlert, 
  Settings, 
  LifeBuoy,
  Crown
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/dashboard/lease-analysis",
    label: "Lease Analysis",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    href: "/dashboard/eviction-response",
    label: "Eviction Response",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    href: "/pricing",
    label: "Pricing & Plans",
    icon: <Crown className="h-4 w-4" />,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    icon: <LifeBuoy className="h-4 w-4" />,
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center px-4 py-2 rounded-lg transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {item.icon}
          <span className="ml-3">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 
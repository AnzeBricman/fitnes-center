"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Glavna navigacija">
      {navigation.map((group) => (
        <div key={group.title} className="nav-section">
          <span className="nav-section-title">{group.title}</span>
          <div className="nav-section-links">
            {group.items.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${isActive ? " nav-link-active" : ""}`}
                >
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

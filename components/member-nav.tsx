"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/workouts", label: "Treningi" },
  { href: "/trainers", label: "Trenerji" },
  { href: "/account", label: "Moj racun" },
];

export function MemberNav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <nav className="member-nav" aria-label="Uporabniska navigacija">
      {navigation.map((item) => {
        const isActive =
          item.href === "/"
            ? currentPath === item.href
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`member-nav-link${isActive ? " member-nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

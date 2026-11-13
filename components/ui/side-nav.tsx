"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

export type SideNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  exact?: boolean;
};

export function SideNav({ items, label, onNavigate }: { items: SideNavItem[]; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-col gap-0.5">
      {items.map(({ href, label: text, icon: Icon, badge, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <NextLink
            key={href}
            aria-current={active ? "page" : undefined}
            className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-default hover:text-foreground aria-[current=page]:bg-default aria-[current=page]:text-foreground"
            href={href}
            onClick={onNavigate}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{text}</span>
            {badge ? (
              <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-semibold leading-5 text-accent-foreground">
                {badge}
              </span>
            ) : null}
          </NextLink>
        );
      })}
    </nav>
  );
}

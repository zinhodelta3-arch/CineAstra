"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ChevronDown,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppearanceSelector } from "@/components/appearance-selector";

const DEFAULT_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produtos",
    icon: Package,
    children: [
      {
        label: "Todos os produtos",
        href: "/dashboard/produtos",
      },
      {
        label: "Combos",
        href: "/dashboard/produtos/combos",
      },
      {
        label: "Insumos",
        href: "/dashboard/produtos/insumos",
      },
    ],
  },
];

const FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

function useThemeLogo() {
  const [logo, setLogo] = useState("/CineAstralogou.png");

  useEffect(() => {
    const root = document.documentElement;

    function updateLogo() {
      const theme = (
        root.getAttribute("data-theme") || ""
      ).toLowerCase();

      if (/catp|latte|frappe|macchiato/.test(theme)) {
        setLogo("/Catp.png");
      } else if (theme.includes("mocha")) {
        setLogo("/Mocha.png");
      } else if (theme.includes("violet")) {
        setLogo("/Violet.png");
      } else {
        setLogo("/CineAstralogou.png");
      }
    }

    updateLogo();

    const observer = new MutationObserver(updateLogo);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return logo;
}

function getInitials(user) {
  const name = user?.name?.trim();

  if (name) {
    const parts = name.split(/\s+/);

    return (
      parts[0].charAt(0) +
      (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")
    ).toUpperCase();
  }

  return user?.email?.trim().charAt(0).toUpperCase() || "";
}

function NavigationItem({ item, pathname }) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

  const active = item.href === pathname;
  const activeChild = Boolean(
    item.children?.some((child) => child.href === pathname)
  );

  function linkClasses(selected) {
    return [
      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5",
      "text-sm font-semibold transition-colors",
      "motion-reduce:transition-none",
      FOCUS_CLASSES,
      selected
        ? "bg-primary text-primary-foreground"
        : "text-card-foreground hover:bg-muted",
    ].join(" ");
  }

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={linkClasses(active)}
        >
          {Icon && (
            <Icon
              aria-hidden="true"
              className="size-[18px] shrink-0"
              strokeWidth={1.75}
            />
          )}

          <span className="min-w-0 break-words">
            {item.label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <details
        key={`${item.label}-${pathname}`}
        open={activeChild || undefined}
        className="group"
      >
        <summary
          className={[
            linkClasses(activeChild),
            "cursor-pointer list-none",
            "[&::-webkit-details-marker]:hidden",
          ].join(" ")}
        >
          {Icon && (
            <Icon
              aria-hidden="true"
              className="size-[18px] shrink-0"
              strokeWidth={1.75}
            />
          )}

          <span className="min-w-0 flex-1 break-words">
            {item.label}
          </span>

          <ChevronDown
            aria-hidden="true"
            className="
              size-4 shrink-0 transition-transform
              group-open:rotate-180
              motion-reduce:transition-none
            "
          />
        </summary>

        <ul className="ml-5 mt-2 space-y-1 border-l border-border pl-3">
          {item.children.map((child) => {
            const selected = pathname === child.href;

            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={selected ? "page" : undefined}
                  className={[
                    "flex min-h-10 items-center gap-2",
                    "rounded-md px-3 py-2 text-sm",
                    "transition-colors motion-reduce:transition-none",
                    FOCUS_CLASSES,
                    selected
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "size-1.5 shrink-0 rounded-full",
                      selected
                        ? "bg-primary"
                        : "bg-current opacity-40",
                    ].join(" ")}
                  />

                  <span className="min-w-0 break-words">
                    {child.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
}

export function AppSidebar({
  items = DEFAULT_ITEMS,
  user,
  onLogout,
  loggingOut = false,
  className = "",
}) {
  const pathname = usePathname();
  const logo = useThemeLogo();
  const initials = getInitials(user);

  return (
    <aside
      aria-label="Menu lateral"
      className={[
        "relative isolate flex h-dvh w-72 max-w-full shrink-0 flex-col",
        "overflow-hidden rounded-r-[2rem]",
        "border border-border bg-card text-card-foreground",
        className,
      ].join(" ")}
    >
      {/* Borda decorativa de película */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-y-7 right-2
          w-2 border-x border-border
        "
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Logo */}
      <div className="mr-5 border-b border-dashed border-border px-5 py-6">
        <Link
          href="/"
          aria-label="CineAstra — Página inicial"
          className={[
            "flex min-h-12 items-center rounded-lg px-2",
            FOCUS_CLASSES,
          ].join(" ")}
        >
          <img
            src={logo}
            alt="CineAstra"
            width={180}
            height={48}
            className="
              h-12 w-full max-w-45
              object-contain object-left
            "
          />
        </Link>
      </div>

      {/* Navegação com rolagem independente */}
      <nav
        aria-label="Navegação principal"
        className="
          min-h-0 flex-1 overflow-y-auto overscroll-contain
          py-6 pl-4 pr-7
          [scrollbar-color:var(--border)_transparent]
          [scrollbar-width:thin]
        "
      >
        <p className="mb-3 px-3 text-xs font-medium text-muted-foreground">
          Navegação
        </p>

        <ul className="space-y-2">
          {items.map((item) => (
            <NavigationItem
              key={item.href || item.label}
              item={item}
              pathname={pathname}
            />
          ))}
        </ul>
      </nav>

      {/* Aparência e conta */}
      <footer className="mr-5 shrink-0 border-t border-dashed border-border">
        <div className="flex min-h-16 items-center justify-between gap-3 px-5 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Aparência
          </span>

          <AppearanceSelector />
        </div>

        <div
          aria-hidden="true"
          className="mx-5 h-px bg-border/70"
        />

        {/* Avatar, nome e e-mail */}
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <div
            aria-hidden="true"
            className="
              flex size-11 shrink-0 select-none
              items-center justify-center rounded-full
              bg-primary/10 text-sm font-semibold text-primary
              ring-1 ring-inset ring-primary/15
            "
          >
            {initials || (
              <UserRound
                className="size-5"
                strokeWidth={1.75}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              title={user?.name || "Minha conta"}
              className="
                truncate text-sm font-semibold
                leading-5 text-card-foreground
              "
            >
              {user?.name || "Minha conta"}
            </p>

            <p
              title={user?.email || undefined}
              className="
                mt-0.5 truncate text-xs
                leading-5 text-muted-foreground
              "
            >
              {user?.email || "E-mail não informado"}
            </p>
          </div>
        </div>

        {/* Ação de saída */}
        <div className="px-5 pb-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onLogout}
            disabled={!onLogout || loggingOut}
            aria-busy={loggingOut}
            className="
              min-h-11 w-full justify-start gap-3 rounded-lg
              border border-border/70 bg-transparent px-3
              text-sm font-medium text-muted-foreground shadow-none
              transition-colors
              hover:border-destructive/25
              hover:bg-destructive/10 hover:text-destructive
              focus-visible:border-ring
              focus-visible:ring-2 focus-visible:ring-ring/50
              disabled:pointer-events-none disabled:opacity-50
              motion-reduce:transition-none
            "
          >
            {loggingOut ? (
              <LoaderCircle
                aria-hidden="true"
                className="
                  size-4 shrink-0 animate-spin
                  motion-reduce:animate-none
                "
              />
            ) : (
              <LogOut
                aria-hidden="true"
                className="size-4 shrink-0"
                strokeWidth={1.75}
              />
            )}

            <span aria-live="polite">
              {loggingOut ? "Saindo..." : "Sair da conta"}
            </span>
          </Button>
        </div>
      </footer>
    </aside>
  );
}
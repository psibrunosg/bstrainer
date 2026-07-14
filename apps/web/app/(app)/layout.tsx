"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconProgress() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M4 19V10" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

function IconPlans() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function IconTrain() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <rect x="4" y="8" width="3" height="8" rx="0.5" />
      <rect x="17" y="8" width="3" height="8" rx="0.5" />
      <path d="M7 12h10" />
    </svg>
  );
}

function IconClients() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18.5 14.5c1.8 1 2.5 2.9 2.5 5.5" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="m4.9 19.1 2.1-2.1" />
      <path d="m17 7 2.1-2.1" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: () => React.ReactElement;
}

const LEFT: NavItem[] = [
  { href: "/dashboard", label: "Progresso", icon: IconProgress },
  { href: "/plans", label: "Fichas", icon: IconPlans },
];

const RIGHT: NavItem[] = [
  { href: "/clients", label: "Alunos", icon: IconClients },
  { href: "/settings", label: "Ajustes", icon: IconSettings },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
        active ? "text-text" : "text-mute hover:text-text"
      }`}
    >
      <Icon />
      <span className="text-[10px] font-medium uppercase tracking-[0.08em]">
        {item.label}
      </span>
    </Link>
  );
}

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-text">
      <main className="flex-1 pb-24">
        <AuthGuard>{children}</AuthGuard>
      </main>
      {/* Nav inferior — logger é o coração do app */}
      <nav className="fixed inset-x-0 bottom-0 z-30 h-16 border-t border-line bg-ink/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-lg items-stretch">
          {LEFT.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          <Link
            href="/train"
            aria-label="Treinar"
            aria-current={isActive("/train") ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            <span className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-signal text-ink transition active:scale-[0.98] active:bg-signal-press">
              <IconTrain />
            </span>
            <span
              className={`-mt-2 text-[10px] font-medium uppercase tracking-[0.08em] ${
                isActive("/train") ? "text-text" : "text-mute"
              }`}
            >
              Treinar
            </span>
          </Link>
          {RIGHT.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

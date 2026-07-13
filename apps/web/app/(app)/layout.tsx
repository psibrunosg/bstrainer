import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Progresso" },
  { href: "/train", label: "Treinar" },
  { href: "/plans", label: "Fichas" },
  { href: "/clients", label: "Alunos" },
  { href: "/settings", label: "Ajustes" },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      {/* Nav inferior mobile-first — logger é o coração do app */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 px-2 py-4 text-center text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

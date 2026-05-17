import { Button } from "@/components/ui/button";

const links = [
  { href: "#karagua-vivo", label: "Sobre" },
  { href: "#pilares", label: "Tecnologia" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#eventos", label: "Eventos" },
  { href: "#mapa", label: "Mapa" },
];

/**
 * Navbar — solid variant on carbon. Bright logo on dark surface
 * (the one place Green Karaguá bright is allowed). Links collapse
 * behind the actions slot at <=768px.
 */
export function SiteNav() {
  return (
    <header className="dark sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#topo"
          className="flex items-center gap-2 text-k-bright"
          aria-label="Karaguá, início"
        >
          <span aria-hidden className="inline-block size-3 rounded-xs bg-k-bright" />
          <span className="text-base font-bold tracking-tight">Karaguá</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-foreground/80 transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="lg">
            <a href="#investir">Investir</a>
          </Button>
        </div>
      </nav>
    </header>
  );
}

const footerLinks = [
  { href: "#karagua-vivo", label: "Sobre" },
  { href: "#pilares", label: "Tecnologia" },
  { href: "#carbono-azul", label: "Carbono azul" },
  { href: "#mapa", label: "Mapa" },
];

/** Footer — carbon surface, restrained. Brand mark in bright on dark. */
export function SiteFooter() {
  return (
    <footer className="dark border-t border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-k-bright">
            <span aria-hidden className="inline-block size-3 rounded-xs bg-k-bright" />
            <span className="text-base font-bold tracking-tight">Karaguá</span>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {footerLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-data text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-6 text-data text-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© Karaguá Ecotech. Todos os direitos reservados.</p>
          <p>Cada número tem uma fonte.</p>
        </div>
      </div>
    </footer>
  );
}

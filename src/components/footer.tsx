const SocialLinks = [
  { href: "https://www.instagram.com/karaguaecotech/", label: "Instagram" },
  { href: "https://www.linkedin.com/company/karaguaecotech/", label: "LinkedIn" },
  { href: "https://www.youtube.com/channel/UC_x9-_yOPPYH--iKbn97HPA", label: "YouTube" },
];

const AboutLinks = [
  { href: "#karagua-vivo", label: "Sobre" },
  { href: "#pilares", label: "Tecnologia" },
  { href: "#carbono-azul", label: "Carbono azul" },
  { href: "#mapa", label: "Mapa" },
];

const LegalLinks = [
  { href: "#politica-de-privacidade", label: "Política de privacidade" },
  { href: "#termos-de-uso", label: "Termos de uso" },
  { href: "#politica-de-cookies", label: "Política de cookies" },
  { href: "#politica-de-protecao-de-dados", label: "Política de proteção de dados" },
];

/** Footer — carbon surface, restrained. Brand mark in bright on dark. */
export function Footer() {
  return (
    <footer className="dark bg-background ">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-row col-span-4 justify-between">
          <div className="bg-background flex flex-col gap-2 items-start">
            <img src="/logo-1.svg" alt="Karaguá" className="w-auto h-12 mb-4" />
            <span className="text-xs text-foreground/70">65.981.337/0001-72</span>
            <span className="text-xs text-foreground/70">
              RUA BORBA GATO 700, APT 1103 A · ATIRADORES
            </span>
            <span className="text-xs text-foreground/70">JOINVILLE - SC · CEP 89203-020</span>
          </div>

          <nav className="flex flex-col gap-2">
            <span
              className="text-xs tracking-widest
 text-foreground/70 font-bold uppercase mb-2"
            >
              Sobre
            </span>
            {AboutLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-data text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <nav className="flex flex-col gap-2">
            <span
              className="text-xs tracking-widest
 text-foreground/70 font-bold uppercase mb-2"
            >
              Social
            </span>
            {SocialLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-data text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <nav className="flex flex-col gap-2">
            <span
              className="text-xs tracking-widest
 text-foreground/70 font-bold uppercase mb-2"
            >
              Legal
            </span>
            {LegalLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col text-center justify-center items-center gap-2 border-t border-border pt-6 text-data text-foreground/55">
          <p className="text-xs">
            © Karaguá Ecotech {new Date().getFullYear()}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

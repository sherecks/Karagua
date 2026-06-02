const SocialLinks = [
  { href: "https://www.instagram.com/karagua.ecotech/", label: "Instagram" },
  { href: "https://www.linkedin.com/company/karaguaecotech/", label: "LinkedIn" },
  { href: "https://www.youtube.com/channel/UC_x9-_yOPPYH--iKbn97HPA", label: "YouTube" },
];

const AboutLinks = [
  { href: "#solucao", label: "Solução" },
  { href: "#impacto", label: "Impacto" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#empresas", label: "Para empresas" },
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
    <footer className="surface-primary">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-2 items-start">
            <img src="/logo-1.svg" alt="Karaguá" className="w-auto h-12 mb-4 brightness-0" />
            <span className="text-xs text-foreground/70">65.981.337/0001-72</span>
            <span className="text-xs text-foreground/70">
              RUA BORBA GATO 700, APT 1103 A · ATIRADORES
            </span>
            <span className="text-xs text-foreground/70">JOINVILLE - SC · CEP 89203-020</span>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:flex sm:gap-16">
            <nav className="flex flex-col gap-2">
              <span className="text-xs tracking-widest text-foreground/70 font-bold uppercase mb-2">
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
              <span className="text-xs tracking-widest text-foreground/70 font-bold uppercase mb-2">
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
              <span className="text-xs tracking-widest text-foreground/70 font-bold uppercase mb-2">
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

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const links = [
  { href: "#karagua-vivo", label: "Sobre" },
  { href: "#pilares", label: "Tecnologia" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#eventos", label: "Eventos" },
  { href: "#mapa", label: "Mapa" },
];

export function SiteNav() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="dark sticky top-4 z-50 mx-auto max-w-2xl rounded-full bg-background/45 backdrop-blur">
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

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Abrir menu de navegação"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <Menu aria-hidden />
        </Button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 left-0 bg-red-600"
          ></motion.div>
        )}
      </AnimatePresence>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className={cn(
            "dark inset-y-0 right-0 h-dvh w-full max-w-none gap-0 border-0 bg-background p-0 shadow-none",
            "data-[side=right]:w-full sm:max-w-none",
          )}
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>

          <div className="flex h-full flex-col px-6 pt-6 pb-12">
            <a href="#topo" className="flex items-center gap-2 text-k-bright" onClick={closeMenu}>
              <span aria-hidden className="inline-block size-3 rounded-xs bg-k-bright" />
              <span className="text-base font-bold tracking-tight">Karaguá</span>
            </a>

            <nav className="mt-14 flex flex-1 flex-col gap-1" aria-label="Seções da página">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={closeMenu}
                  className="flex min-h-11 items-center text-2xl font-semibold text-foreground transition-colors hover:text-k-bright"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

import { Link, useLocation } from "react-router-dom";
import { SiteMenu } from "@/components/site-menu";

export function SiteHeader() {
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/v2";

  return (
    <nav
      aria-label="Navegação principal"
      className={`z-100 mx-auto flex w-full flex-row items-center justify-between px-4 py-4 md:px-8 ${
        isHome ? "absolute inset-x-0 top-0" : "relative"
      }`}
    >
      {isHome ? (
        <a href="#topo" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-1.svg" alt="Karaguá" className="site-logo w-auto h-12" />
        </a>
      ) : (
        <Link to="/" style={{ viewTransitionName: "brand-mark" }}>
          <img src="/logo-1.svg" alt="Karaguá" className="site-logo w-auto h-12" />
        </Link>
      )}

      <div className="flex items-center gap-4">
        <SiteMenu />
      </div>
    </nav>
  );
}

import { DOWNLOAD_EXE_URL } from "../config/release.js";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#apercu", label: "Aperçu" },
  { href: "#faq", label: "FAQ" },
  { href: "#commentaires", label: "Commentaires" },
  { href: "#changelog", label: "Journal des versions" },
];

export function Nav(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/70 bg-surface-0/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-surface-0">L</div>
          <span className="text-base font-semibold tracking-tight">
            Layer<span className="text-accent">AI</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-text-primary">
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href={DOWNLOAD_EXE_URL}
          className="ml-auto rounded-full bg-accent px-4 py-2 text-sm font-medium text-surface-0 transition-colors hover:bg-accent-glow"
        >
          Télécharger
        </a>
      </div>
    </header>
  );
}

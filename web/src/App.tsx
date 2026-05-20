// JUSTIFICACIÓN: landing placeholder de Fase 0. En Fase 6 se sustituye por router con
// storefront público + dashboard de diseñador. Tailwind aplicado para verificar pipeline CSS.
export default function App() {
  return (
    <main className="min-h-screen bg-sand-50 font-sans">
      <header className="bg-atlantic-700 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">GaliciaWear</h1>
          <p className="mt-2 text-atlantic-50">
            Moda sostenible gallega · Diseñadores locales · Envíos eco
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="font-display text-2xl font-semibold text-atlantic-900">
          Fase 0 — Inicialización completada
        </h2>
        <p className="mt-3 text-atlantic-900/80">
          El frontend público (storefront) y el dashboard del diseñador se desarrollan en la
          Fase 6. Esta página solo confirma que el pipeline React + Vite + Tailwind funciona.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          <li className="rounded-lg border border-atlantic-100 bg-white p-4">
            <span className="font-semibold text-galego-700">API backend</span>
            <p className="text-sm text-atlantic-900/70">http://localhost:3000/health</p>
          </li>
          <li className="rounded-lg border border-atlantic-100 bg-white p-4">
            <span className="font-semibold text-galego-700">Web cliente</span>
            <p className="text-sm text-atlantic-900/70">http://localhost:5173</p>
          </li>
        </ul>
      </section>

      <footer className="border-t border-atlantic-100 py-6 text-center text-sm text-atlantic-900/60">
        TFG DAM 2024-26 · Pablo Suárez
      </footer>
    </main>
  );
}

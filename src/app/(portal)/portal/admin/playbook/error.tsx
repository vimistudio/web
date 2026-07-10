"use client";

export default function PlaybookError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-serif text-3xl italic leading-tight text-[color:var(--vimi-ink)]">
        No se pudo cargar el playbook.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--vimi-muted)]">
        Algo falló al reunir las entregas. Inténtalo de nuevo.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--vimi-ink)] px-6 text-sm font-semibold text-[var(--vimi-page)] transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        Reintentar
      </button>
    </div>
  );
}

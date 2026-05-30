'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  console.error('[SETTLED_GLOBAL_ERROR]', error)

  return (
    <html lang="en" className="bg-black">
      <body className="m-0 bg-black text-white">
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <section className="w-full max-w-2xl border border-[#2563EB]/45 bg-[#050816] p-8 shadow-[0_0_0_1px_rgba(37,99,235,0.25),0_0_40px_rgba(37,99,235,0.22)]">
            <p className="settled-tech text-xs font-semibold uppercase tracking-[0.2em] text-[#7BA4FF]">
              Global Recovery Layer
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">A global application error was contained.</h1>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              Branding and navigation were preserved. Retry the app or return to the home workflow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="settled-tech rounded-md bg-[#2563EB] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              >
                Retry App
              </button>
              <a
                href="/"
                className="settled-tech inline-flex items-center rounded-md border border-[#2563EB]/45 bg-black/45 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              >
                Return Home
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}

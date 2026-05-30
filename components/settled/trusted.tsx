export function Trusted() {
  const logos = ["Student loan errors", "Credit reports", "Collections", "Business credit"]
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-8">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground">
        BUILT FOR DOCUMENTED DISPUTE WORK
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-12 gap-y-4 border-t border-border/60 pt-5">
        {logos.map((logo) => (
          <span key={logo} className="text-xl font-semibold text-muted-foreground/80">
            {logo}
          </span>
        ))}
      </div>
    </section>
  )
}

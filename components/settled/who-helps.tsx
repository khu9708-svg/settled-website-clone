import Image from "next/image"

const cards = [
  {
    image: "/images/who-error.png",
    title: "Credit Report Errors",
    body: "Inaccurate accounts, late payments, charge-offs, and more.",
  },
  {
    image: "/images/who-student.png",
    title: "Student Loan Problems",
    body: "Duplicate loans, wrong balances, missing payments, and servicer errors.",
  },
  {
    image: "/images/who-collections.png",
    title: "Collections & Charge-Offs",
    body: "Old debts, incorrect balances, settled accounts still reporting, and more.",
  },
  {
    image: "/images/who-denied.png",
    title: "Business Credit & Funding",
    body: "Errors, outdated reporting, disputes, and funding readiness.",
  },
]

export function WhoHelps() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="rounded-2xl border border-border bg-card/40 p-6 lg:p-8">
        <h2 className="text-xl font-bold lg:text-2xl">Who SETTLED Helps</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative h-32">
                <Image src={card.image} alt={card.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">{card.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Header } from "@/components/settled/header"
import { Footer } from "@/components/settled/footer"
import { DashboardSection } from "@/components/settled/dashboard-section"
import { DashboardActions } from "@/components/settled/dashboard-actions"
import { auth } from "@/app/api/auth/auth"
import { redirect } from "next/navigation"
import { getSubscriptionSnapshot } from "@/lib/db"
import { mapPlanToDashboardTier } from "@/lib/subscription-plans"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const subscription = await getSubscriptionSnapshot(session.user.email)

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <section className="mx-auto max-w-[1120px] px-4 py-16 lg:py-20">
        <div className="mb-6 grid gap-5 border-b border-white/10 pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7BA4FF]">
            Account Dashboard
          </p>
            <h1 className="mt-5 text-pretty text-4xl font-semibold leading-[1.03] text-white lg:text-6xl">
              Your dispute command center.
            </h1>
          </div>
          <p className="max-w-xl text-base font-medium leading-relaxed text-white/70 lg:pb-2">
            Scan documents, review generated letters, track next steps, and keep your dispute work organized in one
            place.
          </p>
        </div>
        <DashboardActions email={session.user.email} />
        <div className="mt-8" />
        <DashboardSection
          user={{
            email: session.user.email,
            plan: mapPlanToDashboardTier(subscription.planId),
            disputesUsed: 0,
            lettersGenerated: 0,
          }}
        />
      </section>
      <Footer />
    </main>
  )
}

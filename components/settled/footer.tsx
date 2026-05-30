import { Mail, Lock } from "lucide-react"
import { SettledLogo } from "./logo"
import { PUBLIC_CONFIG, supportMailtoHref } from "@/lib/public-config"

const columns = [
  {
    title: "PLATFORM",
    links: [
      { label: "Home", href: "/" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Scan Student Loans", href: "/student-loans" },
      { label: "Log In", href: "/login" },
      { label: "Contact Us", href: supportMailtoHref() },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { label: "Student Loan Audit", href: "/student-loans" },
      { label: "Credit File Audit", href: "/disputes" },
      { label: "Business File Audit", href: "/business" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Terms of Service", href: "/support#terms" },
      { label: "Privacy Policy", href: "/support#privacy" },
      { label: "Refund Policy", href: "/support#refund" },
      { label: "Disclaimer", href: "/support#disclaimer" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1200px] px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_2fr_1.2fr]">
        <div>
          <SettledLogo />
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Document intake, reporting-error analysis, dispute-letter output, and tracked next steps.
          </p>
          <p className="mt-5 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
            Secure document review, structured dispute letters, and tracked next steps for people who need a clear path.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-bold tracking-wider text-muted-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-semibold">SUPPORT</p>
              <p className="text-[11px] text-muted-foreground">
                <a href={supportMailtoHref()} className="hover:text-foreground">
                  {PUBLIC_CONFIG.supportEmail}
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-semibold">256-BIT ENCRYPTION</p>
              <p className="text-[11px] text-muted-foreground">Route sensitive documents through secure upload only.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="mt-10 border-t border-border/40 pt-6">
        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
          SETTLED is not a law firm and does not provide legal advice. SETTLED does not guarantee credit score changes,
          deletions, approvals, settlements, or financial outcomes. SETTLED is a dispute documentation platform that
          helps identify potential reporting issues and generate correspondence. Results vary. Consult a licensed
          attorney for legal representation. &copy; 2026 SETTLED. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

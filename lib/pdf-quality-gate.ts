import 'server-only'

export type PdfQualityRuleResult = {
  rule: string
  weight: number
  passed: boolean
  evidence: string
}

export type PdfQualityAssessment = {
  score: number
  threshold: number
  passed: boolean
  rules: PdfQualityRuleResult[]
}

function tokenCoverageWeight(tokens: string[]) {
  if (!tokens.length) return 0
  return 3 / tokens.length
}

export function assessPdfQuality(
  buffer: Buffer,
  options: { requiredTokens: string[]; minBytes: number; threshold?: number }
): PdfQualityAssessment {
  const threshold = options.threshold ?? 9.5
  const asBinary = buffer.toString('binary')
  const asText = buffer.toString('utf8')
  const tokenWeight = tokenCoverageWeight(options.requiredTokens)

  const controlCharMatches = asText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []
  const controlRatio = asText.length > 0 ? controlCharMatches.length / asText.length : 1

  const baseRules: PdfQualityRuleResult[] = [
    {
      rule: 'pdf_header',
      weight: 2.5,
      passed: asBinary.startsWith('%PDF-'),
      evidence: asBinary.slice(0, 8),
    },
    {
      rule: 'pdf_eof',
      weight: 2,
      passed: asBinary.includes('%%EOF'),
      evidence: asBinary.slice(Math.max(0, asBinary.length - 24)),
    },
    {
      rule: 'minimum_bytes',
      weight: 1.5,
      passed: buffer.length >= options.minBytes,
      evidence: `bytes=${buffer.length}`,
    },
    {
      rule: 'control_char_ratio',
      weight: 1,
      passed: controlRatio <= 0.005,
      evidence: `ratio=${controlRatio.toFixed(6)}`,
    },
  ]

  const tokenRules: PdfQualityRuleResult[] = options.requiredTokens.map((token) => ({
    rule: `token:${token}`,
    weight: tokenWeight,
    passed: asBinary.includes(token),
    evidence: token,
  }))

  const rules = [...baseRules, ...tokenRules]
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0)
  const earnedWeight = rules.reduce((sum, rule) => sum + (rule.passed ? rule.weight : 0), 0)
  const score = totalWeight > 0 ? Number(((earnedWeight / totalWeight) * 10).toFixed(2)) : 0

  return {
    score,
    threshold,
    passed: score >= threshold,
    rules,
  }
}

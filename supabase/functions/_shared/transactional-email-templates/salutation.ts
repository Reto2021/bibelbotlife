// Shared salutation helper for transactional emails.
// Produces a respectful, denomination-neutral greeting based on available contact data.
//
// Logic:
// 1. If gender + last name → "Sehr geehrte Frau Müller" / "Sehr geehrter Herr Müller" / "Guten Tag Alex Müller" (diverse)
// 2. Else if first + last name → "Guten Tag Maria Müller"
// 3. Else if legacy contactName (full string, may contain title) → "Hallo Maria Müller" (used as-is)
// 4. Else → "Hallo"
//
// NEVER prepend "Pastor" / "Pfarrer" / "Pfarrerin" — denomination-neutral by design.

export interface ContactData {
  gender?: string | null
  firstName?: string | null
  lastName?: string | null
  /** Legacy free-form name field (e.g. from old contact_person/pastor_name). */
  fullName?: string | null
}

export function buildSalutation(c: ContactData): string {
  const gender = (c.gender || '').toLowerCase()
  const last = (c.lastName || '').trim()
  const first = (c.firstName || '').trim()

  if (last) {
    if (gender === 'female') return `Sehr geehrte Frau ${last}`
    if (gender === 'male') return `Sehr geehrter Herr ${last}`
    if (first) return `Guten Tag ${first} ${last}`
    return `Guten Tag ${last}`
  }

  if (first) return `Guten Tag ${first}`

  const legacy = (c.fullName || '').trim()
  if (legacy) {
    // Strip clerical titles to keep emails denomination-neutral.
    const stripped = legacy.replace(/^(Pastor(?:in)?|Pfarrer(?:in)?|Priester(?:in)?|Diakon(?:in)?|Dr\.?|Prof\.?)\s+/i, '').trim()
    return `Hallo ${stripped || legacy}`
  }

  return 'Hallo'
}

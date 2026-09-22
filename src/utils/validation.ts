/**
 * Email validation helper for Pokémon Arena
 * Ensures only valid, authentic email formats are accepted for Login and Sign Up.
 */

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();

  // Basic length constraints
  if (trimmed.length < 5 || trimmed.length > 254) return false;

  // Disallow whitespaces
  if (/\s/.test(trimmed)) return false;

  // Disallow consecutive dots
  if (trimmed.includes('..')) return false;

  // Must have exactly one @ symbol
  const atParts = trimmed.split('@');
  if (atParts.length !== 2) return false;

  const [localPart, domainPart] = atParts;
  if (!localPart || !domainPart) return false;

  // Local part cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

  // Domain cannot start or end with a dot or hyphen
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return false;
  }

  // Domain must contain at least one dot
  const domainParts = domainPart.split('.');
  if (domainParts.length < 2) return false;

  // Each domain segment must be alphanumeric or hyphen
  for (const part of domainParts) {
    if (!part || part.length === 0) return false;
    if (part.startsWith('-') || part.endsWith('-')) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false;
  }

  // TLD must be purely alphabetical and at least 2 characters (e.g. .com, .org, .net, .in, .app)
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  // RFC-compliant practical regex
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(trimmed);
}

export function getEmailValidationError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Invalid email. Email address cannot be blank.';
  }
  if (!isValidEmail(trimmed)) {
    return 'Invalid email. Please enter a valid email address (e.g. trainer@pokemon.com).';
  }
  return null;
}

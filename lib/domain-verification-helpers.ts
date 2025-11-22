export function getVerificationTxtHost(domain: string): string {
  return domain;
}

export function getVerificationTxtValue(token: string): string {
  return `bxsite-verify=${token}`;
}

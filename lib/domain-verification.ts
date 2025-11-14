import { randomUUID } from "crypto";
import {
  getVerificationTxtHost,
  getVerificationTxtValue,
} from "./domain-verification-helpers";

const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function generateVerificationToken(): string {
  return randomUUID();
}

export function validateDomainFormat(domain: string): {
  valid: boolean;
  error?: string;
} {
  const normalized = domain.toLowerCase().trim();

  if (!normalized) {
    return { valid: false, error: "Domain cannot be empty" };
  }

  if (!DOMAIN_REGEX.test(normalized)) {
    return { valid: false, error: "Invalid domain format" };
  }

  if (normalized.endsWith(".bxsite.com") || normalized === "bxsite.com") {
    return { valid: false, error: "Cannot use bxsite.com or its subdomains" };
  }

  if (
    normalized.includes("localhost") ||
    normalized.includes("127.0.0.1") ||
    normalized.includes("0.0.0.0") ||
    normalized.startsWith("192.168.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("172.")
  ) {
    return { valid: false, error: "Cannot use local or private IP addresses" };
  }

  return { valid: true };
}

async function lookupTxtViaDoH(
  hostname: string,
  provider: "google" | "cloudflare" = "google"
): Promise<string[]> {
  let url: string;
  let headers: Record<string, string>;

  if (provider === "google") {
    url = `https://dns.google/resolve?name=${encodeURIComponent(
      hostname
    )}&type=TXT`;
    headers = {
      Accept: "application/dns-json",
    };
  } else {
    url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
      hostname
    )}&type=TXT`;
    headers = {
      Accept: "application/dns-json",
    };
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`DoH request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.Status !== 0) {
    if (data.Status === 3) {
      return [];
    }
    if (data.Status === 2) {
      const comment = data.Comment || "";
      throw new Error(
        `DNS server error (SERVFAIL) for ${hostname}. Status: ${data.Status}. ${comment}`
      );
    }
    throw new Error(
      `DNS query failed with status: ${data.Status}${
        data.Comment ? ` - ${data.Comment}` : ""
      }`
    );
  }

  if (!data.Answer || data.Answer.length === 0) {
    return [];
  }

  const txtRecords: string[] = [];
  for (const answer of data.Answer) {
    if (answer.type === 16) {
      // TXT record type
      let value = answer.data;
      if (typeof value === "string") {
        value = value
          .replace(/^"|"$/g, "")
          .replace(/\\"/g, '"')
          .replace(/\\/g, "");
        txtRecords.push(value);
      }
    }
  }

  return txtRecords;
}

export async function verifyDomainDNS(
  domain: string,
  token: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const txtHost = getVerificationTxtHost(domain);
    const expectedTxtValue = getVerificationTxtValue(token);

    let txtRecords: string[] = [];

    try {
      const { resolveTxt } = await import("dns/promises");
      const records = await resolveTxt(txtHost);
      txtRecords = records.map((record) => record.join(""));
    } catch (err: any) {
      if (
        err.code === "ESERVFAIL" ||
        err.code === "ENOTFOUND" ||
        err.code === "ENODATA" ||
        err.code === "ETIMEOUT"
      ) {
        let lastError: any = err;
        let dohSucceeded = false;
        for (const provider of ["google", "cloudflare"] as const) {
          try {
            txtRecords = await lookupTxtViaDoH(txtHost, provider);
            dohSucceeded = true;
            break;
          } catch (dohErr: any) {
            lastError = dohErr;
            continue;
          }
        }

        if (!dohSucceeded) {
          return {
            verified: false,
            error: `Domain ${domain} is not yet verified. Please ensure the TXT record is added and wait a few minutes for DNS propagation.`,
          };
        }
      } else {
        if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
          return {
            verified: false,
            error: `Domain ${domain} is not yet verified. Please add the TXT record and wait a few minutes for DNS propagation.`,
          };
        }
        return {
          verified: false,
          error: `Domain ${domain} is not yet verified. Please check your DNS configuration and try again.`,
        };
      }
    }

    if (!txtRecords || txtRecords.length === 0) {
      return {
        verified: false,
        error: `Domain ${domain} is not yet verified. Please verify the TXT record was added correctly.`,
      };
    }

    const allTxtRecords = txtRecords.join(" ");
    const cleanedRecords = allTxtRecords.replace(/"/g, "").trim();
    const cleanedExpected = expectedTxtValue.trim();

    const foundInIndividual = txtRecords.some((record) => {
      const cleaned = record.replace(/"/g, "").trim();
      return cleaned.includes(cleanedExpected);
    });

    if (foundInIndividual || cleanedRecords.includes(cleanedExpected)) {
      return { verified: true };
    }

    return {
      verified: false,
      error: `Domain ${domain} is not yet verified. The TXT record value does not match. Please verify the record value is exactly: ${cleanedExpected}`,
    };
  } catch (err: any) {
    return {
      verified: false,
      error: `Domain ${domain} is not yet verified. Please try again in a few minutes.`,
    };
  }
}

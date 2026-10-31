import dotenv from "dotenv";
import nodemailer, { type Transporter } from "nodemailer";

dotenv.config();

type EmailAddress = string | { email: string; name?: string };

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file contents. */
  content: string;
}

interface SendMailOptions {
  from?: EmailAddress;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

interface ParsedEmailAddress {
  email: string;
  name?: string;
}

type Provider = "resend" | "sendgrid" | "smtp";

const RESEND_API_URL = "https://api.resend.com/emails";
const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

const DEFAULT_FROM_EMAIL =
  process.env.SENDER_EMAIL ||
  process.env.EMAIL_FROM ||
  "info@ymabouncycastles.uk";
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "YMA Bouncy Castle";
const DEFAULT_TO_EMAIL =
  process.env.EMAIL_USER ||
  process.env.EMAIL_FROM ||
  DEFAULT_FROM_EMAIL;

const parseSingleAddress = (input?: EmailAddress): ParsedEmailAddress => {
  if (!input) {
    return { email: DEFAULT_FROM_EMAIL, name: DEFAULT_FROM_NAME };
  }

  if (typeof input !== "string") {
    return { email: input.email, name: input.name };
  }

  const trimmed = input.trim();
  const bracketMatch = trimmed.match(/^(.*)<(.+@.+\..+)>$/);
  if (bracketMatch) {
    const rawName = bracketMatch[1].trim().replace(/^"(.*)"$/, "$1");
    return {
      email: bracketMatch[2].trim(),
      name: rawName || undefined,
    };
  }

  return { email: trimmed };
};

const normalizeEmails = (value?: string | string[]): string[] => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) =>
    item
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
};

/** Providers that currently have everything they need to attempt a send. */
export const configuredProviders = (): Provider[] => {
  const explicit = String(process.env.EMAIL_PROVIDER || "")
    .trim()
    .toLowerCase();

  const available: Provider[] = [];
  if (process.env.RESEND_API_KEY?.trim()) available.push("resend");
  if (process.env.SENDGRID_API_KEY?.trim()) available.push("sendgrid");
  if (
    process.env.EMAIL_HOST?.trim() &&
    process.env.EMAIL_USER?.trim() &&
    process.env.EMAIL_PASS?.trim()
  ) {
    available.push("smtp");
  }

  if (explicit === "resend" || explicit === "sendgrid" || explicit === "smtp") {
    return [explicit as Provider, ...available.filter((p) => p !== explicit)];
  }

  return available;
};

// ───────────────────────────────────────────────
// RESEND (https://resend.com) — primary when configured
// ───────────────────────────────────────────────
const sendViaResend = async (options: SendMailOptions) => {
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const fromAddress = parseSingleAddress(options.from);

  const payload = {
    from: fromAddress.name
      ? `${fromAddress.name} <${fromAddress.email}>`
      : fromAddress.email,
    to: normalizeEmails(options.to || DEFAULT_TO_EMAIL),
    cc: normalizeEmails(options.cc),
    bcc: normalizeEmails(options.bcc),
    reply_to: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      `Resend send failed (${response.status}): ${
        responseBody.message || "unknown error"
      }`,
    );
  }
  return { id: responseBody.id };
};

// ───────────────────────────────────────────────
// SENDGRID (https://sendgrid.com)
// ───────────────────────────────────────────────
const attachmentType = (filename: string): string =>
  filename.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/octet-stream";

const sendViaSendgrid = async (options: SendMailOptions) => {
  const apiKey = process.env.SENDGRID_API_KEY!.trim();
  const fromAddress = parseSingleAddress(
    options.from || {
      email: process.env.SENDGRID_FROM_EMAIL || DEFAULT_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || DEFAULT_FROM_NAME,
    },
  );

  const cc = normalizeEmails(options.cc);
  const bcc = normalizeEmails(options.bcc);

  const payload: Record<string, unknown> = {
    personalizations: [
      {
        to: normalizeEmails(options.to || DEFAULT_TO_EMAIL).map((email) => ({
          email,
        })),
        ...(cc.length ? { cc: cc.map((email) => ({ email })) } : {}),
        ...(bcc.length ? { bcc: bcc.map((email) => ({ email })) } : {}),
      },
    ],
    from: fromAddress.name
      ? { email: fromAddress.email, name: fromAddress.name }
      : { email: fromAddress.email },
    subject: options.subject,
    content: [
      ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
      ...(options.html ? [{ type: "text/html", value: options.html }] : []),
    ],
  };

  if (options.replyTo) {
    payload.reply_to = { email: options.replyTo };
  }
  if (options.attachments?.length) {
    payload.attachments = options.attachments.map((attachment) => ({
      content: attachment.content,
      filename: attachment.filename,
      type: attachmentType(attachment.filename),
      disposition: "attachment",
    }));
  }

  const response = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      errors?: Array<{ message?: string }>;
    };
    const message =
      body.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      "unknown error";
    throw new Error(`SendGrid send failed (${response.status}): ${message}`);
  }

  return { id: response.headers.get("x-message-id") || undefined };
};

// ───────────────────────────────────────────────
// SMTP (e.g. Gmail app password)
// ───────────────────────────────────────────────
let smtpTransport: Transporter | null = null;

const getSmtpTransport = (): Transporter => {
  if (smtpTransport) return smtpTransport;

  // Gmail shows app passwords in four groups ("abcd efgh ijkl mnop"); the
  // spaces are display-only and must be removed before use.
  const password = String(process.env.EMAIL_PASS || "")
    .replace(/\s+/g, "")
    .replace(/^["']|["']$/g, "");

  smtpTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: password,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });

  return smtpTransport;
};

const sendViaSmtp = async (options: SendMailOptions) => {
  const fromAddress = parseSingleAddress(
    options.from || {
      email: process.env.EMAIL_USER || DEFAULT_FROM_EMAIL,
      name: process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    },
  );

  const info = await getSmtpTransport().sendMail({
    from: fromAddress.name
      ? `"${fromAddress.name}" <${fromAddress.email}>`
      : fromAddress.email,
    to: normalizeEmails(options.to || DEFAULT_TO_EMAIL).join(", "),
    cc: normalizeEmails(options.cc).join(", ") || undefined,
    bcc: normalizeEmails(options.bcc).join(", ") || undefined,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      encoding: "base64",
    })),
  });

  return { id: info.messageId, response: info.response };
};

const SENDERS: Record<
  Provider,
  (options: SendMailOptions) => Promise<{ id?: string; response?: string }>
> = {
  resend: sendViaResend,
  sendgrid: sendViaSendgrid,
  smtp: sendViaSmtp,
};

/**
 * Sends an email through the first configured provider that accepts it:
 * Resend, then SendGrid, then SMTP. Each failure is logged and the next
 * provider is tried, so one exhausted account never silences the site.
 */
export const sendEmail = async (options: SendMailOptions) => {
  const providers = configuredProviders();

  if (!providers.length) {
    console.error(
      "[Email] No provider configured. Set RESEND_API_KEY, SENDGRID_API_KEY or EMAIL_HOST/EMAIL_USER/EMAIL_PASS.",
    );
    throw new Error("No email provider is configured");
  }

  const logContext = {
    to: normalizeEmails(options.to || DEFAULT_TO_EMAIL),
    bcc: normalizeEmails(options.bcc),
    subject: options.subject,
  };

  let lastError: unknown;

  for (const provider of providers) {
    try {
      console.log(`[Email] Sending via ${provider}`, logContext);
      const result = await SENDERS[provider](options);
      console.log(`[Email] Sent via ${provider}`, { ...logContext, id: result.id });
      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `[Email] ${provider} failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All configured email providers failed");
};

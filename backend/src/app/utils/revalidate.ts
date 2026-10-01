import { config } from "../config/config";

/**
 * Trigger on-demand ISR revalidation on the Next.js frontend.
 * Fire-and-forget — failures are logged but never block the response.
 */
export const revalidatePaths = async (paths: string[]): Promise<void> => {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) return;

  const url = `${config.frontendUrl}/api/revalidate`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, paths }),
    });
  } catch (err) {
    console.error("[revalidate] Failed to revalidate paths:", paths, err);
  }
};

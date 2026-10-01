type LoginBody = {
  email: string;
  password: string;
  remember?: boolean;
};

export async function apiLogin(
  body: LoginBody
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    try {
      const data = (await res.json()) as { message?: string; error?: string };
      return {
        ok: false,
        message: data.message || data.error || "Invalid credentials",
      };
    } catch {
      return { ok: false, message: "Invalid credentials" };
    }
  }

  return { ok: true };
}

import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { loginUser, SESSION_COOKIE_NAME } from "@/lib/auth/service";

const LoginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login:${ip}`, 10, 60 * 1000);
    if (!rl.ok) {
      return Response.json({ error: "Too many login attempts. Please wait a minute." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const { user, token } = loginUser(email, password);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return Response.json({ user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Login failed.";
    return Response.json({ error: msg }, { status: 401 });
  }
}

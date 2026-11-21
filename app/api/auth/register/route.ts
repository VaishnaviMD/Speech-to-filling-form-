import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { registerUser, SESSION_COOKIE_NAME } from "@/lib/auth/service";

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`reg:${ip}`, 5, 60 * 1000);
    if (!rl.ok) {
      return Response.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const { user, token } = registerUser(name, email, password);

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
    const msg = err instanceof Error ? err.message : "Registration failed.";
    return Response.json({ error: msg }, { status: 400 });
  }
}

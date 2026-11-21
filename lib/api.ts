import "server-only";
import { ZodError } from "zod";
import { UpstreamError } from "./groq";

export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    console.error("Zod error:", err.issues);
    return Response.json({ error: "Invalid request.", details: err.issues }, { status: 400 });
  }
  if (err instanceof UpstreamError) {
    console.error(err.message);
    const msg =
      err.status === 429
        ? "The AI service is busy. Please try again in a few seconds."
        : err.status === 500
          ? err.message
          : "The AI service had a problem. Please try again.";
    return Response.json({ error: msg }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}

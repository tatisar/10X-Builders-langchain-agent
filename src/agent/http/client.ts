import { getEnv } from "../../config/env.js";

export type HttpJsonResult =
  | { ok: true; status: number; json: unknown }
  | { ok: false; status?: number; error: string };

export async function getJson(
  url: string,
  options?: { timeoutMs?: number; headers?: Record<string, string> },
): Promise<HttpJsonResult> {
  const { SEARCHAPI_HTTP_TIMEOUT_MS } = getEnv();
  const timeoutMs = options?.timeoutMs ?? SEARCHAPI_HTTP_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
      signal: controller.signal,
    });

    const status = res.status;

    if (!res.ok) {
      const text = await safeReadText(res);
      return {
        ok: false,
        status,
        error: `HTTP ${status}${text ? `: ${truncate(text, 200)}` : ""}`,
      };
    }

    const json = (await res.json()) as unknown;
    return { ok: true, status, json };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: `Timeout after ${timeoutMs}ms` };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}


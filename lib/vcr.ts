// ─── Types ───────────────────────────────────────────────────────────

/** A single recorded frame on the tape */
export interface VcrFrame {
  /** Milliseconds elapsed since the first frame (t=0) */
  deltaMs: number;
  /** The chunk.event value from the LangGraph stream */
  event: string;
  /** The chunk.data payload — serialised JSON-safe object */
  data: unknown;
}

/** Full tape stored on disk */
export type VcrTape = VcrFrame[];

// ─── Cache Key ───────────────────────────────────────────────────────

const PROFILE_STORAGE_KEY = "aura-learning-user-profile";

/**
 * Build the VCR cache key from the user profile name stored in localStorage
 * and the optional targetKnowledge parameter.
 * Returns null if there is no profile / name is empty.
 */
export function buildCacheKey(targetKnowledge?: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    const name: string = (profile?.name ?? "").trim();
    if (!name) return null;

    // Combine name + knowledge point to form a unique key
    const suffix = targetKnowledge?.trim() || "_default_";
    return `${name}::${suffix}`;
  } catch {
    return null;
  }
}

// ─── Tape I/O via API ────────────────────────────────────────────────

/**
 * Try to load a cached tape for the given key.
 * Returns the tape array, or null if no cache exists.
 */
export async function loadTape(key: string): Promise<VcrTape | null> {
  try {
    const res = await fetch(`/api/vcr?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.exists && Array.isArray(json.tape) && json.tape.length > 0) {
      return json.tape as VcrTape;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a recorded tape to the server.
 */
export async function saveTape(key: string, tape: VcrTape): Promise<boolean> {
  try {
    const res = await fetch("/api/vcr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, tape }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Recorder ────────────────────────────────────────────────────────

/**
 * Creates a recorder that captures stream chunks with relative timestamps.
 * Usage:
 *   const rec = createRecorder();
 *   for await (const chunk of stream) { rec.record(chunk); ... }
 *   const tape = rec.finalize();
 */
export function createRecorder() {
  const frames: VcrFrame[] = [];
  let t0: number | null = null;

  return {
    record(chunk: { event: string; data: unknown }) {
      const now = Date.now();
      if (t0 === null) t0 = now;
      frames.push({
        deltaMs: now - t0,
        event: chunk.event,
        data: structuredClone(chunk.data),
      });
    },
    finalize(): VcrTape {
      return frames;
    },
    get length() {
      return frames.length;
    },
  };
}

// ─── Replayer ────────────────────────────────────────────────────────

/**
 * Replays a tape by yielding frames with the original timing gaps.
 * The caller consumes this async generator exactly like the live stream.
 * 
 * @param tape      The recorded tape
 * @param signal    Optional AbortSignal for cancellation
 * @param speedUp   Playback speed multiplier (1 = real-time, 2 = 2× faster). Default 1.
 */
export async function* replayTape(
  tape: VcrTape,
  signal?: AbortSignal,
  speedUp: number = 1,
): AsyncGenerator<{ event: string; data: unknown }> {
  let prevDelta = 0;

  for (const frame of tape) {
    if (signal?.aborted) return;

    // Compute the delay between this frame and the previous one
    const gap = Math.max(0, frame.deltaMs - prevDelta);
    const delayMs = Math.round(gap / speedUp);

    if (delayMs > 0) {
      await delay(delayMs, signal);
    }

    if (signal?.aborted) return;

    yield { event: frame.event, data: frame.data };
    prevDelta = frame.deltaMs;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve(); // resolve (not reject) so the generator exits cleanly
      },
      { once: true }
    );
  });
}

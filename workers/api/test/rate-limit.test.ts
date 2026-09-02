import { describe, expect, it } from "vitest";
import { RateLimiter } from "../src/rate-limit";

describe("RateLimiter", () => {
  it("allows up to max calls inside the window", () => {
    const rl = new RateLimiter({ windowMs: 60_000, max: 3 });
    expect(rl.check("ip", 0).allowed).toBe(true);
    expect(rl.check("ip", 1).allowed).toBe(true);
    expect(rl.check("ip", 2).allowed).toBe(true);
    expect(rl.check("ip", 3)).toMatchObject({ allowed: false, retryAfterSec: 60 });
  });

  it("resets the window once it has elapsed", () => {
    const rl = new RateLimiter({ windowMs: 1_000, max: 1 });
    expect(rl.check("ip", 0).allowed).toBe(true);
    expect(rl.check("ip", 500).allowed).toBe(false);
    const after = rl.check("ip", 1_001);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it("tracks keys independently", () => {
    const rl = new RateLimiter({ windowMs: 60_000, max: 1 });
    expect(rl.check("a", 0).allowed).toBe(true);
    expect(rl.check("b", 0).allowed).toBe(true);
    expect(rl.check("a", 0).allowed).toBe(false);
  });

  it("reports remaining quota", () => {
    const rl = new RateLimiter({ windowMs: 60_000, max: 5 });
    expect(rl.check("ip", 0).remaining).toBe(4);
    expect(rl.check("ip", 0).remaining).toBe(3);
  });

  it("sweep drops only expired buckets", () => {
    const rl = new RateLimiter({ windowMs: 1_000, max: 1 });
    rl.check("old", 0);
    rl.check("new", 900);
    rl.sweep(1_500);
    // "old" was swept, so the key is fresh again; "new" is still counted.
    expect(rl.check("old", 1_500).allowed).toBe(true);
    expect(rl.check("new", 1_500).allowed).toBe(false);
  });
});
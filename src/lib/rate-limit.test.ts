import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clientKey, __resetRateLimitForTests } from "./rate-limit";

beforeEach(() => __resetRateLimitForTests());

const T0 = 1_800_000_000_000;

describe("checkRateLimit", () => {
  it("allows requests up to the limit and then blocks", () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      expect(checkRateLimit("client-a", T0).allowed, `request ${attempt + 1}`).toBe(true);
    }
    const blocked = checkRateLimit("client-a", T0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each client separately", () => {
    for (let attempt = 0; attempt < 30; attempt += 1) checkRateLimit("client-a", T0);
    expect(checkRateLimit("client-b", T0).allowed).toBe(true);
  });

  it("lets a blocked client through again once the window has passed", () => {
    for (let attempt = 0; attempt < 30; attempt += 1) checkRateLimit("client-a", T0);
    expect(checkRateLimit("client-a", T0).allowed).toBe(false);
    expect(checkRateLimit("client-a", T0 + 61_000).allowed).toBe(true);
  });

  /*
   * Regression test. The limiter previously called hits.clear() when it hit its key cap,
   * which let an attacker reset every other client's counter just by sending enough
   * distinct keys.
   */
  it("does not reset an active client's counter when many new keys arrive", () => {
    for (let attempt = 0; attempt < 30; attempt += 1) checkRateLimit("victim", T0);
    expect(checkRateLimit("victim", T0).allowed).toBe(false);

    for (let index = 0; index < 6_000; index += 1) {
      checkRateLimit(`flood-${index}`, T0);
    }

    expect(checkRateLimit("victim", T0).allowed).toBe(false);
  });

  it("reports remaining capacity as it counts down", () => {
    expect(checkRateLimit("client-c", T0).remaining).toBe(29);
    expect(checkRateLimit("client-c", T0).remaining).toBe(28);
  });
});

describe("clientKey", () => {
  it("prefers the platform-signed header a client cannot forge", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.5",
      "x-forwarded-for": "1.2.3.4",
    });
    expect(clientKey(headers)).toBe("203.0.113.5");
  });

  it("falls back through the other trusted headers", () => {
    expect(clientKey(new Headers({ "cf-connecting-ip": "198.51.100.9" }))).toBe("198.51.100.9");
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.10" }))).toBe("198.51.100.10");
  });

  /*
   * x-forwarded-for is client-supplied and trivially spoofed. It is still used as a last
   * resort for self-hosting behind an unknown proxy, but it is marked so the identity is
   * never mistaken for a verified one.
   */
  it("marks an x-forwarded-for identity as untrusted", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBe("untrusted:1.2.3.4");
  });

  it("takes only the first hop from a forwarded chain", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12" });
    expect(clientKey(headers)).toBe("untrusted:1.2.3.4");
  });

  it("falls back to a shared bucket when no identifying header exists", () => {
    expect(clientKey(new Headers())).toBe("anonymous");
  });
});

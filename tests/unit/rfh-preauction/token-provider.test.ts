import { describe, expect, it, vi } from "vitest";
import { createRfhTokenProvider } from "@/features/rfh-preauction/client/token-provider";

describe("createRfhTokenProvider", () => {
  it("refreshes once and reuses the token until it nears expiry", async () => {
    const vernieuw = vi.fn(async () => ({ accessToken: "a1", expiresInSeconds: 3600 }));
    let nu = 0;
    const provider = createRfhTokenProvider({ vernieuw, now: () => nu });

    expect(await provider.getToken()).toBe("a1");
    nu = 3_000_000;
    expect(await provider.getToken()).toBe("a1");
    expect(vernieuw).toHaveBeenCalledTimes(1);
  });

  it("refreshes again once the safety margin is gone", async () => {
    let n = 0;
    const vernieuw = vi.fn(async () => ({ accessToken: `a${++n}`, expiresInSeconds: 3600 }));
    let nu = 0;
    const provider = createRfhTokenProvider({ vernieuw, now: () => nu });

    expect(await provider.getToken()).toBe("a1");
    nu = 3_600_000;
    expect(await provider.getToken()).toBe("a2");
  });

  it("collapses concurrent callers onto one refresh", async () => {
    const vernieuw = vi.fn(async () => ({ accessToken: "a1", expiresInSeconds: 3600 }));
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    const [een, twee] = await Promise.all([provider.getToken(), provider.getToken()]);

    expect(een).toBe("a1");
    expect(twee).toBe("a1");
    expect(vernieuw).toHaveBeenCalledTimes(1);
  });

  it("refreshes again after invalidate", async () => {
    let n = 0;
    const vernieuw = vi.fn(async () => ({ accessToken: `a${++n}`, expiresInSeconds: 3600 }));
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    expect(await provider.getToken()).toBe("a1");
    provider.invalidate();
    expect(await provider.getToken()).toBe("a2");
  });

  // Not in the plan's four tests, added after checking what happens when `vernieuw`
  // rejects. A rotating refresh token cannot be re-minted from code, so a token provider
  // that permanently cached a rejected in-flight promise after one network blip would take
  // the whole sync down until redeploy. This pins down that it does not: the failed
  // attempt is not remembered, and the very next call gets a fresh try.
  it("allows a fresh attempt after a refresh rejects, instead of caching the failure", async () => {
    let n = 0;
    const vernieuw = vi.fn(async () => {
      n++;
      if (n === 1) throw new Error("netwerkstoring");
      return { accessToken: `a${n}`, expiresInSeconds: 3600 };
    });
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    await expect(provider.getToken()).rejects.toThrow(/netwerkstoring/);
    expect(await provider.getToken()).toBe("a2");
    expect(vernieuw).toHaveBeenCalledTimes(2);
  });

  // Concurrent callers must collapse onto the same failure too: nobody should be left
  // hanging on a promise that only ever resolves for someone else.
  it("rejects every concurrent caller when the in-flight refresh fails", async () => {
    const vernieuw = vi.fn(async () => {
      throw new Error("netwerkstoring");
    });
    const provider = createRfhTokenProvider({ vernieuw, now: () => 0 });

    const [een, twee] = await Promise.allSettled([provider.getToken(), provider.getToken()]);

    expect(een.status).toBe("rejected");
    expect(twee.status).toBe("rejected");
    expect(vernieuw).toHaveBeenCalledTimes(1);
  });
});

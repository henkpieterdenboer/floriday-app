import { describe, expect, it, vi } from "vitest";
import { requestAccessToken } from "@/features/rfh-preauction/client/token-request";

const OPTIES = {
  tokenUrl: "https://idm.example.test/oauth2/abc/v1/token",
  clientId: "client-123",
  refreshToken: "oude-token",
};

describe("requestAccessToken", () => {
  it("exchanges the refresh token and returns the rotated one", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "nieuw-access",
          refresh_token: "nieuw-refresh",
          expires_in: 3600,
          token_type: "Bearer",
        }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result).toEqual({
      accessToken: "nieuw-access",
      refreshToken: "nieuw-refresh",
      expiresInSeconds: 3600,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(OPTIES.tokenUrl);
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(init?.body as string);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("oude-token");
    expect(body.get("client_id")).toBe("client-123");
  });

  it("reports the old token as still current when the server rotates nothing", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ access_token: "a", expires_in: 3600, token_type: "Bearer" }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result.refreshToken).toBe("oude-token");
  });

  it("throws with the OAuth error description, without echoing the token", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "The refresh token is invalid or expired.",
        }),
        { status: 400 },
      ),
    );

    const belofte = requestAccessToken({ ...OPTIES, fetchImpl });

    await expect(belofte).rejects.toThrow(/invalid_grant.*invalid or expired/s);
    await expect(belofte).rejects.not.toThrow(/oude-token/);
  });

  it("quotes and truncates the response body when it is not json, without echoing the token", async () => {
    const body = "<html>" + "a".repeat(500) + "</html>";
    const fetchImpl = vi.fn(async () => new Response(body, { status: 502 }));

    let error: Error | undefined;
    try {
      await requestAccessToken({ ...OPTIES, fetchImpl });
    } catch (e: unknown) {
      error = e as Error;
    }

    expect(error?.message).toContain("502");
    expect(error?.message).toContain(body.slice(0, 200));
    expect(error?.message).not.toContain(body.slice(0, 201));
    expect(error?.message).not.toContain(OPTIES.refreshToken);
  });

  it("throws a readable error when a 200 response carries no access_token", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }),
    );

    await expect(requestAccessToken({ ...OPTIES, fetchImpl })).rejects.toThrow(/200/);
  });

  it("rejects an empty access_token instead of returning it", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ access_token: "", expires_in: 3600 }), { status: 200 }),
    );

    await expect(requestAccessToken({ ...OPTIES, fetchImpl })).rejects.toThrow(/200/);
  });

  it("falls back to the old refresh token when the server rotates it to an empty string", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ access_token: "a", refresh_token: "", expires_in: 3600 }),
        { status: 200 },
      ),
    );

    const result = await requestAccessToken({ ...OPTIES, fetchImpl });

    expect(result.refreshToken).toBe("oude-token");
  });
});

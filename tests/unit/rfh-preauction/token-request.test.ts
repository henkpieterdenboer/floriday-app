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
});

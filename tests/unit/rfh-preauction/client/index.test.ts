import { describe, expect, it, vi } from "vitest";
import { createPreauctionClientWith } from "@/features/rfh-preauction/client/index";
import type { PreauctionHttp } from "@/features/rfh-preauction/client/http";

/**
 * `postJson` is given explicit parameter types here, not left for `vi.fn()` to infer from a
 * zero-argument callback. Passing a no-argument implementation straight into `vi.fn(...)`
 * narrows its inferred call signature to zero parameters, which turns `mock.calls[0]` into an
 * empty tuple and every destructured element into `never` - the same pitfall documented in
 * tests/unit/rfh-preauction/http.test.ts.
 */
function httpStub(response: unknown = { results: [], totalDocuments: 0 }) {
  const postJson = vi.fn(async (_path: string, _body: unknown) => response);
  return { http: { postJson } as PreauctionHttp, postJson };
}

describe("createPreauctionClientWith", () => {
  // The most important test in this file. hasPresale is not "exclude presale" but "restrict
  // to presale" - flip it to true, or drop it in a refactor, and nothing fails. You just get
  // a fifth less supply, silently, which is exactly the blind spot this feature exists to
  // close. This test is worthless unless it actually catches that: verified by temporarily
  // setting hasPresale to true in client/index.ts and confirming this test fails before
  // reverting.
  it("asks for the full clock, not just the presale slice, and passes the slice through untouched", async () => {
    const { http, postJson } = httpStub();
    const client = createPreauctionClientWith(http);

    await client.zoekKlokaanbod({
      auctionDate: "20260807",
      mainGroupKey: "1",
      auctionLocationKey: "NAALDWIJK",
      skip: 40,
      take: 20,
    });

    expect(postJson).toHaveBeenCalledTimes(1);
    const [path, body] = postJson.mock.calls[0];
    expect(path).toBe("/clock-supply-search");

    const request = body as Record<string, unknown>;
    expect(request.hasPresale).toBe(false);
    expect(request.auctionDate).toBe("20260807");
    expect(request.skip).toBe(40);
    expect(request.take).toBe(20);
    expect(request.searchFilterItems).toEqual([
      { filterItemType: "MainGroup", filterOptionKeys: ["1"] },
      { filterItemType: "AuctionLocation", filterOptionKeys: ["NAALDWIJK"] },
    ]);
  });

  it("parses the response through clockSupplyPageSchema", async () => {
    const { http } = httpStub({
      results: [],
      totalDocuments: 3,
      markings: [],
      filterItems: [],
    });
    const client = createPreauctionClientWith(http);

    const page = await client.zoekKlokaanbod({
      auctionDate: "20260807",
      mainGroupKey: "1",
      auctionLocationKey: "NAALDWIJK",
      skip: 0,
      take: 100,
    });

    expect(page).toEqual({ results: [], totalDocuments: 3 });
  });
});

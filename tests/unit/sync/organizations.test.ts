import { describe, expect, it, vi } from "vitest";
import { syncOrganizations } from "@/features/floriday/sync/organizations";
import type { OrganizationPage } from "@/features/floriday/schemas/organization";

function org(sequenceNumber: number) {
  return {
    organizationId: `00000000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    name: "M.v.d.Knaap Cymbidium BV",
    commercialName: null,
    companyGln: null,
    rfhRelationId: 12345,
    organizationType: "GROWER",
    endDate: null,
    sequenceNumber,
    physicalAddress: null,
    mailingAddress: null,
    website: null,
    phytosanitaryNumber: null,
    paymentProviders: [],
    isFsiCompliant: false,
  };
}

function page(sequences: number[], maximumSequenceNumber: number): OrganizationPage {
  return { maximumSequenceNumber, results: sequences.map(org) };
}

const written = () => ({ rowsProcessed: 2 });

describe("syncOrganizations", () => {
  it("walks pages until a short page signals the end", async () => {
    // pageSize 2: page 1 is full (2 results) so the walk continues; page 2 is short
    // (1 result) so it stops there. maximumSequenceNumber is set far beyond either page
    // deliberately - it must not influence this decision (see organizations.ts).
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1, 2], 999))
      .mockResolvedValueOnce(page([3], 999));
    const writePage = vi.fn().mockResolvedValue(written());
    const writeCursor = vi.fn();

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor,
      pageSize: 2,
    });

    expect(getJson).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
    expect(result.rowsProcessed).toBe(4);
    expect(result.reachedEnd).toBe(true);
    expect(writeCursor).toHaveBeenLastCalledWith(3n);
  });

  it("resumes from the given cursor", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([11], 11));
    await syncOrganizations({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn().mockResolvedValue(written()),
      writeCursor: vi.fn(),
    });

    expect(getJson.mock.calls[0][0]).toContain("/sync/10?");
  });

  it("stops on an empty page and reports it when below the maximum", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([], 999));

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
    });

    expect(result.pagesProcessed).toBe(0);
    expect(result.warning).toMatch(/empty page/i);
  });

  it("does not warn on an empty page once the maximum is reached", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([], 10));

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
    });

    expect(result.warning).toBeUndefined();
    expect(result.reachedEnd).toBe(true);
  });

  it("writes the page before advancing the cursor", async () => {
    const order: string[] = [];
    await syncOrganizations({
      client: { getJson: vi.fn().mockResolvedValueOnce(page([1], 1)) },
      startCursor: 0n,
      writePage: vi.fn(async () => {
        order.push("write");
        return written();
      }),
      writeCursor: vi.fn(async () => { order.push("cursor"); }),
    });

    expect(order).toEqual(["write", "cursor"]);
  });

  it("honours the page limit and reports it did not finish", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1], 100))
      .mockResolvedValueOnce(page([2], 100));

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn().mockResolvedValue(written()),
      writeCursor: vi.fn(),
      maxPages: 2,
      pageSize: 1,
    });

    expect(result.pagesProcessed).toBe(2);
    expect(result.reachedEnd).toBe(false);
  });

  it("stops without spinning when a non-empty page fails to advance the cursor", async () => {
    // Same failure mode as clock supply: the sync endpoint returns rows at sequence
    // numbers >= cursor, so the row at the cursor can always reappear by itself. If that
    // happens the cursor would never move and the loop would repeat the identical request
    // forever without this guard.
    const getJson = vi.fn().mockResolvedValueOnce(page([10], 999));

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 10n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
    });

    expect(getJson).toHaveBeenCalledTimes(1);
    expect(result.warning).toMatch(/did not advance/i);
    expect(result.reachedEnd).toBe(false);
  });

  it("uses the highest sequence number in a page, not the last row, as the new cursor", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(page([3, 1, 2], 3));

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn().mockResolvedValue(written()),
      writeCursor: vi.fn(),
    });

    expect(result.cursor).toBe(3n);
  });

  it("rejects a response that does not match the schema", async () => {
    const getJson = vi.fn().mockResolvedValueOnce({ results: [{ nonsense: true }] });

    await expect(syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
    })).rejects.toThrow();
  });

  it("skips a malformed record but keeps the rest of the page, still advancing the cursor past it", async () => {
    // Seen in practice against the real API: a handful of organizations with a
    // non-UUID organizationId, gone from the same query moments later. One bad record
    // must not take an otherwise-good page down with it.
    const badPage = {
      maximumSequenceNumber: 999,
      results: [org(1), { ...org(2), organizationId: "not-a-uuid" }, org(3)],
    };
    const getJson = vi.fn().mockResolvedValueOnce(badPage);
    const writePage = vi.fn().mockResolvedValue(written());
    const writeCursor = vi.fn();

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor,
    });

    expect(writePage).toHaveBeenCalledTimes(1);
    expect(writePage.mock.calls[0][0]).toHaveLength(2);
    // The cursor advances past the malformed record too (sequence 2), not just the two
    // valid ones - otherwise a persistently broken record would be requested forever.
    expect(writeCursor).toHaveBeenCalledWith(3n);
    expect(result.pagesProcessed).toBe(1);
    expect(result.warning).toMatch(/skipped 1 malformed/i);
  });

  it("stops with a warning when every record in a page fails to parse", async () => {
    const getJson = vi.fn().mockResolvedValueOnce({
      maximumSequenceNumber: 999,
      results: [{ nonsense: true }, { alsoNonsense: 1 }],
    });

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage: vi.fn(),
      writeCursor: vi.fn(),
    });

    expect(result.pagesProcessed).toBe(0);
    expect(result.warning).toMatch(/failed to parse/i);
  });
});

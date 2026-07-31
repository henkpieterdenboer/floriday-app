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
  it("walks pages until the cursor reaches the maximum", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(page([1, 2], 4))
      .mockResolvedValueOnce(page([3, 4], 4));
    const writePage = vi.fn().mockResolvedValue(written());
    const writeCursor = vi.fn();

    const result = await syncOrganizations({
      client: { getJson },
      startCursor: 0n,
      writePage,
      writeCursor,
    });

    expect(getJson).toHaveBeenCalledTimes(2);
    expect(result.pagesProcessed).toBe(2);
    expect(result.rowsProcessed).toBe(4);
    expect(result.reachedEnd).toBe(true);
    expect(writeCursor).toHaveBeenLastCalledWith(4n);
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
});

import { describe, expect, it, vi } from "vitest";
import {
  runOrganizationSyncWith,
  type RunOrganizationSyncDeps,
} from "@/features/floriday/sync/run-organization-sync";
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

function orgPage(sequences: number[], maximumSequenceNumber: number): OrganizationPage {
  return { maximumSequenceNumber, results: sequences.map(org) };
}

function fakeDeps(overrides: Partial<RunOrganizationSyncDeps> = {}): RunOrganizationSyncDeps {
  return {
    client: { getJson: vi.fn() },
    readCursor: vi.fn().mockResolvedValue(0n),
    writeCursor: vi.fn(),
    writeOrganizationsPage: vi.fn().mockResolvedValue({ rowsProcessed: 1 }),
    startRun: vi.fn().mockResolvedValue(1n),
    finishRun: vi.fn(),
    ...overrides,
  };
}

describe("runOrganizationSyncWith", () => {
  it("starts the run with the given trigger and reads the cursor before syncing", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(orgPage([], 0));
    const startRun = vi.fn().mockResolvedValue(9n);
    const readCursor = vi.fn().mockResolvedValue(5n);

    const deps = fakeDeps({ client: { getJson }, startRun, readCursor });
    await runOrganizationSyncWith({ trigger: "BACKFILL" }, deps);

    expect(startRun).toHaveBeenCalledWith("BACKFILL");
    expect(getJson.mock.calls[0][0]).toContain("/sync/5?");
  });

  it("records a successful run with the warning kept separate from errorMessage", async () => {
    const getJson = vi.fn().mockResolvedValueOnce(orgPage([], 999));
    const finishRun = vi.fn();

    const deps = fakeDeps({ client: { getJson }, finishRun });
    await runOrganizationSyncWith({ trigger: "CRON" }, deps);

    expect(finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({
      status: "SUCCEEDED",
      warning: expect.stringMatching(/empty page/i),
    }));
    const outcome = finishRun.mock.calls[0][1];
    expect(outcome.errorMessage).toBeUndefined();
  });

  it("records FAILED and rethrows on a sync error", async () => {
    const getJson = vi.fn().mockRejectedValueOnce(new Error("network down"));
    const finishRun = vi.fn();

    const deps = fakeDeps({ client: { getJson }, finishRun });

    await expect(runOrganizationSyncWith({ trigger: "CRON" }, deps)).rejects.toThrow("network down");
    expect(finishRun).toHaveBeenCalledWith(1n, expect.objectContaining({
      status: "FAILED",
      errorMessage: "network down",
    }));
  });

  it("rethrows the original sync error even when finishRun itself fails", async () => {
    const getJson = vi.fn().mockRejectedValueOnce(new Error("network down"));
    const finishRun = vi.fn().mockRejectedValue(new Error("db down"));

    const deps = fakeDeps({ client: { getJson }, finishRun });

    await expect(runOrganizationSyncWith({ trigger: "CRON" }, deps)).rejects.toThrow("network down");
  });

  it("passes maxPages through to the underlying sync", async () => {
    const getJson = vi.fn()
      .mockResolvedValueOnce(orgPage([1], 100))
      .mockResolvedValueOnce(orgPage([2], 100));

    const deps = fakeDeps({ client: { getJson } });
    const result = await runOrganizationSyncWith({ trigger: "CRON", maxPages: 1 }, deps);

    expect(result.pagesProcessed).toBe(1);
    expect(result.reachedEnd).toBe(false);
  });
});

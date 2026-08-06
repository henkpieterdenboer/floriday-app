import { getRfhEnv } from "@/lib/env";
import { createPreauctionHttp, type PreauctionHttp } from "@/features/rfh-preauction/client/http";
import { createProductieTokenProvider } from "@/features/rfh-preauction/client/token-provider";
import {
  clockSupplyPageSchema,
  type ClockSupplyPage,
} from "@/features/rfh-preauction/schemas/clock-supply";

export interface ZoekOpties {
  auctionDate: string;
  mainGroupKey: string;
  auctionLocationKey: string;
  skip: number;
  take: number;
}

export interface PreauctionClient {
  zoekKlokaanbod(opties: ZoekOpties): Promise<ClockSupplyPage>;
}

/**
 * hasPresale stays false throughout. It is not "exclude presale" but "restrict to presale",
 * and restricting would reproduce exactly the blind spot this whole feature exists to close
 * (spec §3.2). Never set it to true here.
 */
export function createPreauctionClientWith(http: PreauctionHttp): PreauctionClient {
  return {
    async zoekKlokaanbod(opties: ZoekOpties): Promise<ClockSupplyPage> {
      const antwoord = await http.postJson<unknown>("/clock-supply-search", {
        query: "",
        skip: opties.skip,
        take: opties.take,
        sorting: { field: "Product", direction: "Ascending" },
        hasPresale: false,
        searchFilterItems: [
          { filterItemType: "MainGroup", filterOptionKeys: [opties.mainGroupKey] },
          { filterItemType: "AuctionLocation", filterOptionKeys: [opties.auctionLocationKey] },
        ],
        searchRangeFilterItems: [],
        auctionDate: opties.auctionDate,
        includeMarkings: false,
      });

      return clockSupplyPageSchema.parse(antwoord);
    },
  };
}

export function createPreauctionClient(): PreauctionClient {
  const env = getRfhEnv();
  return createPreauctionClientWith(
    createPreauctionHttp({
      baseUrl: env.RFH_PREAUCTION_API_BASE_URL,
      tokenCache: createProductieTokenProvider(),
    }),
  );
}

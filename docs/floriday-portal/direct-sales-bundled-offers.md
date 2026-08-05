---
updatedAt: 2026-06-15T07:07:34.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Direct sales Bundled Offers

This page describes how to implement the Bundled Offer feature. 

This feature allows you to combine different trade items into one Bundled offer, including several features that are unique to this specific type of offer. For more information on Bundled offers and how to use them in the Floriday application, please read [the Helpcenter page](\[https://helpcenter.floriday.com/nl/articles/7994675-mixbundels]\(https://helpcenter.floriday.com/nl/articles/7994675-mixbundels\)).

***

<br />

## Supported scenarios

* Sync Bundled offers;
* Create Bundled offer;
* Edit Bundled offer;
* Delete Bundled offer.

For the business rules concerning Bundled offer, please read [Bundled Offers](https://developer.floriday.io/docs/direct-sales-bundled-offer).

***

<br />

## Sync Bundled offers

<br />

#### Purpose

Get Bundled offers added or changed in Floriday from Floriday in supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                   | API call / scenario                                                                                                                                               |
| :- | :------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a |                                                                                                                | [GetBundledOffersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/GetBundledOffersMaxSequence)                 |
| 1b | Sync supply lines with limit and latest sequence number. Supply has supply type customer offer.                | [GetBundledOffersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/GetBundledOffersBySequenceNumber)       |
| 2  | After creating, updating or deleting supply: Get bundled offer by bundledOfferId with all bundled offer lines. | [GetBundledOfferById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/GetBundledOfferById)                                 |
| 3  | After creating, updating or deleting supply: Get bundled offer by bundledOfferLineId.                          | [GetBundledOfferByBundledOfferLineId](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/GetBundledOfferByBundledOfferLineId) |

***

<br />

## Create a Bundled Offer

<br />

#### Purpose

Create a Bundle offer in Floriday.

***

<br />

#### Process steps

| NR | Process step                                                                                                        | API call / scenario                                                                                                       |
| :- | :------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------ |
| 1  | Create a Bundled offer with specific price, period, commercial available supply quantity and packing configuration. | [AddBundledOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/AddBundledOffer) |
| 2  | Bundled offer supply line will be created in Floriday customer portal.                                              |                                                                                                                           |

***

<br />

## Update a Bundled offer

<br />

#### Purpose

Update Bundled offer in Floriday.

***

<br />

#### Process steps

| NR | Process step                                                                                                | API call / scenario                                                                                                         |
| :- | :---------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| 1  | Update Bundled offer specific price, period, commercial available supply quantity or packing configuration. | [EditBundledOffer](https://api.staging.floriday.io/suppliers-api-2024v1/swagger/index.html#/BundledOffers/EditBundledOffer) |
|    | Bundled offer supply line will be updated in Floriday.                                                      |                                                                                                                             |
| 2  | Bundled offer supply line will be updated in the Floriday customer portal.                                  |                                                                                                                             |

***

<br />

## Delete a Bundled offer

<br />

#### Purpose

(soft) Delete Bundled offers in Floriday.

***

<br />

#### Process steps

| NR | Process step                                                                | API call / scenario                                                                                                             |
| :- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Delete Bundled offer.                                                       | [DeleteBundledOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BundledOffers/DeleteBundledOffer) |
| 2  | Bundled offer supply line will be soft deleted in Floriday customer portal. |                                                                                                                                 |
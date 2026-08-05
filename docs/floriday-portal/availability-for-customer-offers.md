---
updatedAt: 2026-05-13T10:19:41.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Availability for Customer Offers

Previously, trade items in Customer Offers with `catalogAvailability:true` would use the Availability of trade items used in CatalogPrices. This caused issues as the availability of CatalogPrices was limited to the current and the next week, where a CustomerOffer could span for much longer periods than two weeks.

With the introduction of [Availabilities per week](https://developer.floriday.io/docs/availabilities-per-week), we separated the availability for CatalogPrices and Customer Offers that use `catalogAvailability` by introducing a new endpoint specifically for Customer Offer Availabilites.

***

<br />

Currently, you can set the availability for CustomerOffers with the [EditTradeItemAvailabilityForCustomerOffers](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditTradeItemAvailabilityForCustomerOffers). Setting the availability for a trade item with this endpoint toggles the availability across**all** Customer Offers in which this trade item is included.

We are currently developing a new endpoint, that allows you to toggle the availability of a trade item on a customerOfferLine level. We plan to add this in the 2026v2 version.

<br />
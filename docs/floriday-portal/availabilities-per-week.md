---
updatedAt: 2026-06-12T09:41:54.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Availabilities per week

In the 2026v1 Release, we are changing how Availabilities for Catalog Prices work. Supplier organizations will now be able to set Availabilities per week when using Catalog Prices in stead of only setting availability for the current week and the next week.

This update replaces the previous endpoints for changing and retrieving availabilities with new endpoints for setting and retrieving Availabilities per week.

***

<br />

## Supported scenarios

* Set trade item availabilities per week
* Sync trade item availabilities per week

<br />

<Callout icon="📘" theme="info">
  Retrieving the availabilities per week can now only be done with a Sync endpoint. Synchronizing the availability data allows you to keep a real time overview of all the availabilities of trade items.

  This means that we no longer support the GET endpoint for retrieving the availability data of a single trade item.
</Callout>

***

<br />

## Set trade item availabilities per week

Setting the trade item availabilities per week is done with the [EditTradeItemAvailabilityPerWeek](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditTradeItemAvailabilityPerWeek) endpoint.

The endpoint contains the following properties. A description of the properties is listed below.

```json
{
  "tradeItemIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "fromWeek": {
    "week": 0,
    "year": 0
  },
  "tillWeek": {
    "week": 0,
    "year": 0
  },
  "isAvailable": true,
  "alwaysAvailableForCustomerOrganizationIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ],
  "neverAvailableForCustomerOrganizationIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
```

* `tradeItemIds`: Multiple tradeItemIds may be listed in one request. This sets the availabilities for all the listed tradeItemIds at once.
* `fromWeek`, `tillWeek`: The  availabilities per week are set based on a 'from' and 'till' method.
  * For instance, if `fromWeek` has the value "week": 3 and `tillWeek` has the value "week": 15. The availability of the trade item will be changed for week 3 up to and including week 15.
* `isAvailable`: This sets the availability of the trade item(s) to either `true` or `false`.
* `alwaysAvailableForCustomerOrganizationIds`: This allows supplier organizations to set an exception for specific customer organizations. This makes it so that the trade item availability is always `true` for those customer organizations, regardless of the status of `isAvailable`.
* `neverAvailableForCustomerOrganizationIds`: In the same vein, this property makes it so that the trade item availability is always `false` for the listed customer organizations, regardless of the status of `isAvailable`.

<Callout icon="💡" theme="default">
  `fromWeek` and `tillWeek` can only be set once per request. In order to set multiple, seperate weeks (i.e. week 3 - 15 and week 18 - 24), seperate requests must be made.
</Callout>

***

<br />

## Sync trade item availabilities per week

Synchronizing the trade item availabilities per week is done with the [GetTradeItemAvailabilitiesPerWeekBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesPerWeekBySequenceNumber) endpoint.

The endpoint contains the following properties. Properties that may require further explanation are listed below.

```json
{
  "maximumSequenceNumber": 0,
  "results": [
    {
      "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "week": 0,
      "year": 0,
      "isAvailable": true,
      "alwaysAvailableForCustomerOrganizationIds": [
        "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      ],
      "neverAvailableForCustomerOrganizationIds": [
        "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      ],
      "sequenceNumber": 0
    }
  ]
}
```

* `week`: We only return the weeks for trade items if activity is detected for that week.

<Callout icon="📘" theme="info">
  By activity we mean:

  * A: When a trade item has been manually set to either Available or Unavailable in that specific week or
  * B: When the number of pieces or the price of a trade item has been entered/adjusted/deleted in that specific week.
  * Weeks with no activity for that particular tradeItemId will not be returned.
</Callout>

* `isAvailable`: This sets the availability of the trade item(s) to either `true` or `false`.
* `alwaysAvailableForCustomerOrganizationIds`: This allows supplier organizations to set an exception for specific customer organizations. This makes it so that the trade item availability is always `true` for those customer organizations, regardless of the status of `isAvailable`.
* `neverAvailableForCustomerOrganizationIds`: In the same vein, this property makes it so that the trade item availability is always `false` for the listed customer organizations, regardless of the status of `isAvailable`.
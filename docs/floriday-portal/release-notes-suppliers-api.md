---
updatedAt: 2026-06-26T09:04:15.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Release notes - Suppliers API

This page will show the changes made in the suppliers API version 2026v1.

# Model changes

<br />

## CollectionTradeItem model - Added property

* Added the `supplierOrganizationId` to the CollectionTradeItem model.
  * Previously, sellerOrganizations were unable to distinguish which tradeItems belonged to their organization.

***

<br />

## SalesOrder model - Added property

* Added the `salesStrategyId` property to the `SalesOrder` model.

***

<br />

## TradeItem model - non nullable

* The properties `isParentForVariant`, `tradeItemVersion` and `isDeleted` in the `TradeItem` model are now non-nullable. Previously, these properties were already filled and never set to `null` in the first place.

***

<br />

## Photo model - Added property

* Added a nullable `sortIndex` property to the `Photo` model. This allows you to keep the same sorting order used in the Floriday application.

***

<br />

## AddBatch model - Changed imageUrl to ImageId

* Changed the property `imageUrl` to `ImageId` in the AddBatch model.

***

<br />

## AddBatchFromTradeItemProperties model - Changed imageUrl to ImageId

* Changed the property `imageUrl` to `ImageId` in the AddBatchFromTradeItemProperties model.

***

<br />

## TrackAndTraceScan model - Added enum value

* Added enum value `READY_FOR_TRANSIT` to `TrackAndTraceStatus` in the TrackAndTraceScan model.
  * This status is not available in versions 2025v1 or 2025v2 and will be automatically mapped to enum value NONE if returned in those versions.

***

<br />

## AddClockSupplyLine model - Added validation to minimumPricePerPiece

The `minimumPricePerPiece` in the AddClockSupplyLine model can no longer be set to 0. Previously, when a `minimumPricePerPiece` of 0 was set, the value would later be overwritten by Royal FloraHolland. For efficiency purposes, Royal FloraHolland will no longer overwrite this value. The value must now always be at least 0.01 when initially adding Clock supply.

* A supplier organization may configure a preset `minimumPricePerPiece` in the Floriday application. If this is configured, a value of 0.00 will not be rejected.

  This may be set by going to the Settings menu on the [Clock pre sales](https://app.floriday.io/supply/clock/clock-presales) page in Floriday.

  ![](https://files.readme.io/d3de6b7487cb73e155dec7ac65e636a803f8082abc233fa6de8b1c0e6501c71c-image.png)
* From there a supplier organization may set a default minimum price per piece for all clock supply. They may also set individual minimum prices per trade item, which override the default minimum prices if set.

***

<br />

## Organization model - Added property

Added the `IsFsiCompliant` property to the Organization model. This allows you to add filters based on if an organization is FSI compliant or not.

***

<br />

## CustomerTradeSettings model - Added property

Added the `TradesExclusivelyWithFsiCompliantSuppliers` property to the CustomerTradeSettings model. This indicates that the customer organization in question only works with suppliers that are FSI compliant.

This makes it so that the customer organization can only make Connections with supplier organizations that are FSI compliant. Additionally, when this trade setting is enabled, the Floriday application will show a notification on the Dashboard asking the customer organization if they want to remove existing Connections that are not FSI compliant.

***

<br />

# Endpoint changes

<br />

## Assigned number of pieces - Added endpoint

You can now update the AssignedNumberOfPieces for BatchPrices with the new [SetSupplyLineAssignedNumberOfPieces](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/SetSupplyLineAssignedNumberOfPieces) endpoint in DirectSales.

***

<br />

## Set ASAP delivery - Added endpoint

Supplier organizations can now set ASAP delivery for supply lines with the [SetSupplyLineOnlyAsapDelivery](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/SetSupplyLineOnlyAsapDelivery) endpoint. Setting ASAP delivery makes it so that customer organizations can only select the next delivery moment when placing order on that supply line. This currently only applies to supply lines for batches.

This feature was created specifically for supplier organizations that offer flowers using the Batch prices method. This allows them to create supply lines that are valid for a longer period of time, but can only be ordered using the first available delivery moment. ASAP delivery offers them more control over their stock, while ensuring freshness of their products.

* Added property `OnlyAsapDelivery` to the [EditBaseSupply](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/EditBaseSupply) and [AddSupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/AddSupplyLine) endpoints.
* Added property `OnlyAsapDelivery` to the models used to retrieve supply lines with.

***

<br />

## Invoice status for Logistic means - Added endpoint

Royal FloraHolland will be stopping a number of outdated EDI-PRICAT services as of September 1st 2026. We aim to offer alternatives for the data that used to be available in these EDI-PRICAT services. This includes offering Invoice status data for Logistic means through a new sync endpoint: [GetLogisticMeansInvoiceStatusBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/InvoiceLines/GetLogisticMeansInvoiceStatusBySequenceNumber)

Read more on how we aim to replace EDI-PRICAT via the Floriday API [on this page](https://developer.floriday.io/update/docs/replacing-pricat-via-the-floriday-api).

* *Update 27-05-2026*

Added property `creationDateTime` to the `LogisticMeansInvoiceStatus` model and the `InvoiceLine` model.

Take note that no historical creation data was available for the `InvoiceLine` model, which is why this property is nullable. Any data older than the moment this property was added to the `InvoiceLine` model will result in a `null` value.

* *Update 22-06-2026*

Added property `isCorrection` to the `InvoiceLine` model. The property `isCorrection` is set to true when the finance department of RFH indicates that it concerns a reversal entry or an upward revaluation.

***

<br />

## loadCarrierItemId - Added property

Added the property `loadCarrierItemId` to the `loadCarrierItem` model. This property indicates a load carrier item when using a Goods movement. The `loadCarrierItemId` is used instead of a `deliveryNoteLetter`, which isn't present when using Goods movements.

***

<br />

## alternativeDisplayName - Added property

Added the property `alternativeDisplayName` to the `LoadCarrierItem` model. This allows you to add an alternative display name for a trade item on Delivery notes.

***

<br />

## sellerOrganizationId - Added property to SalesOrder model

Added the `sellerOrganizationId` property to the `SalesOrder` model. In some cases with corrections (mainly with auction corrections), the `supplierOrganizationId` may be altered to an internal RFH supplier number. Previously, this could cause issues with correctly retrieving and processing `salesOrder` data via the API. The `sellerOrganizationId` will now always contain the original `supplierOrganzationId`.
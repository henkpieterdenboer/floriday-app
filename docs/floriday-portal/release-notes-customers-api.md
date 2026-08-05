---
updatedAt: 2026-06-26T12:29:18.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Release notes - Customers API

<br />

## Added new Sync endpoint for Trade item group selections

Added the `GetTradeItemGroupSelectionTradeItemsBySequenceNumber` and `GetTradeItemGroupSelectionTradeItemsMaxSequence` endpoints. This separates updates to selected trade items from updates to `TradeItemGroupSelections`.

Previously, updates to both selected trade items and `tradeItemGroupSelections` were grouped into one endpoint. As a result, any update to the `tradeItemGroupSelections` would also return all the selected trade items within that group. This would result in a disproportionate amount of updates if `tradeItemGroupSelection` would contain a large amount of selected trade items.

By separating the selected trade items, this is no longer an issue.

* **Route changes**
  * Renamed Route `GetTradeItemGroupSelectionsMaxSequence` to `GetTradeItemGroupSelectionHeadersMaxSequence`.
  * Renamed Route `GetTradeItemGroupSelectionsBySequenceNumber` to `GetTradeItemGroupSelectionHeadersBySequenceNumber`.

<br />

* **Added endpoints**
  * Added new endpoint `GetTradeItemGroupSelectionTradeItemsMaxSequence`.
  * Added new endpoint `GetTradeItemGroupSelectionTradeItemsBySequenceNumber`.

<br />

* **Model changes**
  * Added `TradeItemGroupSelectionHeader` model.
  * Expanded `TradeItemGroupSelectionTradeItem` model with the following properties:
    * `TradeItemGroupSelectionId`
    * `SequenceNumber`
  * In the `TradeItemGroupSelection` model, renamed property `SupplySelectionId` to `TradeItemGroupSelectionId`.

***

<br />

## Added new Sync endpoints for InvoiceLines

Added endpoints `GetLogisticMeansInvoiceStatusMaxSequence` & `GetLogisticMeansInvoiceStatusBySequenceNumber` used to retrieve InvoiceLines for Logistic means.

***

<br />

## New models

* `AddSalesOrderCorrectionRequestForAdditionalService`
* `CorrectionAdditionalService`
* `SalesOrderReclamationActionDecision`

***

<br />

## OrganizationDetails model - Added property

Added the `IsFsiCompliant` property to the OrganizationDetails model. This allows you to add filters based on if an organization is FSI compliant or not.

***

<br />

## CustomerTradeSettings model - Added property

Added the `TradesExclusivelyWithFsiCompliantSuppliers` property to the CustomerTradeSettings model. This indicates that the customer organization in question only works with suppliers that are FSI compliant.

This makes it so that the customer organization can only make Connections with supplier organizations that are FSI compliant. Additionally, when this trade setting is enabled, the Floriday application will show a notification on the Dashboard asking the customer organization if they want to remove existing Connections that are not FSI compliant.

***

<br />

## SupplyLine model - Added property

Added property `OnlyAsapDelivery` to the SupplyLine model. `OnlyAsapDelivery` indicates that only the next delivery moment of the supply line can be chosen.

This feature was created specifically for supplier organizations that offer flowers using the Batch prices method. This allows them to create supply lines that are valid for a longer period of time, but can only be ordered using the first available delivery moment. ASAP delivery offers them more control over their stock, while ensuring freshness of their products.

***

<br />

## SalesOrderCorrectionRequest model - Added property

Added property `deliveryPricePerPiece` to the `SalesOrderCorrectionRequest` model. This allows delivery costs to be corrected.

Added `additionalServices` to the `SalesOrderCorrectionRequest` model to prepare for an upcoming addition of additionalService & sticker corrections.

Added `reclamationActionDecision` to the `SalesOrderCorrectionRequest` model. After issuing a reclamation, the decision of the reclamation will be returned here. Possible outcomes are:

* Reauctioning in name of supplier/customer/auction/quality
* Goods are returned to supplier
* Goods are destroyed
* Complaing is not accepted
* Return to stock (not yet available, but may be activated in the future).

***

<br />

## AddSalesOrderCorrectionRequest Model - Added property

Added property `deliveryPricePerPiece` to the `AddSalesOrderCorrectionRequest` model. This allows delivery costs to be corrected.

Added `additionalServices` to the `AddSalesOrderCorrectionRequest` model to prepare for an upcoming addition of Additional Service & sticker corrections.

<br />
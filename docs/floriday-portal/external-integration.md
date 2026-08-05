---
updatedAt: 2026-06-15T07:13:53.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# External Integration

#### Purpose:

To share Sales orders from other channels (Email, telephone, webshops etc.) with Floriday for financial processing.

> 📘 When to use External Integration
>
> Please note that Sales orders must primarily be **initiated by customer organizations** via Floriday or the API. In case this is practically not possible, an ExternalIntegration can be used by a supplier organization.

***

<br />

#### Prerequisites:

* The supplier application has the latest update of [Organizations](https://developer.floriday.io/docs/organizations).
* The supplier application has the latest update of [Trade items](https://developer.floriday.io/docs/trade-items).
* The supplier application has the latest update of [Warehouses](https://developer.floriday.io/docs/warehouses1).
* The supplier application has the latest update of Delivery locations.

***

<br />

#### Process steps:

|    | Process step                                                                                                                                                                                                                                                | API call / Scenario                                                                                                                                            |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create a Sales order.                                                                                                                                                                                                                                       | [AddSalesOrderExternalIntegration](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderExternalIntegration)      |
|    | After the Sales order is created, a Fulfillment request and the subsequent Delivery order(s) are generated. A Delivery order is a group of one or more Fulfillment requests with the same delivery location, latestDeliveryDateTime and Despatch warehouse. |                                                                                                                                                                |
| 2  | Sync Delivery orders by latest sequence number.                                                                                                                                                                                                             | [GetDeliveryOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrdersBySequenceNumber) |
|    | Process the retrieved Delivery orders in the supplier application with their unique delivery order ID.                                                                                                                                                      |                                                                                                                                                                |
| 3  | Add a Fulfillment order based on (a part of) Fulfillment requests that belong to the same Delivery order.                                                                                                                                                   | [AddFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrder)                          |

***

<br />

> ❗️ External Integration with E-Wallet
>
> A Sales order originating from an External Integration should be uploaded to Floriday as soon as possible, to avoid complications for the supplier during the fulfillment process. This is especially true in case the buyer pays by E-wallet (see: [Business Rules: E-Wallet](https://developer.floriday.io/docs/e-wallet)).
>
> Floriday will only accept the Sales order if the buyer's E-Wallet has sufficient credit. A buyer could adjust their credit limit, but this can be a time consuming process (this may take 1 hour up to several days). During this time the suppliers system may try to upload the sales order periodically until accepted.
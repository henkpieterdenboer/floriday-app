---
updatedAt: 2025-06-02T13:30:02.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Clock pre sales Supply

## Target audience

* Supplier organizations;
* Customer organizations.

<br />

## Purpose

* Enables getting clock pre sales supply lines by Supplier and Customer organizations;
* Enables buyers to place sales orders on clock pre sales supply lines.

<br />

## Guidance

For Business Rules and differences between different supply types please refer to [Supply type overview](https://developer.floriday.io/docs/supply-type-overview).

**Clock pre sales supply:**

* Was primarily intended for placing orders by customer organizations on clock pre sales supply in the auction sales channels. For the supplier organization implementation it is currently intended as a check after allocating clock pre sales supply and as a basis for processing clock pre sales sales orders.
* Customers can place sales orders via the API on clock pre sales supply lines;
  * Please note: Currently this functionality is behind Early Access, please contact our support team for more information;
* Specifies the current supply for clock sales of the auction sales channels by the supplier organization.
* Contains: supplyLinedId, availability status, tradItemId, batchId, price per piece, numberOfPieces, trade period, one package configuration (pieces per package, VBN package code, load carrier type). In addition a delivery note code, additional package configuration details (custom package Id, packages per layer, layers per load carrier), delivery note reference (DeliveryNoteCode + letter of the original clock delivery), trade-instrument and sales channel can be added if available.
* Can only be modified or deleted by the supplier organization or the auction sales channel organization before inbound auction fulfillment orders are scanned by auction warehouses. Once scanned, modifications or delete actions are no longer possible.
* Currently clock pre sales supply is allocated by initiating an auction fulfillment order with clock pre sales prices or auction fulfillment order with pre determined clock pre sales prices settings in the Floriday application.
* Clock pre sales supply is always based on clock sales supply.
* Clock (pre) sales supply is based on batches.
* Only Customer organizations can place orders on clock pre sales supply in the auction sales channels or after whitelisting by Floriday via the customer API.
* Clock pre sales is supported by:
  * RFH (FloraMondo), VRM and Plantion auction sales channels;
  * Floriday customer portal;
  * Floriday customer API after being added to the whitelist;
* The auction sales channel rules are applicable for clock pre sales supply and differ for each auction sales channel, in general:
  * A pre determined clock pre sales maximum order window, non overlapping with (maximum) clock sales bid window.
  * A pre determined maximum clock pre sales allocation quantity based on the clock sales supply batch quantity.
  * Supplier organizations set prices and quantities based of the clock pre sales supply.
  * Supply is available for all auction sales channel customers. (not customer specific)
  * After the expiration of the clock pre sales order window, non sold clock pre sales supply will be allocated as clock sales supply.
  * Pre determined pricing and quantities settings can be entered by suppliers in the Floriday application, which are applicable for clock pre sales supply.
* ~~Currently Clock pre sales supply cannot be retrieved via the Customer API.~~
* ~~Currently Clock pre sales orders cannot be placed via the Customer API.~~
* Currently fulfillment orders of auction delivery orders initiate allocation of clock (pre) sales supply. Given this situation certain commercial information is used in the delivery order:
  * Clock pre sales price
  * Clock minimum price
  * Remarks for auction managers
  * Auction date

<br />

## Implementation model

![](https://files.readme.io/0ae3600-Screenshot_2022-07-29_at_17.36.54.png "Screenshot 2022-07-29 at 17.36.54.png")

<br />

## Interaction model

![](https://files.readme.io/781c563-Screenshot_2022-10-11_at_11.30.18.png "Screenshot 2022-10-11 at 11.30.18.png")
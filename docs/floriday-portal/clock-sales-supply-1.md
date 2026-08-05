---
updatedAt: 2025-07-04T07:22:49.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Clock sales Supply

## Target audience

* Supplier organizations;

<br />

## Purpose

* Enables getting clock supply lines and auction status by Supplier organizations.

<br />

## Guidance

For Business Rules and differences between different supply types please refer to [Supply type overview](https://developer.floriday.io/docs/supply-type-overview).

**Clock sales supply:**

* Is primarily intended for placing bids by customer organizations on clock sales supply in the auction sales channels and are the basis for creating clock pre sales supply. For the supplier organization implementation it is currently intended as a check after allocating clock sales supply and as a basis for processing clock sales sales orders.
* Specifies the current supply for clock sales of the auction sales channels by the supplier organization.
* Contains: supplyLinedId, tradItemId, batchId, numberOfPieces, auction date, auction location, auction group code, quality group code and one package configuration (pieces per package, VBN package code, load carrier type). In addition a minimum price per piece, minimum order quantity, service code, delivery note code, additional package configuration details (custom package Id, packages per layer, layers per load carrier), service code, delivery code, packing agent organization Id, clock pre sales supply reference, delivery note reference (DeliveryNoteCode + letter of the original clock delivery), auction status can be added if available.
* Can be modified or deleted by the the supplier organization or the auction sales channel organization before scanning of inbound auction fulfillment orders by auction warehouses.
* Currently clock sales supply is allocated by initiating an auction fulfillment order that is accepted by the auction sales channel.
* Clock sales supply is based on batches.
* Only Customer organizations can place bids on clock sales supply in the auction sales channels.
* Clock sales is supported by RFH (FloraMondo), VRM and Plantion auction sales channels.
* The auction sales channel rules are applicable for clock sales supply and differ for each auction sales channel, in general:
  * Auction supply(lots) are auctioned on auction clocks in a pre determined auction group based on criteria e.g. productgroup (large flowered roses), batch quantity (multiple trolleys, 1 trolley or packages) and quality ("A1", "A2").
  * Auction groups are placed within a predetermined sequence by the auction sales channels per auction clock.
  * Auction supply of different supplier organizations within an auction group is placed in a random sequence by a lottery system.
  * Predetermined auction days and start time (e.g. 6am) of the general auction and an expected end time per auction clock are applicable.
  * Supplier organizations can set minimum prices.
  * Supply is available for all auction sales channel customers. (not customer specific)
  * Allocated clock pre sales supply is not allocated for clock sales supply. After the expiration of the clock pre sales order window, non sold clock pre sales supply will allocated as clock supply.
* Currently fulfillment orders of auction delivery orders initiate allocation of clock (pre sales) supply. Given this situation certain commercial information is used in the delivery order:
  * Clock pre sales price
  * Clock minimum price
  * Remarks for auction managers
  * Auction date

<br />

> 🚧 **Warning**
>
> RFH digital auction
>
> * With the new RFH digital auction new possibilities with necessary workflows will be supported for Suppliers and Customers. These will be tested with Floriday early access users in the Floriday application and the RFH digital auction users. If successful they will be made available in the ERP API.
> * The following workflows are expected / tested (not complete):
>   * "From farm clock sales": batches => clock supply => auction => sales orders => customer delivery from farm
>   * "External stock support clock (pre) sales": batches => external stock delivery(auction warehouse capability) => clock (pre sales) supply => clock pre sales orders => customer delivery => auction => clock sales orders => customer delivery

<br />

## Implementation model

![](https://files.readme.io/5ee4666-Screenshot_2022-08-01_at_14.07.36.png "Screenshot 2022-08-01 at 14.07.36.png")

<br />

## Interaction model

![](https://files.readme.io/cdcc602-Screenshot_2022-10-11_at_11.31.14.png "Screenshot 2022-10-11 at 11.31.14.png")
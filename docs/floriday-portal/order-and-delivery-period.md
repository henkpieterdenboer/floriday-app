---
updatedAt: 2025-04-28T11:21:23.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Order and delivery period

## Target audience

* Supplier organizations;
* Customer organizations.

<br/>

## Purpose

Replaces the single trade period with a seperate order period and delivery period. This means that supply lines can be created for the long term without the customer being able to buy on it.

<br/>

## Guidance

* An order period can be created with a startDateTime and endDateTime by the supplier;
* Supplier can choose a different order and delivery period for each individual supply line;
* An order period can be requested with a startDateTime and endDateTime by the customer;
* Sales orders can only be placed on supply lines between the startDateTime and endDateTime of the order period of the supply line;
* A delivery period can be created with a startDateTime and endDateTime by the supplier;
* A delivery period can be requested with a startDateTime and endDateTime by the customer;
* Sales orders can only be placed with a delivery date which is between the startDateTime and endDateTime of the delivery period of the chosen supply line;
* Order period and delivery period can only partially be the same, however:
  * Only the order period can start and/or end earlier than the delivery period;
  * Delivery period cannot start earlier than the startDateTime of the order period;
  * Delivery period cannot end earlier than the endDateTime of the order period;
  * DeliveryPeriod must always be extended until at least the first delivery moment after the end of the OrderPeriod.
  * If the DeliveryPeriod and OrderPeriod end at the same time, the offer cannot be ordered for the full OrderPeriod because no valid delivery time can be found at a certain moment.

<br/>

> 📘 When DeliveryPeriod is "Null"
>
> Not every supplyLine has to include a seperate defined DeliveryPeriod. When a supplier creates [Batch Prices](https://developer.floriday.io/docs/direct-sales-batch-supply) in the Floriday UI, the DeliveryPeriod will be Null.
>
> When a customer places an order on a Batch Price where the DeliveryPeriod = null, the first available DeliveryPeriod should always be chosen.

<br/>
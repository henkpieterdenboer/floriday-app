---
updatedAt: 2026-06-15T07:14:33.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Auction Delivery

## Supported scenarios

* Add delivery orders;
* Add fulfillment orders;
* Delivery.

***

<br />

## Add Delivery Orders

#### Purpose

Add Delivery Orders for auction delivery in Floriday.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted delivery orders for an external warehouse in the supplier application.

<br />

#### Process steps

<table>
  <thead>
    <tr>
      <th>NR</th>
      <th>Process step</th>
      <th>API call / scenario</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>1</td>
      <td>Create a delivery order with one or more batches or trade items for goods movement to an 'Auction' destination warehouse.\
      When using trade items, batches will automatically be generated.</td>
      <td><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/AddClockDeliveryOrder">AddClockDeliveryOrder</a></td>
    </tr>

    <tr>
      <td>2</td>
      <td>Get delivery orders by delivery order ID.</td>
      <td><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrderById">GetDeliveryOrderById</a></td>
    </tr>

    <tr>
      <td>3</td>
      <td>The retrieved batches will be added or updated in the supplier application with the new batch IDs.</td>

      <td />
    </tr>

    <tr>
      <td>4</td>
      <td>Get the package stickers as a PDF for the delivery order.</td>
      <td><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetTrayLabelsAsPdfById">GetTrayLabelsAsPdfById</a></td>
    </tr>

    <tr>
      <td>5</td>
      <td>The retrieved stickers will be added or updated in the supplier application.</td>

      <td />
    </tr>

    <tr>
      <td>6</td>
      <td>Get plant passports (optional).</td>
      <td><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PlantPassports/GetPlantPassportPdf">GetPlantPassportPdf</a></td>
    </tr>

    <tr>
      <td>7</td>
      <td>The retrieved plant passports will be added or updated in the supplier application.</td>

      <td />
    </tr>
  </tbody>
</table>

***

<br />

## Add Fulfillment Orders

<br />

#### Purpose

Add Fulfillment Orders for goods movement in Floriday.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The supplier application has the latest update of delivery orders;
* The user has inserted fulfillment orders in the supplier application.

<br />

#### Process steps

| NR | Process step                                                                                                                 | API call / scenario                                                                                                                                         |
| :- | :--------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Add a fulfillment order with one or more load carrier items with one or more fulfillment requests with a number of packages. | *[AddFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrder)*                     |
| 2  | The 'Auction' warehouse gets an ASN from Floriday.                                                                           |                                                                                                                                                             |
| 3  | The warehouse sends a fulfillment status to Floriday                                                                         |                                                                                                                                                             |
| 4  | Get fulfillment order status by ID.                                                                                          | *[GetFulfillmentOrderStatusById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetFulfillmentOrderStatusById)* |
| 5  | The retrieved fulfillment order status will be added or updated in the supplier application.                                 |                                                                                                                                                             |
| 6  | Get logistic labels (Auction delivery note) as pdf for a fulfillment order.                                                  | *[GetLogisticLabelsById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetLogisticLabelsById)*                 |
| 7  | The retrieved logistic labels will be added or updated in the supplier application.                                          |                                                                                                                                                             |

<br />

> 📘 Time out errors
>
> 504 (Gateway Timeout) on Fulfillment orders
>
> * Despite an initial 504 error, sometimes fulflillment orders can later be successfully committed within the fulfillment-service if the time out is resolved quickly enough;
> * You can check the status of a placed fulfillment order after the time-out message, when the status is `committed` you do not have to replace this fulfillment order, when the status is `cancelled` you do have to place a new fulfillment order.

***

<br />

## Delivery

<br />

#### Purpose

Delivery of goods to an auction warehouse.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The supplier application has the latest update of delivery orders;
* The supplier application has the latest update of fulfillment orders.

<br />

#### Process steps

| NR | Process step                                                                                             | API call / scenario                                                                                                                                         |
| :- | :------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Dispatch of delivery of goods with logistic labels and optional plant passports to an auction warehouse. |                                                                                                                                                             |
| 2  | The auction warehouse receives the goods and scans the logistic labels.                                  |                                                                                                                                                             |
| 3  | Get fulfillment order status by ID.                                                                      | *[GetFulfillmentOrderStatusById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetFulfillmentOrderStatusById)* |
| 4  | The retrieved fulfillment order status will be added or updated in the supplier application.             |                                                                                                                                                             |
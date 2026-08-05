---
updatedAt: 2025-04-28T11:19:37.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Webhooks

## Target audience

* Supplier organizations;
* Supplier warehouse organizations.

<br/>

## Purpose

Webhooks intend to provide an efficient way of data synchronization between Floriday and linked systems. They are intended to *supplement* the polling of the public API, not as a replacement.

<br/>

## Brief

* A broadcasted event relates to 1 new or modified resource (hereinafter referred to as 'Aggregate' );
* An event does not contain any content information from the aggregate, but only the ID. The recipient of the event must retrieve the data from Floriday itself via a call on the API;
* For every adjustment of the aggregate - ie when Floriday increases its *sequence* - an event is sent out. It is conceivable that *more* events will be output - but with a minimum of one for each sequence increment;
* The customers themselves remain responsible for keeping the data synchronized; webhooks are only an extra tool.

<br/>

## Guidance

* A subscription to webhooks can be registered per Organization(ID), including the URL to which the events should be sent;
* The event model is always the same. A distinction is made between AggregateTypes and EventTypes (see below);
* The customer must filter events himself (if desired). It is not possible to subscribe to specific events;
* The implementation is not versioned. AggregateTypes and EventTypes can be extended. Existing types will not be changed;
* The responsibility of synchronization of data remains at the Supplier ERP and the supplier ERP needs to synchronize the resources accordingly;
* As an additional service events will be posted at the Supplier ERP callbackURL;
  * Floriday does not guarantee delivery of events;

<br/>

## Summary

An overview of the different webhook types can be found below. The relationship between the state of the aggregate and the events are explained in the state diagrams in the next section.

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Webhook Aggregate Type
      </th>

      <th>
        Webhook Event Type
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        BATCH
      </td>

      <td>
        `CREATED`
      </td>

      <td>
        A new batch has been created.
      </td>
    </tr>

    <tr>
      <td>
        BATCH
      </td>

      <td>
        `QUANTITY_CHANGED`
      </td>

      <td>
        The quantity of which the batch consist has been adjusted
      </td>
    </tr>

    <tr>
      <td>
        BATCH
      </td>

      <td>
        `CANCELLED`
      </td>

      <td>
        A batch is removed (the quantity has been set to 0)
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `ACCEPTED`
      </td>

      <td>
        A SalesOrder has been approved
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `REJECTED`
      </td>

      <td>
        A SalesOrder is rejected due to a financial validation
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `CANCELLED`
      </td>

      <td>
        An ACCEPTED order can be canceled by a user (within the cancellation period).\
        A COMMITTED order can only be cancelled at clock presale if the batch is not auctioned, or from a correction.
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `COMMITTED`
      </td>

      <td>
        An order is fully approved and may be continued for logistical processing.
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `PRICE_UPDATED`
      </td>

      <td>
        As soon as a price (due to dynamic delivery costs) has been adjusted
      </td>
    </tr>

    <tr>
      <td>
        SALESORDER
      </td>

      <td>
        `CORRECTED`
      </td>

      <td>
        Once a correction has been made in the SalesOrder
      </td>
    </tr>

    <tr>
      <td>
        DELIVERYORDER
      </td>

      <td>
        `CREATED`
      </td>

      <td>
        There is a new delivery order
      </td>
    </tr>

    <tr>
      <td>
        DELIVERYORDER
      </td>

      <td>
        `REQUEST_CHANGED`
      </td>

      <td>
        Fulfillment request added, deleted or changed to the delivery order
      </td>
    </tr>

    <tr>
      <td>
        DELIVERYORDER
      </td>

      <td>
        `FULFILLMENT_CHANGED`
      </td>

      <td>
        The fulfillment of (part of) a fulfillment request has been changed.
      </td>
    </tr>

    <tr>
      <td>
        DELIVERYORDER
      </td>

      <td>
        `CANCELLED`
      </td>

      <td>
        A delivery order has been deleted
      </td>
    </tr>

    <tr>
      <td>
        FULFILLMENTORDER
      </td>

      <td>
        `SUBMITTED`
      </td>

      <td>
        There is a new (unprocessed) fulfillment order
      </td>
    </tr>

    <tr>
      <td>
        FULFILLMENTORDER
      </td>

      <td>
        `ACCEPTED`
      </td>

      <td>
        The processing of the FFO was successful
      </td>
    </tr>

    <tr>
      <td>
        FULFILLMENTORDER
      </td>

      <td>
        `REJECTED`
      </td>

      <td>
        The processing of the FFO was not successful. The FFO can be updated in the front end.
      </td>
    </tr>

    <tr>
      <td>
        FULFILLMENTORDER
      </td>

      <td>
        `CORRECTED`
      </td>

      <td>
        If there has been a correction to, for example, the logistics resources.
      </td>
    </tr>

    <tr>
      <td>
        FULFILLMENTORDER
      </td>

      <td>
        `CANCELLED`
      </td>

      <td>
        The processing of the FFO was not successful. The FFO can be updated in the front end.
      </td>
    </tr>
  </tbody>
</Table>

<br/>
<br/>

## State Diagrams

Below is an overview of the flow and the associated events for each aggregate. The events sent by Floriday are shown here in blue in bold. A description of these events can be found in the overview above.

<br/>
<br/>

**BATCH:**

![](https://files.readme.io/9984bc3-State_Diagram_-_Batch.png "State Diagram - Batch.png")

<br/>
<br/>

**SALES ORDER:**

![](https://files.readme.io/69477f1-State_Diagram_-_Sales_Order.png "State Diagram - Sales Order.png")

<br/>
<br/>

**DELIVERY ORDER:**

![](https://files.readme.io/9bb3531-State_Diagram_-_Delivery_Order.png "State Diagram - Delivery Order.png")

<br/>
<br/>

**FULFILLMENT ORDER:**

![](https://files.readme.io/1f71b30-State_Diagram_-_Fulfillment_Order.png "State Diagram - Fulfillment Order.png")

<br/>
<br/>

## Implementation model

![](https://files.readme.io/3696646-Screenshot_2022-02-09_at_05.07.14.png "Screenshot 2022-02-09 at 05.07.14.png")

<br/>
<br/>

## Interaction model

![](https://files.readme.io/7c30946-Screenshot_2022-10-11_at_10.57.56.png "Screenshot 2022-10-11 at 10.57.56.png")

<br/>
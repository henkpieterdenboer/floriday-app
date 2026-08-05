---
updatedAt: 2026-06-29T10:58:25.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Daytrade

Floriday Daytrade combines the advantages of the Auction logistics with the flexibility of Direct sales. It allows supplier organizations to market their auction supply much earlier, reach more buyers and deliver greater volumes to hubs, while Royal FloraHolland takes care of logistics.

When implementing Daytrade using the Floriday API, we recommend consulting your supplier organizations regarding how they would like to work with Daytrade. Based on their (and your) wishes, there are different ways to go about the implementation. You may choose to implement all the endpoints, or do a partial implementation where the supplier organization does one part of the process in the supplier application and another part in the Floriday application.

If you or your supplier organizations do not wish to use Daytrade, they may continue to create Auction deliveries using either the new Daytrade endpoints or the existing Clock supply endpoints.

For more information about Daytrade, please read [the Helpcenter page on Daytrade](https://helpcenter.floriday.com/nl/articles/10470611-hoe-floriday-daytrade-werkt).

***

<br />

<br />

<br />

## Getting started with Daytrade

<Tabs>
  <Tab title="Onboarding">
    Regardless of how you choose to implement Daytrade, Floriday will first maintain an onboarding process to regulate which supplier organizations can start using Daytrade. This way we are able to scale the amount of supplier organizations working with Daytrade, while still being able to make impactful changes where necessary. Supplier organizations that are interested in working with Daytrade may sign up for a waiting list.

    Before actually onboarding a supplier organization, we will establish contact with their software developer to make sure their implementation is streamlined with the way the supplier organization wants to use Daytrade.

    For more information about the waiting list and applying for Daytrade as a supplier organization, please read [this Helpcenter article](https://helpcenter.floriday.com/nl/articles/10558491-de-wachtrij-voor-floriday-daytrade).

    <br />

    > 📘 What happens after onboarding a supplier organization
    >
    > * The delivery form that used to go on a load carrier will be replaced by an **SSCC label**.
    > * Pre sales prices will become visible on the **Daytrade** page in the Floriday application (Pre sales prices were previously shown on the **Auction**> **Clock pre sales** page).

    ***
  </Tab>

  <Tab title="How it works">
    Daytrade starts by creating a Batch; this can be done as early as 08:00 CEST.

    Next, the supplier organization establishes a Sales strategy for that Batch. The Batch is then offered as pre sales supply, with the option to offer it as Auction supply (either directly or at a later time).

    In the Sales strategy, a supplier organization sets:

    * The minimum percentage of that batch which is reserved for Auction.
    * The number of pieces of this batch used for this particular Sales strategy.
    * The Expected delivery date and time on a specific hub.
    * The pre sales price for the products for a specific hub.

    The pre sales supply is now created and customer organizations may start placing orders on it. When the supply is still at the supplier organization's warehouse, the customer organization may choose to:

    * Have their orders delivered the next auction day, the same way 'regular' clock pre sales is delivered.
    * Have their orders delivered on the same day, on time periods between 08:00 - 16:00 CEST (the working hours of RFH Logistics). Take note that the available time periods always start at least 2 hours after the `expectedDeliveryDateTimeOnHub` in the Sales strategy.
    * For instance, a supplier organization sets the `expectedDeliveryDateTimeOnHub` to 10:00 CEST. The available time periods a customer organizations will be able to choose from lie within 12:00 to 16:00 (exact time periods may differ between hubs).

    <br />

    > 👍 Priority Delivery
    >
    > When the supply is delivered, scanned and physically present at a hub, customer organizations may also choose to use Priority Delivery. Priority Delivery is an option that allows customer organizations to receive the goods within 1,5 hours after placing the order.

    <br />

    When a supplier organization receives sales orders on their Daytrade pre sales supply, corresponding Delivery orders are automatically created by Floriday. These sales orders must be delivered at a minimum.

    At some point in the day, the supplier organization decides to allocate their unsold goods among the available hubs by creating Auction supply. After this step, the Delivery orders are updated.

    When the orders are delivered to a hub, the Logistics team at Royal FloraHolland makes sure the sold goods are delivered to the customer organizations that bought them.

    The unsold goods remain available for purchase in pre sales. At 16:00 CEST, if the unsold goods are offered as Auction supply, only 50% of these products are made available for pre sales. The rest is set aside to be auctioned the next day, alongside any unsold goods at time of auction.

    <br />

    > 📘
    >
    > Take note that the maximum of 50% only takes effect when Auction supply is created. If Auction supply is not created, all of the pre sales supply remains available for direct purchase.

    <br />

    In summary, Daytrade enables supplier organizations to market their auction supply much earlier, reach even more buyers and deliver greater volumes to hubs at once. All the while Royal FloraHolland takes care of the logistics operations.

    ***
  </Tab>

  <Tab title="Scenario">
    Below is a scenario that a supplier organization which uses Daytrade may experience. The scenario includes all the endpoints used for Daytrade, which are also described in the Implementation section below.

    <br />

    > ❗️ Disclaimer
    >
    > The scenario below is entirely fictional. The times and steps described in the scenario below are an example of how and when a supplier organization may choose to use Daytrade.
    >
    > The exception to this is **16:00**, after which the auction supply is fixed and 'regular' auction pre sales rules take effect. This is also described as such in the scenario below.

    <br />

    * **10:00**: The supplier organization roughly decides their supply for the day (***AddBatch***) and applies a pre sales price to the batch, while taking into account the minimum amount reserved for auction and the expected Delivery time on the hub (***AddSalesStrategy***).
    * **Between 10:00 and 14:00**: Supplier organization receives pre sales orders placed by customer organizations (SalesOrders sync, via ***GetSalesOrdersBySequenceNumber***), including the associated Delivery orders (DeliveryOrder sync via ***GetDeliveryOrdersBySequenceNumber***).
    * **14:00**: The supplier organization checks the orders they received up until now and on which hub the orders are expected to be delivered. These orders need to be delivered at a minimum. The supplier organization decides to definitively allocate the unsold supply to the Naaldwijk & Rijnsburg hubs, to auction them the next day (***AddClockSupplyLineV2***). Subsequently, the Delivery orders are updated with the unsold amounts (DeliveryOrder sync via ***GetDeliveryOrdersBySequenceNumber***). The supplier organization starts loading their Load carriers and printing their logistic labels (***AddFulfillmentOrder*** & ***GetLogisticLabels***).
      * Take note that pre sales continues during this time.
    * **15:00**: The carrier organization picks up the Load carriers for delivery at the hub(s).
    * **16:00**: At 16:00, the rules for pre sales are tightened for batches that auctioned the next day; the maximum percentage for pre sales is set to 50%. At this point, the goods are physically present at the hub(s). This means that orders placed by buyer organizations may be delivered immediately in stead of waiting on the next auction day (which is normally the case with auction pre sales).

    ***
  </Tab>
</Tabs>

***

<br />

<br />

<br />

## Implementation

This section describes the endpoints necessary for the implementation of Daytrade. For a better understanding we will first illustrate the workflow of Daytrade.

With the answers to the following questions in mind, a supplier organization can establish when and how they start their Daytrade journey:

* At what point do they know how much stock they roughly have for that day?
* For what price do they want to offer this stock in pre sales?
* When do they start the process of delivering this stock to one or more hubs (e.g. for auctioning the stock).

The answers to these questions may differ per supplier organization. Generally, trade starts at around 10:00 CEST, while Clock pre sales in its current form only opens at 12:00 for the next auction day. Obviously, some supplier organizations will want to start their pre sales at around 10:00 as well, while still being able to benefit from Royal FloraHolland's logistics operation. This is where Daytrade comes into play.

<br />

<Tabs>
  <Tab title="Full implementation">
    The full implementation of Daytrade starts with a supplier organization creating batches and a sales strategy at the start of the day. They then create pre sales supply which is offered from their warehouse.

    Over the course of the day, the supplier organization allocates their goods to the designated hubs by creating Auction supply. Goods that are already sold in pre sales are distributed by the Logistics team. A part of the auction supply is still sold as pre sales supply, while the rest is set aside to be auctioned.

    | Nr | Process step                                                                                                                                                               | API call / Scenario                                                                                                                                            |
    | :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | 1  | Create a Batch with a unique batchId.                                                                                                                                      | [AddBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatch)                                                          |
    | 2  | Add a Sales Strategy based on batchId.                                                                                                                                     | [AddSalesStrategy](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesStrategy/AddSalesStrategy)                                    |
    | 3  | Create Clock supply based on salesStrategyId.                                                                                                                              | [AddClockSupplyLineV2](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/AddClockSupplyLineV2)                          |
    | 4  | Synchronize Delivery orders based on sequence number. Start from 0 if no data is present; use maximumSequenceNumber and repeat until all Delivery orders are synchronised. | [GetDeliveryOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrdersBySequenceNumber) |
    | 5  | Create a Fulfillment Order based on deliveryOrderId.                                                                                                                       | [AddFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrder)                          |
    | 6  | Retrieve Logistic Label (SSCC) based on fulfillmentOrderId.                                                                                                                | [GetLogisticLabels](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetLogisticLabelsById)                          |

    ***
  </Tab>

  <Tab title="Partial implementation">
    A supplier organization could also choose to do part of Daytrade in the supplier application and a part in the Floriday application.

    For instance, they may want to create their strategy in Floriday, but create their clock supply in the supplier application.

    Which way works best should be consulted with your supplier organization(s). For more information or advice, you can always contact your Implementation Consultant.

    ***
  </Tab>

  <Tab title="Alternative Implementation">
    An alternative implementation is possible for a subset of supplier organizations that use auction hubs as their warehouse location. These supplier organization create supply on these hubs, but do not (yet) want to auction their goods. To allocate goods to warehouses located at a hub, the so called Goods Movement is added as an extra step. Determining the Sales strategy is done after the Goods Movement and retrieving Delivery orders.

    In this scenario, the stock is sold and delivered directly from the warehouse location at the hub while postponing the decision to auction the stock. Supplier organizations that auction on a daily business will most likely see no value in this option. This method is mostly relevant to suppliers that use hubs as their warehouse location.

    <br />

    <Table align={["left","left","left"]}>
      <thead>
        <tr>
          <th>
            Nr
          </th>

          <th>
            Process step
          </th>

          <th>
            API call / Scenario
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            1
          </td>

          <td>
            Create a Batch with a unique batchId.
          </td>

          <td>
            [AddBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatch)
          </td>
        </tr>

        <tr>
          <td>
            2
          </td>

          <td>
            Perform a Goods Movement to a hub.
          </td>

          <td>
            [AddDeliveryOrderGoodsMovement](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/AddDeliveryOrderGoodsMovement)
          </td>
        </tr>

        <tr>
          <td>
            3
          </td>

          <td>
            Add a Sales Strategy based on batchId.
          </td>

          <td>
            [AddSalesStrategy](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesStrategy/AddSalesStrategy)
          </td>
        </tr>

        <tr>
          <td>
            4
          </td>

          <td>
            Create Clock supply based on salesStrategyId (optional).
          </td>

          <td>
            [AddClockSupplyLineV2](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/AddClockSupplyLineV2)
          </td>
        </tr>

        <tr>
          <td>
            5
          </td>

          <td>
            Synchronize Delivery orders based on sequence number.
            Start from 0 if no data is present; use maximumSequenceNumber and repeat until all Delivery orders are synchronised.
          </td>

          <td>
            [GetDeliveryOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrdersBySequenceNumber)
          </td>
        </tr>

        <tr>
          <td>
            6
          </td>

          <td>
            Create a Fulfillment Order based on deliveryOrderId.
          </td>

          <td>
            [AddFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrder)
          </td>
        </tr>

        <tr>
          <td>
            7
          </td>

          <td>
            Retrieve Logistic Label (SSCC) based on fulfillmentOrderId.
          </td>

          <td>
            [GetLogisticLabels](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetLogisticLabelsById)
          </td>
        </tr>
      </tbody>
    </Table>

    ***
  </Tab>
</Tabs>
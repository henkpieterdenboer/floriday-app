---
updatedAt: 2026-06-17T10:26:37.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Purchase orders

<br />

## Purchase order scenarios

* Create purchase orders
* Delete purchase orders
* Return purchase orders
* Create order requests

***

<br />

## Create purchase orders

<br />

#### Purpose

Create a Purchase order Add direct sales purchase orders in Floriday trading agent.

<br />

| NR  | Proces steps                                                                                                                                              | API call / scenario                                                                                                            |
| :-- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Creates a new purchase order.                                                                                                                             | *[AddPurchaseOrder](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/AddPurchaseOrder)* |
| 2   | Floriday matches purchase order to available supply lines.                                                                                                |                                                                                                                                |
| 3 A | When a 100% matching trade item and supply line is found Floriday will create a sales order.                                                              | Sales order                                                                                                                    |
| 3 B | When any value in the purchase order does not 100% match with the found trade items and/or supply lines, Floriday will give an *ActionRequired* response. | Response: Action required                                                                                                      |

<br />

<details>
  <summary><b>Possible Action Required types</b></summary>

  <br />

\* DIFFERENT\_PRICE

* SUPPLY\_UNAVAILABLE
* SUPPLY\_NOT\_FOUND
* NOT\_ENOUGH\_IN\_STOCK
* SUPPLY\_INVALID\_PERIOD
* SUPPLY\_EXPIRED
* TRADE\_ITEM\_CODE\_DIFFERENCE
* VBN\_PRODUCT\_CODE\_DIFFERENCE
* PACKAGE\_DIFFERENCE
* POT\_SIZE\_DIFFERENCE
* PIECES\_PER\_PACKAGE\_DIFFERENCE
* TRADE\_ITEM\_NOT\_FOUND
* SALES\_ORDER\_REJECTED
* FAILED\_TO\_CREATE\_SALES\_ORDER
* NUMBER\_OF\_PIECES\_INVALID\_FOR\_SALES\_UNIT
* ORDER\_REQUEST\_REJECTED\_BY\_SUPPLIER
* LOAD\_CARRIER\_DIFFERENCE
* PACKAGES\_PER\_LAYER\_DIFFERENCE
* LAYERS\_PER\_LOAD\_CARRIER\_DIFFERENCE
* INVALID\_DELIVERY\_GLN
* INVALID\_DELIVERY\_MOMENT
* TRADE\_ITEM\_UNAVAILABLE
* INVALID\_SUPPLY\_REQUEST
* CUSTOMER\_DOES\_NOT\_ACCEPT\_TRANSPORT\_COST
* INCORRECT\_ADDITIONAL\_SERVICE
* INCORRECT\_INCUDED\_SERVCES
* CURRENCY\_DIFFERENCE

</details>

<br />

<br />

<Callout icon="📘" theme="info">
  **Declined with Counter offer**

  A supplier organization that receives a purchase order that does not entirely match with their supply, may choose to propose a **Counter offer**.

  This Counter offer comes in the form of a Customer offer, which in turn generates a new supply line. When a Counter offer is created, this updates the PurchaseOrder.

  Primarily, the `orderRequestStatus` will be updated to `DECLINED_WITH_COUNTER_OFFER` while filling the  `customerOfferId` property with the newly created Counter offer.

  This allows you to directly find the Counter offer by requesting the customerOfferId.
</Callout>

***

<br />

## Cancelling purchase orders

**Purpose:** Cancel direct sales purchase orders in Floriday trading agent.

<br />

**Prerequisites:**

* Placed purchase order has not been transformed into a sales order;

<br />

| NR | Proces steps                                | API call / scenario                                                                                                                  |
| :- | :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Deletes a purchase order if still possible. | *[DeletePurchaseOrder](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/DeletePurchaseOrder)* |

<br />

***

## Receiving purchase orders

**Purpose:** Receive direct sales purchase orders placed on Floriday trading agent.

<br />

**Prerequisites:**

* Placed purchase order has not been transformed in a sales order

<br />

| NR | Proces steps                                                                                 | API call  / scenario                                                                                                                                             |
| :- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get the status of a specific purchase order.                                                 | *[GetPurchaseOrderById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/GetPurchaseOrderById)*                           |
| 2  | Returns the maximum sequence number found in purchase orders.                                | *[GetPurchaseOrdersMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/GetPurchaseOrdersMaxSequence)*           |
| 3  | Returns a list of a maximum of 1000 purchase orders starting from a specified sequencenumber | *[GetPurchaseOrdersBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/GetPurchaseOrdersBySequenceNumber)* |

<br />

***

## Placing a purchase order request

**Purpose:** Add direct sales purchase order request in Floriday trading agent. In stead of counting on Floriday for matching the purchase order the buyer relies only on confirmation of the supplier.

For the business rules concerning order requests, please read [Order requests](https://developer.floriday.io/docs/purchase-order-requests-1).

<br />

> 👍 Validation
>
> * Supplier has to allow customer to place order requests;
> * Number of pieces must be more than 0;
> * Number of pieces has to equal to complete packages: (NumberOfPieces / PiecesPerPackage) = 1
> * LatestDeliveryDateTime must be in the future;
> * When including a SupplyLine, the TradeItemId in the supply line must correspond to the TradeItemId in the order request;
> * TradeItem supplierOrganization must correspond with the supplierOrganization in the order request;
> * Delivery.LocationGln must be known and active with Floricode standards. A company GLN is not sufficient;
> * When the order request cannot be matched, it will be sent to the supplier as an OrderRequest with the status PENDING;
> * When the order request can be matched with existing supply it will directly become a sales order if the trade settings are set to "Skip ready to order" in the [system settings](https://customers.floriday.io/settings/system) in the customer portal.

<br />

| NR | Proces steps                                           | API call / scenario                                                                                                                          |
| :- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new purchase order as purchase order request | *[AddPurchaseOrderRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PurchaseOrders/AddPurchaseOrderRequest)* |
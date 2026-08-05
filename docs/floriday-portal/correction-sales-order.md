---
updatedAt: 2026-08-03T08:53:38.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Sales order correction requests

## Target audience

* Customer organizations
* Supplier organizations

<br />

## Purpose

* Enables after sales corrections of sales orders by customer and supplier organizations.

<br />

## Guidance

<Callout icon="📘" theme="info">
  **Correcting Delivery time and Delivery location**

  In the 2025v2 version of the Floriday API, both customer organizations and supplier organizations will be able to perform correction requests on Delivery time and Delivery location. This will impact Fulfillment Requests and how they are processed by supplier organizations.

  Fulfillment requests are grouped into Delivery Orders based on both Delivery time and Delivery location. Correcting either of these can result in changed or new Fulfillment requests being created by Floriday.

  When a correction on either Delivery time and Delivery location takes place:

  - The FulfillmentRequestId stays the same.
  - The Delivery Order where the Fulfillment Request was a part of, receives an update that it no longer contains the corresponding FulfillmentRequestId.
  - A new Delivery Order is created or an existing Delivery Order (that matches the Delivery time and/or date of the now corrected Fulfillment request) is updated with this FulfillmentRequestId.
</Callout>

<br />

<Callout icon="📘" theme="info">
  ### Use the application

  Please use the Floriday modules _sales orders_ for supplier organizations and _purchase orders_ for customer organizations for a better understanding of the workflow and functions.
</Callout>

* Sales order correction requests can be initiated by the Customer or the Supplier.
* All corrections require a response by the other party ( Supplier or Customer ) to accept or reject the correction, except when both the sales order and correction are initiated by the Supplier, in which case no correction response is required unless a customer setting prevents this ( see next rule ).
* A Customer has the option to enable or prevent automatic acceptance of sales order corrections initiated by the Supplier. The settings are Supplier-specific. Without a setting, the default business rules apply ( see previous rule ).
* Sales order correction request can either be a modification or a cancellation.
* Sales order correction requests can have a deadline, set with the `expiresAtDateTime` property.
  * The `expiresAtDateTime` cannot be set later than 18:00 (Europe/Amsterdam time zone) on the following day if it is submitted on a Monday through Thursday.
  * The `expiresAtDateTime` cannot be set later than 18:00 (Europe/Amsterdam time zone) on the next Monday day if it is submitted on a Friday through Sunday.
* The following can be modified with a sales order correction request: pricePerPiece, packageTypeCode, numberOfPieces, piecesPerPackage and Incoterm.
* Additional information is advised: reason and contact person.
* The following correction statuses are available.
  * **PENDING**: request is pending approval of the counterparty.
  * **ACCEPTED**: pending request is accepted by the counterparty.
  * **DECLINED**: pending request is declined by the counterparty.
  * **DELETED**: pending request is deleted by the request initiating party.
  * **EXPIRED**: pending request is expired. If there is no response before the 'expiresAtDateTime'.
  * **~~COMMITTED~~**~~: approved request is processed in the sales order.~~
* Digital complaint handling is foreseen in the future for support in handling of disputes. Currently this process is supported by the RFH complaint handling department (ORA).

For the latest additional Business Rules we refer to our [Floriday Helpcenter](https://helpcenter.floriday.com/en/articles/4807723-file-a-correction-request)

***

<br />

## Implementation model

![](https://files.readme.io/c684e55-Screenshot_2022-02-16_at_23.49.17.png "Screenshot 2022-02-16 at 23.49.17.png")

<br />

<br />

## Interaction model

![](https://files.readme.io/b865792-Screenshot_2022-02-14_at_23.05.06.png "Screenshot 2022-02-14 at 23.05.06.png")

<br />

![](https://files.readme.io/3ea2e8d-Screenshot_2022-02-14_at_23.04.32.png "Screenshot 2022-02-14 at 23.04.32.png")
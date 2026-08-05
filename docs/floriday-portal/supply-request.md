---
updatedAt: 2025-04-28T11:19:45.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply request

## Target audience

* Customer organizations
* Supplier organizations

<br />
<br />

## Purpose

* Enables a customer requested supplier supply-lines based on customer specifications.

<br />
<br />

## Guidance

**A Supply request:**

* Specifies a request for one or more supply-lines by the customer organization to a supplier organization based on existing trade items and selected packing configurations;
* Contains a supplier organization, order period, delivery period and expiration date time, one or more supply request lines with a trade-item. In addition a title, description, number of pieces(quantity description), included services,(delivery, stickering), selected packing configuration, price per piece and agreement reference can be added;
* If no packing configuration is selected in the supply request, all trade item packing configurations are applicable in the Customer offer;
* A customer may lock or unlock one or more lines in a Supply request. Locking a line in a Supply request disables the grower from modifiying those specific lines after they have been accepted.
* Can be accepted or rejected by the supplier organization within the expiration date time specified by the customer organization. After expiration the supply request is no longer valid and cannot be accepted or rejected;
* Acceptance by the supplier organization must contain price per piece, number of pieces, order period, delivery period, despatch warehouse and if the supply uses catalog availability or not for the customer organization. If locked by customer the price per piece can not be changed;
* If accepted a Customer offer is created;
* If accepted with usesCatalogAvailability 'true' a customer offer is created with availability type 'unlimited' and the given number of pieces is an indicative maximum total order quantity. Availability is managed with [Trade item availabilities](https://developer.floriday.io/docs/trade-item-availabilities2);
* If accepted with usesCatalogAvailability 'false' customer offer is created with availability type 'limited' and the given number of pieces is a limited maximum total order quantity;
* Rejection by the supplier organization must contain a rejection reason for the customer organization;
* Can have status:
  * **PENDING**: supplier request is pending approval;
  * **ACCEPTED**: supplier request is accepted by the supplier orgnization;
  * **REJECTED**: supplier request is rejected by the supplier organization;
  * **UNKNOWN**: fallback status for unexpected events;
* Can be created in the sales channel Floriday or FloraXchange.

<br />
<br />

## Implementation model

![](https://files.readme.io/b3604fd-Screenshot_2022-02-17_at_16.20.42.png "Screenshot 2022-02-17 at 16.20.42.png")

<br />
<br />

## Interaction model

![](https://files.readme.io/87134d1-Screenshot_2022-10-11_at_11.02.03.png "Screenshot 2022-10-11 at 11.02.03.png")

Additional:

* Sales channel FX can also be a source for supply requests.
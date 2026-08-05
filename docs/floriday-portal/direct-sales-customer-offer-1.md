---
updatedAt: 2026-06-17T11:04:09.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Direct sales Customer Offer

## Target audience

* Supplier organizations;
* Customer organizations.

***

<br />

## Purpose

* Enables creating, updating and deleting customer offers by Supplier organizations;
* Enables getting customer offer supply-lines for placing purchase orders or sales orders by Customer organizations.

***

<br />

## Guidance

For the Implementation Guide, please consult [Customer Offer](https://developer.floriday.io/docs/customer-offer-new).

<br />

**A Customer offer:**

* Can be used to create generic offers for one or more customer organizations;
* Can be used to creates offers based on specific supply requests from a customer organization, usually combined with an agreement reference;
* Can be created as a **Purchase Tip** (see below);
* Contains one ore more Customer Offer Lines, which are the separate supply lines associated with a Customer Offer.
* Created via Floriday API can currently only be customer specific;
  * A Customer Offer created in the Floriday application may also be created for all customer organization.
* Is edited separately from its Customer Offer Lines. Read the Implementation Guide for details;
* Can be created with 2 different Supply types, which configure the availability of its Customer Offer Lines:
  * **Based on availability**: The availability of Customer Offer Lines is based on the availability of the trade items used in [Catalog Supply](https://developer.floriday.io/docs/direct-sales-catalog-supply-1). When the availability of a trade item in Catalog Supply is toggled on or off, this simultaneously toggles the availability on or off for that trade item in all Customer Offers using this Supply type.
  * **Limited quantity**: The availability of Customer Offer lines is based on the number of pieces set in the Customer Offer. With this Supply type, the number of pieces counts down and is no longer available once the number of pieces reaches 0.
    * **Note:** The number of pieces may be updated with the [SetNumberOfPiecesOfCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/SetNumberOfPiecesOfCustomerOfferLine) even after it reaches 0.

<br />

> 👍 Purchase Tip
>
> A Purchase tip is an alternate version of the Customer Offer which is available under certain circumstances. It's characterized by being a short term Customer Offer, available for at most 3 hours and is specifically for (one user of) one customer organization.
>
> A Purchase tip is generally created after a supplier and customer have agreed upon an order outside of Floriday (i.e. by telephone). Once the Purchase Tip is created, the customer organization receives a notification by email and a prominent alert in the Floriday application.
>
> A Customer Offer is automatically created as a Purchase Tip when the following criteria are met:
>
> * The Customer Offer has a maximum `orderPeriod` of 3 hours.
> * The Customer Offer has a maximum of 1 `allowedCustomerOrganizationIds`.

***

<br />

**Volume prices**

* Customer offer volume discount pricing enables volume discounts for order quantities starting from a single package, layer or loadcarrier;
* Volume discount prices can only be added to supply lines of the type *customerOffer;*
* Three volume price options can be entered by suppliers:
  * PACKAGE price = The PACKAGE price will always be the same as the default PricePerPiece in the SupplyLine;
  * LAYER price = PricePerPiece for a sales order with an order quantity of at least one layer;
  * LOAD\_CARRIER price = PricePerPiece for a sales order with an order quantity of at least one load carrier;
  * PACKAGE price is always filled by default, LAYER and LOAD\_CARRIER prices are optional;
* Because layer price and load carrier price are both optional, it is possible that:
  * Only a PACKAGE and LAYER price is specified;
  * Only a PACKAGE and LOAD\_CARRIER price is specified;
  * All three options are specified;
* Within the volume options only one unit quantity is supported (1 load carrier, 1 layer), not multiple unit quantities(e.g. 4 load carriers, 2 layers);
* When placing a sales order, the used ordered quantity and price are validated with the volume discount pricing in the customer offer: a lower price can not be used with an order quantity for the volume discount price;
* This is done per salesOrder, not for the total quantity per delivery moment;
* There is currently no validation on commercially logic price tiers e.g. a load carrier price can be higher than a package price;
* Floriday validates on a per salesOrder basis whether entries have been submitted for the correct (minimal) price:
  * Only from an order quantity of at least a layer, an order with a layer price will be accepted instead of a higher package price;
  * Only from an order quantity of at least a load carrier, an order with a load carrier price will be accepted instead of the more expensive packaging or layer prices;
* Lower volume prices for LAYER or LOAD\_CARRIER will be accepted if it meets the right quantities, but the higher PACKAGE price will still be accepted as well;
  * It could therefore happen that a buyer sends in a higher PACKAGE price while ordering a complete load carrier and therefore paying more than actually necessary;
* Volume price unit quantities can differ from the required order unit quantity (salesUnit) but both can be used by the grower in the customer offer. Validation on order unit quantity (salesUnit) precedes validation on volume price unit quantity.
  * It could happen that a supply line has a volume price for PACKAGE and LAYER but the salesUnit is LOAD\_CARRIER, in that case only a sales order with one or more full load carriers will be accepted for the LAYER price;
* Transport/delivery costs and volume pricing can both be applicable;

<br />

> 👍 Purchase tip
>
> Suppliers can create a short term customer offer which the Floriday channel will translate to  a 'purchase tip' for customers with a customer notification.\
> Business Rules (which can dynamically change):
>
> * Maximum tradeperiod: 3 hours
> * Maximum customers: 1
> * Customer channels: Floriday
>
> A regular customer offer will be send to the customers in the channels FloraXchange and Floriday if the customer offer does not meet the purchase offer business rules.

<br />

> 👍 Checking direct sales supply in Floriday 'Supply Overview'
>
> Users and developers can check created, updated and deleted direct sales supply in the Floriday application.

<br />

![](https://files.readme.io/c92559d-Screenshot_2021-02-20_at_03.14.08.png "Screenshot 2021-02-20 at 03.14.08.png")

<br />

> 👍 Checking direct sales supply in Floriday 'My Shop'
>
> Users and developers can check direct sales supply in the Floriday application in 'My Shop' as it will be shown to the customers.

<br />

## Implementation model

![](https://files.readme.io/e7166bf-Screenshot_2022-02-14_at_22.51.00.png "Screenshot 2022-02-14 at 22.51.00.png")

<br />

## Interaction model

![](https://files.readme.io/ff961c0-Screenshot_2022-10-11_at_11.27.21.png "Screenshot 2022-10-11 at 11.27.21.png")
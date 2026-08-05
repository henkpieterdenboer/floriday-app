---
updatedAt: 2026-06-15T07:07:14.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer Offer (legacy)

## Supported scenarios

* Sync Customer Offers;
* Create Customer Offers;
* Update Customer Offers;
* Delete Customer Offers.

For the business rules concerning customer offer, please read [Direct sales Customer Offer](https://developer.floriday.io/docs/direct-sales-customer-offer-1).

***

<br />

## Sync Customer Offers

<br />

#### Purpose:

Synchronize Customer offers from Floriday to the supplier application.

***

<br />

#### Prerequisites:

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has created Customer Offers in Floriday.

***

<br />

#### Process steps:

| NR | Process step                                                                                                         | API call / scenario                                                                                                                                     |
| :- | :------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns the maximum sequence number found in Customer Offers..                                                       | *[GetCustomerOffersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/GetCustomerOffersMaxSequence)*  |
| 2  | Retrieve changed Customer Offers since last sequence number. Repeat step until all Customer Offers are synchronised. | *[GetSupplyLinesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLinesBySequenceNumber)* |

***

<br />

## Create Customer Offers

<br />

#### Purpose:

Create customer offer in Floriday.

***

<br />

#### Prerequisites:

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;

<br />

#### Process steps:

| NR | Process step                                                                                                       | API call / scenario                                                                                                            |
| :- | :----------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create customer offer with specific price, period, commercial available supply quantity and packing configuration. | *[AddCustomerOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/AddCustomerOffer)* |
| 2  | Customer offer supply line will be created in Floriday.                                                            |                                                                                                                                |
| 3  | Created customer offer supply line can be retrieved by the Customer organizations from the Customer channel.       |                                                                                                                                |

***

<br />

## Update Customer Offers

<br />

#### Purpose:

Update existing customer offers in Floriday.

***

<br />

#### Prerequisites:

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of customer offers;

<br />

#### Process steps:

| NR | Process step                                                                                                 | API call / scenario                                                                                                              |
| :- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Update an existing Customer Offer based on supplyLineId.                                                     | *[EditCustomerOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/EditCustomerOffer)* |
|    | Customer offer supply line will be updated in Floriday.                                                      |                                                                                                                                  |
| 2  | Customer offer supply line will be updated in the customer channels.                                         |                                                                                                                                  |
| 3  | Updated customer offer supply line can be retrieved by the Customer organizations from the Customer channel. |                                                                                                                                  |

***

<br />

## Delete Customer Offers

<br />

#### Purpose:

(soft) Delete Customer offers in Floriday.

***

#### Prerequisites:

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of customer offers;

<br />

#### Process steps:

| NR | Process step                                                                                                       | API call / scenario                                                                                                                    |
| :- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Delete an existing customer offer based on supplyLineId.                                                           | *[DeleteCustomerOffers](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/DeleteCustomerOffers)* |
| 2  | Customer offer supply line will be soft deleted in Floriday.                                                       |                                                                                                                                        |
| 3  | Customer offer soft deleted supply lines can be retrieved by the Customer organizations from the Customer channel. |                                                                                                                                        |
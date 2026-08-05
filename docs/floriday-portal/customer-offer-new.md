---
updatedAt: 2026-06-15T07:06:18.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer Offer

Previously, Customer offers were limited to one offer line per Customer offer, which led to a disproportionate amount of supply lines.

In the 2025v2 release, the Customer offers have been improved by seperating the offer lines from the Customer offers:

* A supplier organization may now create a single Customer offer with multiple Customer offer lines.
* A supplier organization may now edit a customer offer without editing the Customer offer lines.
* A supplier organization may now add new Customer offer lines to an existing Customer offer.
* A supplier organization may now edit and delete single customer offer lines from an existing Customer offer.
* A supplier organization may now edit the number of pieces and the prices of a single customer offer line.

<br />

This page describes how to implement the new endpoints for the improved version of Customer offers.

For the business rules concerning Customer offers, please read [Direct sales Customer Offer](https://developer.floriday.io/docs/direct-sales-customer-offer-1).

> 👍 Previous Customer offer endpoints
>
> The previous endpoints used for adding, updating, deleting and syncing Customer offers are still active and usable.
>
> We recommend implementing the improved version and phasing out the previous Customer offers as soon as possible.

***

<br />

## Supported scenarios

* Syncing Customer Offers;
* Create a Customer Offer with one or more Customer Offer lines;
* Update a Customer Offer without editing Customer Offer lines;
* Delete a Customer Offer.
* Add a Customer offer line to an existing Customer offer.
* Update a Customer Offer line.
* Delete a Customer Offer line.
* Edit the number of pieces and prices of a Customer Offer line.

<br />

> 👍 Purchase Tip
>
> A Purchase tip is a special version of the Customer Offer which is available under certain circumstances. It's characterized by being a short term Customer Offer, available for at most 3 hours and is specifically for (one user of) one customer organization.
>
> A Purchase tip is generally created after a supplier and customer have agreed upon an order outside of Floriday (i.e. by telephone). Once the Purchase Tip is created, the customer organization receives a notification by email and a prominent alert in the Floriday application.
>
> A Customer Offer is automatically created as a Purchase Tip, when the following criteria are met:
>
> * The Customer Offer has a maximum `orderPeriod` of 3 hours.
> * The Customer Offer has a maximum of 1 `allowedCustomerOrganizationIds`.

***

<br />

## Prerequisites:

* The supplier application has the latest update of [Organizations](https://developer.floriday.io/docs/organizations);
* The supplier application has the latest update of [Trade items](https://developer.floriday.io/docs/trade-items);
* The supplier application has the latest update of [Batches](https://developer.floriday.io/docs/batches);
* The supplier application has the latest update of [Warehouses](https://developer.floriday.io/docs/warehouses1);

***

<br />

## Implementation - Customer Offers

This section describes how to sync, create, edit and delete Customer Offers.

<br />

<Tabs>
  <Tab title="Sync Customer Offers  ">
    <br />

    #### Guidance

    These steps allow you to synchronize the Customer offers created for a supplier organization to the supplier application.

    Start by retrieving the maximum sequence number found in Customer Offers using the [GetCustomerOffersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/GetCustomerOffersMaxSequence) endpoint.

    Next, retrieve changed Customer Offers since last sequence number using the [GetSupplyLinesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLinesBySequenceNumber) endpoint. Repeat this step until all Customer Offers are synchronised.

    ***
  </Tab>

  <Tab title="Create Customer Offer">
    <br />

    #### Guidance

    These steps allow you to create a Customer Offer including one or more Customer Offer lines.

    Customer Offers are created using the [AddCustomerOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/AddCustomerOffer) endpoint and contains the following properties. Properties that may require further explanation are listed below.

    > 📘
    >
    > Customer Offer Lines added to Customer Offers may have different Order and Delivery periods.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    > 📘
    >
    > The AddCustomerOffer endpoint allows you to assign different despatchWarehouseIds to each Customer Offer line.
    >
    > Take note that the EditCustomerOffer endpoint currently only allows you to update the despatchWarehouseId for the entire Customer Offer, overwriting the despatchWarehouseIds on all Customer Offer lines at once.

    <br />

    ```json
    {
    "customerOfferId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "allowedCustomerOrganizationIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    ],
    "title": "string",
    "description": "string",
    "imageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "agreementReference": {
    "code": "string",
    "description": "string"
    },
    "customerOfferLines": [
    {
      "customerOfferLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "despatchWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "numberOfPieces": 2147483647,
      "pricePerPiece": {
        "currency": "EUR",
        "value": 10000000000000000
      },
      "volumePrices": [
        {
          "unit": "LAYER",
          "pricePerPiece": 9999999
        }
      ],
      "salesUnit": "PACKAGE",
      "orderPeriod": {
        "startDateTime": "2026-02-27T11:21:11.707Z",
        "endDateTime": "2026-02-27T11:21:11.707Z"
      },
      "deliveryPeriod": {
        "startDateTime": "2026-02-27T11:21:11.707Z",
        "endDateTime": "2026-02-27T11:21:11.707Z"
      },
      "usesCatalogAvailability": true,
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "packingConfiguration": {
        "piecesPerPackage": 9999,
        "vbnPackageCode": 999,
        "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "packagesPerLayer": 9999,
        "layersPerLoadCarrier": 9999,
        "loadCarrier": "NONE",
        "photoUrl": "string"
      },
      "includedServices": [
        "DELIVERY"
      ],
      "includedAdditionalServiceIds": [
        "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      ]
    }
    ]
    }
    ```

    * `allowedCustomerOrganizationIds`: Enter the customerOrganizationIds that the Customer Offer is created for.
    * `title`: The title may be used to distinguish and/or promote the Customer offer to customer organizations.
    * `description`:  Optionally, a description may be used to further describe the contents of the Customer Offer.
    * `imageId`: Optionally, an image may be used to distinguish and/or promote the Customer offer to customer organizations.
    * `agreementReference`: A customer organization may identify specific Customer offer supply made for them based on a previously agreed upon agreementReference. This reference is created by adding a `code` in the form of a `string` with a minLength of 1 and a maxLength of 13; a `description` may optionally be added.
    * `volumePrices`: This property may be used to set a quantity discount by adding a price per volume. By default, the price per piece must be filled. The property `volumePrices` is optional and allows supplier organizations to add a seperate price per Layer or per Load Carrier to their Customer Offer lines. Once a customer organization orders the amount required for a Layer/Load Carrier, the price per piece for the Customer Offer line changes accordingly.
      * Take note that a volumePrice only affects the corresponding Customer Offer line. For instance, a Customer Offer consists of two Customer Offer lines and both have a lower volumePrice when a layer is ordered. When a customer organization orders a layer of the first Customer Offer line, the price per piece of the second Customer Offer line is not adjusted. A layer of the second Customer Offer line must be ordered for the volumePrice of that line to take effect.
    * `salesUnit`: This limits the customer organization to only being able to place order in set amounts defined by the salesUnit, such as by Layer, by Load carrier, by entire Supply line.
    * `usesCatalogAvailability`: Sets the method of availability for the Customer offer.
      * `true`: The availability of Customer Offer lines is based on the availability of the trade items used in [Catalog supply](https://developer.floriday.io/docs/catalog-supply#/). This feature was created to allow supplier organizations to easily manage the availability of their Direct supply by only having to toggle the availability of their Catalog Supply lines.
      * `false`: The availability of Customer Offer lines in the Customer Offer is linked directly to the amount specified in the Customer Offer line. This amount counts down, meaning a Customer Offer line with 0 of a salesUnit is considered sold out.
    * `includedServices`:
      * Set `DELIVERY` if Transport and Delivery costs should not be settled for sales orders placed on the Customer Offer.
      * Set `STICKERING` if sticker costs should not be settled for sales orders placed on the Customer Offer.
      * If all costs should be settled, do not set the value to `NONE`. Instead, leave out the property entirely.
    * `includedAdditionalServiceIds`: Allows you to add Additional services to customer Offer lines.

    ***
  </Tab>

  <Tab title="Edit Customer Offer">
    <br />

    #### Guidance

    These steps allow you to edit a Customer Offer, without editing its Customer Offer lines.

    Customer Offers can be edited using the [EditCustomerOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/EditCustomerOffer) endpoint and requires a `customerOfferId`. The endpoint contains the following properties. Properties that may require further explanation are listed below.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    > 📘
    >
    > The AddCustomerOffer endpoint allows you to assign different despatchWarehouseIds to each Customer Offer line.
    >
    > Take note that the EditCustomerOffer endpoint currently only allows you to update the despatchWarehouseId for the entire Customer Offer, overwriting the despatchWarehouseIds on all Customer Offer lines at once.

    <br />

    ```json
    {
      "title": "string",
      "description": "string",
      "agreementReference": {
        "code": "string",
        "description": "string"
      },
      "imageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "despatchWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "allowedCustomerOrganizationIds": [
        "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      ],
      "includedServices": [
        "DELIVERY"
      ]
    }
    ```

    * `agreementReference`: A customer organization may identify specific Customer offer supply made for them based on a previously agreed upon agreementReference. This reference is created by adding a `code` in the form of a `string` with a minLength of 1 and a maxLength of 13; a `description` may optionally be added.
    * `includedServices`:
      * Set `DELIVERY` if Transport and Delivery costs should not be settled for sales orders placed on the Customer Offer.
      * Set `STICKERING` if sticker costs should not be settled for sales orders placed on the Customer Offer.
      * If all costs should be settled, do not set the value to `NONE`. Instead, leave out the property entirely.

    ***
  </Tab>

  <Tab title="Delete Customer Offer">
    <br />

    #### Guidance

    These steps allow you to delete a Customer Offer, which also deletes any Customer Offer lines it contains. To delete Customer Offer lines, see **Delete Customer Offer Lines** below.

    Customer Offers can be deleted using the [DeleteCustomerOffer](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/DeleteCustomerOffer) endpoint and requires a `customerOfferId`.

    ***
  </Tab>
</Tabs>

***

<br />

<br />

## Implementation - Customer Offer Lines

This section describes how to create, edit and delete Customer Offers Lines.

<br />

<Tabs>
  <Tab title="Create Customer Offer Lines">
    <br />

    #### Guidance

    These steps allow you to add new Customer Offer Lines to an existing Customer Offer.

    Customer Offer Lines can be added using the [AddCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/AddCustomerOfferLine) endpoint and requires a `customerOfferId`. The endpoint contains the following properties. Properties that may require further explanation are listed below.

    > 📘
    >
    > Customer Offer Lines added to Customer Offers may have different Order and Delivery periods.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    <br />

    ```json
    {
      "customerOfferLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "despatchWarehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "numberOfPieces": 2147483647,
      "pricePerPiece": {
        "currency": "EUR",
        "value": 10000000000000000
      },
      "volumePrices": [
        {
          "unit": "LAYER",
          "pricePerPiece": 9999999
        }
      ],
      "salesUnit": "PACKAGE",
      "orderPeriod": {
        "startDateTime": "2025-06-25T07:04:10.655Z",
        "endDateTime": "2025-06-25T07:04:10.655Z"
      },
      "deliveryPeriod": {
        "startDateTime": "2025-06-25T07:04:10.655Z",
        "endDateTime": "2025-06-25T07:04:10.655Z"
      },
      "usesCatalogAvailability": true,
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "packingConfiguration": {
        "piecesPerPackage": 9999,
        "vbnPackageCode": 999,
        "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "packagesPerLayer": 9999,
        "layersPerLoadCarrier": 9999,
        "loadCarrier": "NONE",
        "photoUrl": "string"
      },
      "includedServices": [
        "DELIVERY"
      ]
    }
    ```

    * `volumePrices`: This property may be used to set a quantity discount by adding a price per volume. By default, the price per piece must be filled. The property `volumePrices` is optional and allows supplier organizations to add a seperate price per Layer or per Load Carrier to their Customer Offer lines. Once a customer organization orders the amount required for a Layer/Load Carrier, the price per piece for the Customer Offer line changes accordingly.
      * Take note that a volumePrice only affects the corresponding Customer Offer line. For instance, a Customer Offer consists of two Customer Offer lines and both have a lower volumePrice when a layer is ordered. When a customer organization orders a layer of the first Customer Offer line, the price per piece of the second Customer Offer line is not adjusted. A layer of the second Customer Offer line must be ordered for the volumePrice of that line to take effect.
    * `salesUnit`: This limits the customer organization to only being able to place order in set amounts defined by the salesUnit, such as by Layer, by Load carrier, by entire Supply line.
    * `usesCatalogAvailability`: Sets the method of availability for the Customer offer.
      * `true`: The availability of Customer Offer lines is based on the availability of the trade items used in [Catalog supply](https://developer.floriday.io/docs/catalog-supply#/). This feature was created to allow supplier organizations to easily manage the availability of their Direct supply by only having to toggle the availability of their Catalog Supply lines.
      * `false`: The availability of Customer Offer lines in the Customer Offer is linked directly to the amount specified in the Customer Offer line. This amount counts down, meaning a Customer Offer line with 0 of a salesUnit is considered sold out.
    * `includedServices`:
      * Set `DELIVERY` if Transport and Delivery costs should not be settled for sales orders placed on the Customer Offer.
      * Set `STICKERING` if sticker costs should not be settled for sales orders placed on the Customer Offer.
      * If all costs should be settled, do not set the value to `NONE`. Instead, leave out the property entirely.

    ***
  </Tab>

  <Tab title="Edit Customer Offer Lines">
    <br />

    #### Guidance

    These steps allow you to edit Customer Offer Lines of an existing Customer Offer.

    Customer Offer Lines can be edited using the [EditCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/EditCustomerOfferLine) endpoint and requires a `customerOfferId` and a `customerOfferLineId`.

    The EditCustomerOfferLine endpoint contains the following properties.

    ```json
    {
      "numberOfPieces": 2147483647,
      "pricePerPiece": 9999999,
      "volumePrices": [
        {
          "unit": "LAYER",
          "pricePerPiece": 9999999
        }
      ],
      "salesUnit": "PACKAGE",
      "orderPeriod": {
        "startDateTime": "2025-06-25T07:46:28.489Z",
        "endDateTime": "2025-06-25T07:46:28.489Z"
      },
      "deliveryPeriod": {
        "startDateTime": "2025-06-25T07:46:28.489Z",
        "endDateTime": "2025-06-25T07:46:28.489Z"
      }
    }
    ```

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    ***
  </Tab>

  <Tab title="Delete Customer Offer Lines">
    <br />

    #### Guidance

    These steps allow you to delete Customer Offer Lines of an existing Customer Offer.

    Customer Offer Lines can be deleted using the [DeleteCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/DeleteCustomerOfferLine) endpoint and requires a `customerOfferId` and a `customerOfferLineId`.

    ***

    <br />
  </Tab>
</Tabs>

***

<br />

<br />

<br />

## Implementation - Update Customer Offer Lines

This section describes how to seperately update the Number of pieces and prices of Customer Offer Lines.

<br />

<Tabs>
  <Tab title="Number of pieces">
    <br />

    #### Guidance

    These steps allow you to update the number of pieces of a Customer Offer Line.

    The number of pieces of a Customer Offer Line can be updated using the [SetNumberOfPiecesOfCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/SetNumberOfPiecesOfCustomerOfferLine) endpoint and requires a `customerOfferId` and a `customerOfferLineId`. The updated number of pieces must be added to the body of the request.

    ***

    <br />
  </Tab>

  <Tab title="Prices">
    <br />

    #### Guidance

    These steps allow you to update the price per piece and the volume price of a Customer Offer Line.

    The prices of a Customer Offer Line can be updated using the [SetPricesOfCustomerOfferLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerOffers/SetPricesOfCustomerOfferLine) endpoint and requires a `customerOfferId` and a `customerOfferLineId`.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    The SetPricesOfCustomerOfferLine endpoint contains the following properties.

    ```json
    {
      "pricePerPiece": 9999999,
      "volumePrices": [
        {
          "unit": "LAYER",
          "pricePerPiece": 9999999
        }
      ]
    }
    ```

    ***

    <br />
  </Tab>
</Tabs>
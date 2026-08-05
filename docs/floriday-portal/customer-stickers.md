---
updatedAt: 2026-06-17T11:29:08.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Stickers via Floriday

## Target audience

* Customer organizations;
* Supplier organizations;
* Supplier warehouse organizations.

***

<br />

## Brief

* Stickers (also known as Labels) are part of Additional services. Additional services are services that may be added to products by customer organizations, such as labeling, sleeves or specific treatments.
  * For more information, please read the [Business Rules for Additional services](https://developer.floriday.io/docs/additional-services-1#guidance).
* Supplier organizations configure which Additional services they support in the Floriday application.
  * A guide for supplier organizations can be found in the [Helpcenter page on Additional services](https://helpcenter.floriday.com/nl/articles/5540583-aanvullende-diensten-stickers).
* Additional services can only be configured in the Floriday application. The Floriday API may be used to retrieve existing Additional service data.
* Customer organizations are expected to [retrieve a supplier organization’s additional services](https://developer.floriday.io/docs/additional-services-2) to establish which sticker types and dimensions are supported by supplier organizations.
* In order to add stickers, customer organizations need to add a matching Additional service with type `LABEL` to  Sales orders that have the `ACCEPTED` or `COMMITTED` status.
* An Additional service with type `LABEL` can be added by using the [AddSalesOrderAdditionalStickerService](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerService) or [AddSalesOrderAdditionalStickerServiceMultiType](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerServiceMultiType) endpoints. This can be done **until the latest order date time** of the Sales order.
* Using either endpoint creates an empty sticker object in which sticker data may be added by filling `stickerFileInformation`. You may add the sticker data directly or at a later time by leaving `stickerFileInformation` empty, which results in an empty sticker object.
  * To fill `stickerFileInformation` at a later time, use the [AddCustomerStickerInformation](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/AddCustomerStickerInformation) endpoint.
* Using either endpoints update the Sales order with an additionalServiceId(s) and (if applicable) an increase in price with a surcharge from the Additional service(s).
* A supplier organization may retrieve customer stickers using the Floriday application or via the [CustomerStickers](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers) endpoint.
* Supplier organizations may set the status IsHandled to indicate whether a customer sticker has been printed (and placed).

<br />

Read the implementation guides for more information:

Supplier:

* [Customer stickers](https://developer.floriday.io/docs/customer-stickers-1)
* [Additional services](https://developer.floriday.io/docs/additional-services)

Customer:

* [Customer stickers](https://developer.floriday.io/docs/stickers)
* [Additional services](https://developer.floriday.io/docs/additional-services-2)

***

<br />

## Guidance

<br />

### Creating Additional Services with type LABEL (Supplier)

A supplier organization creates Additional services with type LABEL in the Floriday application.

An Additional service with type `LABEL`:

* contains stickerType (`PRODUCT`, `POT`, `SLEEVE`, `PACKAGE`, `LAYER`, `LOAD_CARRIER`, `DOCUMENT`);
* contains one or more sticker dimensions (width x height in mm);
* is either general or customer specific;
* is linked to at least one Warehouse;
* may be set as default. Take note that only non-customer specific labels can be set as default.

***

<br />

### Adding an Additional Service of type Sticker to Sales orders (Customer)

* Additional services of type `LABEL` can only be added once a Sales order has the status `ACCEPTED` or `COMMITTED`.
  * Additional services of type `TREATMENTS`, `SLEEVES` or `OTHER` may be added directly during creation of Sales orders.
* Customer organizations have until the `latestOrderDateTime` of that Sales order to add the Additional service.
* To add an Additional service of type `LABEL` to an `ACCEPTED` or `COMMITTED` Sales order, one of the following endpoints must be used:
  * [AddSalesOrderAdditionalStickerService](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerService) (one stickerType)
  * [AddSalesOrderAdditionalStickerServiceMultiType](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerServiceMultiType) (more than one stickerType).
* Succesfully using either endpoint will result in an empty sticker object. The sticker data meant for this object may be added directly by filling `stickerFileInformation` in either endpoint.
* If the sticker data is not immediately known, `stickerFileInformation` may be left empty to be filled at a later time. Once the sticker data is known, the endpoint [AddCustomerStickerInformation](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/AddCustomerStickerInformation) should be used to fill the `stickerFileInformation`.

***

<br />

The [AddSalesOrderAdditionalStickerService](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerService) endpoint is shown below with a description of it's required and optional properties.

* The data below is for ease of use. We recommend consulting the Swagger website for the most up to date data.

```json
{
  "stickerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "size": {
    "widthInMm": 0,
    "heightInMm": 0
  },
  "additionalInformation": "string",
  "stickerFileInformation": {
    "base64EncodedPdf": "string",
    "uploadLayout": "UNKNOWN",
    "stickerProvidedBy": "UNKNOWN",
    "numberOfCopies": 2147483647,
    "shouldBePrinted": true,
    "deliverSeparately": true,
    "parentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "composition": {
    "stickerType": "UNKNOWN",
    "additionalServiceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "price": {
      "currency": "EUR",
      "value": 0
    },
    "numberOfUnits": 2147483647
  }
}
```

<br />

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        Property
      </th>

      <th>
        Optional or Required
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        `stickerId`
      </td>

      <td>
        Required
      </td>

      <td>
        A reference to the sticker that is or will be added to the additional service.
      </td>
    </tr>

    <tr>
      <td>
        `size`
      </td>

      <td>
        Optional
      </td>

      <td>
        The dimensions of the additional service represented as width and height in mm. The size must match with the additional service sizes set by the supplier.
      </td>
    </tr>

    <tr>
      <td>
        `additionalInformation`
      </td>

      <td>
        Optional
      </td>

      <td>
        An open text field where the customer organization may add comments to the additional service.
      </td>
    </tr>

    <tr>
      <td>
        `stickerFileInformation`
      </td>

      <td>
        Optional
      </td>

      <td>
        Contains the sticker data. Must be either filled directly or at a later time. See

        [Adding the sticker data to the Additional service (Customer)](https://developer.floriday.io/docs/stickers-via-floriday-new#adding-the-sticker-data-to-the-additional-service-customer)

        for more details.
      </td>
    </tr>

    <tr>
      <td>
        `composition`
      </td>

      <td>
        Required
      </td>

      <td>
        Must contain the `stickerType` and `numberOfUnits` (amount of stickers that need to be settled).

        `additionalServiceId` and `price` are optional.
      </td>
    </tr>
  </tbody>
</Table>

<br />

Floriday will try to match the additional sticker service based on the following properties:

* `size`(optional);
* `stickerType` (**required**);
* `AdditionalServiceId` (optional);
* `price` (optional).

Adding the optional properties `size`, `additionalserviceId` and `price` will result in narrower matching parameters but more strict validation as well. When multiple results can be matched, the Default sticker type will be chosen.

The following scenarios will result in an error message:

* There are multiple matching options but none of them is the Default sticker type;
* There are no exact matches found (for example due to added optional properties).

<br />

> 📘 Validation
>
> When adding an Additional service, we validate on the following.
>
> If the `additionalServiceId` is filled:
>
> * The Additional service needs to exist;
> * The Additional service needs to match the `supplierOrganization` in the `salesOrder`;
> * The Additional service needs to match the `stickerType`;
> * If `price` is filled, it needs to match with the price of the Additional service;
> * If `size` is filled, it needs to exist within the Additional service (an Additional service may contain more than one size).
>
> If the `additionalServiceId` is not filled, we match in the following sequence:
>
> * `stickerType`;
> * `price`;
>   * If at this point one match is found, we return this match;
>   * If multiple matches are found, we try to get a single match based on a **customer specific** Additional service;
>   * If we still find multiple matches (in case of more than one or no customer specific Additional service), we will match on the **default** Additional service.
>   * If no default Additional service is found, an error is given.
> * Once a single match is found, we will validate based on `size` (if filled). Take note that `size` is currently optional, but will become mandatory in the future.

> 👍 Retrieving Additional services
>
> For customer organizations, it is highly recommended to [retrieve a grower organization’s Additional services](https://developer.floriday.io/docs/additional-services-2) to establish which sticker types, dimensions and prices the grower organization supports.
>
> This approach may prevent validation issues when adding additional services and stickers to sales orders.

> 📘 When to use MultiType
>
> MultiType stickers must be used when more than one sticker type is present in a PDF-file.
>
> For example, a salesOrder contains 15 plants. 10 plants need a sticker of type `POT`, while the other 5 plants need a sticker of type `PRODUCT`.
>
> In this scenario, using the **AddSalesOrderAdditionalStickerServiceMultiType** endpoint, the properties`uploadLayout`in `stickerFileInformation`must be `MULTIPLE`.
>
> Additionally, two instances of `composition` must be added; one with the composition of the `POT` sticker and the other with the composition of the `PRODUCT` sticker.

<br />

### Interaction model

![](https://files.readme.io/00e1d86-image.png)

***

<br />

### The Sales order is updated (Supplier & Customer)

Once an Additional service is successfully added to a Sales order, the Sales order will be updated with the Additional service and a price (if applicable).

<Image align="center" alt="The characteristic additionalServices is updated in the Sales order" caption="The property additionalServices is updated in the Sales order" src="https://files.readme.io/03a47ab596924c84706e2e2f6997007e08f5471ab006e698fdc52aa901ef74fe-image.png" />

<br />

The additionalServices in the Sales order is updated with:

* The `additionalServiceId`;
* `price` per unit (if applicable);
* `unit` (this is automatically updated to type LABEL when using the AddSalesOrderAdditionalStickerService endpoint;
* `numberOfUnits` (the amount of stickers, only used with Additional services with type LABEL.
* The stickerId is updated once the sticker data has been added.

<br />

> 📘 Price calculation when an Additional service of type LABEL is added
>
> If a price is present, the `totalPricePerPiece` of the Sales order is updated. This will be calculated as follows:
>
> `price per unit` x `numberOfUnits `/ `numberOfPieces` of salesOrder.
>
> **Example:**
>
> price per unit: 0,05 numberOfUnits: 10 numberOfPieces in salesOrder: 25
>
> 0,05 x 10 / 25 = 0,02 added to the `totalPricePerPiece`.

***

<br />

### Adding the sticker data to the Additional service (Customer)

Stickers are added by filling the `stickerFileInformation` in the Additional service. As stated before, this may be done directly when [adding the Additional service](https://developer.floriday.io/docs/stickers-via-floriday-new#adding-an-additional-service-of-type-sticker-to-sales-orders-customer) or at a later time with the [AddCustomerStickerInformation](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/AddCustomerStickerInformation) endpoint.

The `stickerFileInformation` contains the following properties:

<Image align="center" src="https://files.readme.io/9e7686cc5397b0841ead0cfd740423f728648ca6a91672ca7ea81527c4a17c72-image.png" />

<br />

* `base64EncodedPdf`: Convert the PDF to Base64 and enter the result string here.
* `uploadLayout`: This should be `SINGLE` or `MULTIPLE`, depending on if you’re uploading a single sticker type or using multiType.
* `stickerProvidedBy`:
  * `SUPPLIER`; the supplier organization is expected to print and apply the stickers.
  * `CUSTOMER`; the customer organization applies the stickers themselves.
  * `THIRD_PARTY`; a third party (for instance supermarkets) supplies the stickers.
* `numberOfCopies`: The amount of copies of a PDF that should be printed.
  * When using multiType, we recommend to set `numberOfCopies` to 1 and add a page in the PDF for each sticker.
* `deliverSeperately`: Set this setting to true if stickers need to be printed, but not applied to products. Usually this means that the customer organization will apply the stickers themselves.
* `parentId`: Use this as a reference to stickers that have a relation to each other.

***

<br />

### Retrieving customer stickers (Supplier)

A supplier organization may retrieve customer stickers using the Floriday application or via the [CustomerStickers](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers) endpoint.

The supplier organization can retrieve a single sticker based on stickerId or multiple stickers based on multiple stickerIds.

* Use the [GetCustomerStickerPdfById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerPdfById) endpoint to retrieve a single sticker. A boolean may be used to indicate if pages should be duplicated based on the number of copies. It will return the PDF that the customer organization has uploaded.
* Use the [GetCustomerStickerPdfByIds](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerPdfByIds) endpoint to retrieve multiple stickers. Floriday will automatically copy the number of pages and sort the stickers based on Sales orders, grouping them in 1 PDF file.

***

<br />

### Retrieving customer stickers (Customer)

To keep track of their Customer stickers, customer organizations should use the [Customer sticker sync endpoints](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickersBySequenceNumber). This allows customer organizations to see when was the last time stickers were requested and if the stickers have been handled (with the respective properties `lastRequestedOn` and `isHandled`.

<br />

> 📘 Important note when syncing sticker data
>
> A supplier may retrieve a sticker PDF with the `GetCustomerStickerPdfById` & `GetCustomerStickerPdfByIds` endpoints. When this happens, the `lastRequestedOn` property is updated on the customer side. This allows the customer to see when stickers have been requested by the supplier.
>
> Even though the property is only updated on the customer side, a sequence bump on the supplier side is also triggered. Although this usually indicates an update, if you keep requesting the sticker data when this sequence bump is triggered, you will end up in an infinite loop.
>
> This is why we recommend to only request the sticker data once when:
>
> * The supplier actually needs the sticker data or;
> * The sticker object is new / contains stickerFileInformation for the first time.

> 📘 Visual reference for corresponding stickers
>
> Incorporating a visual identifier, such as a pot image for pot stickers, is a recommended best practice. This visual cue significantly lowers the likelihood of possible handling errors.

***

<br />

### Setting the status IsHandled (Supplier)

When processing customer stickers, supplier organizations can indicate which stickers have already been handled by setting the IsHandled status.

The isHandled status signals to customer organizations that the sticker has been printed (and placed) and should therefore not be modified.

When implementing the [SetCustomerStickersIsHandled](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/SetCustomerStickersIsHandled) endpoint, you may choose to let the supplier organization set the isHandled status manually or to automatically set the isHandled status whenever stickers are printed.

In either case, we recommend to add a feature to remove the isHandled status as well. If a grower is somehow unable to place the stickers, the customer organization will want to know.

<br />

> 👍 Why isHandled?
>
> Stickers that are set to isHandled lead to a more efficient logistic and financial process for customer organizations. Customer organizations that know that stickers have been placed, will not have to schedule self-placement or invoicing of stickers afterwards. It also removes the necessity of having to directly contact the supplier organization about the status.

***

<br />

### Deleting stickers

* Uploaded customer stickers files can only be deleted by [deleting the customer sticker object](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/DeleteAdditionalStickerService);
* Deleting the sticker object results in deletion of the additional service linked to the sales order;
  * Any price increases on the sales order due to the costs of the matched additional service will be reversed.
* Deleting the uploaded customer stickers is possible until the the latest order date time of the Sales order;
* Re-uploading a new customer sticker requires the customer to place a new additional service to the Sales order first;
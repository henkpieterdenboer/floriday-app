---
updatedAt: 2025-12-17T08:54:29.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Batches

<br />

## Supported scenarios

* Create Batches;
* Synchronize Batch data;
* Get Batch data;
* Get Batch tray labels.
* Update Batches.

<br />

For the business rules concerning batches, please read <Anchor label="Business Rules - Batches" target="_blank" href="doc:batches-2">Business Rules - Batches</Anchor>.

***

<br />

## Prerequisites

* The supplier application has the latest update of <Anchor label="Organizations" target="_blank" href="doc:organizations">Organizations</Anchor>;
* The supplier application has the latest update of <Anchor label="Warehouses" target="_blank" href="doc:warehouses1">Warehouses</Anchor>;
* The supplier application has the latest update of <Anchor label="Trade items" target="_blank" href="doc:trade-items">Trade items</Anchor>;
* The user has previously added Batches.

***

<br />

## Implementation - Create Batches

There are two implementation options when creating Batches.

* **AddBatch**: Create a Batch based on an existing `tradeItemId`.
* **AddBatchFromTradeItemProperties**: Create a Batch based on Trade item properties. This method does not require a Trade item for its creation, instead, a temporary trade item is created for quick use.

<br />

<Tabs>
  <Tab title="AddBatch">
    * We recommend creating Batches based on Trade items if the supplier organizations you're working with uses a set amount of Trade items that do not change in composition frequently. This allows for a quick use of trade item data to create your Batches.

    This method uses the [AddBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatch) endpoint and uses the following model. Properties that may require further explanation are listed below.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    <br />

    <br />

    <b>AddBatch</b> - Model details

    ```json
    {
      "batchDate": "2025-11-21T10:32:15.191Z",
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "numberOfPieces": 2147483647,
      "packingConfiguration": {
        "piecesPerPackage": 9999,
        "layersPerLoadCarrier": 9999,
        "packagesPerLayer": 9999,
        "package": {
          "vbnPackageCode": 999,
          "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "loadCarrier": "NONE"
      },
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "imageUrl": "string",
      "batchReference": "string",
      "customReference": "1763",
      "transitStatus": "IN_TRANSIT"
    }
    ```

    * `batchDate`: This the production date of the Batch, indicating the day the Batch will be processsed. A Batch may be created one or more days before the production date. This means that the `batchDate` is not necessarily similar to the `creationDateTime` (although in practise this is mostly the case).
    * `batchReference`: This is a reference to the Batch, allowing one to keep track of the Batch in its logistical process. The batchReference is also used to generate Plant Passports in Floriday.
    * `customReference`: Also known as Service code, the customerReference is a reference used internally by supplier organizations. It has a maximum limit of 4 digits and may be used to trace a Batch back to for instance a supplier location or a section of a supplier location.
    * `transitStatus`: Indicates the current logistic location of the Batch. This is currently a property only used when retrieving Batch data and is not required when adding Batches.
  </Tab>

  <Tab title="AddBatchFromTradeItemProperties">
    * If your supplier organizations has a lot of variety in Trade items and/or the composition changes regularly, we recommend creating Batches based on Trade item properties. This method allows for creating of Batches without creating a new Trade item, potentially cluttering the Trade item Catalog. Instead, it creates a so called Clock trade items. This type of trade item is meant for limited use and is not listed in the supplier organization's Catalog.

    While a tradeItemId is not required, this endpoint does requires you to add VBN product codes, VBN package codes,  characteristics and an ImageURL.

    * See [General starting conditions](https://developer.floriday.io/v2025.1/docs/general-starting-conditions#/) for more information on retrieving VBN codelist data.
    * See [Media](https://developer.floriday.io/v2025.1/docs/media#/) for more information on generating an imageURL.

    <Callout icon="❗️" theme="error">
      **Not to be used for Direct Sales**

      Because Clock trade items are not listed in the Catalog, this feature **should not be used for Direct Sales**. They should only be used for the Daytrade and Auction workflow.
    </Callout>

    <br />

    This method uses the [AddBatchFromTradeItemProperties](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatchFromTradeItemProperties) endpoint and uses the following model. Properties that may require further explanation are listed below.

    > 📘
    >
    > For the mandatory properties, please consult the Model on the Swagger page.

    <br />

    <br />

    <b>AddBatchFromTradeItemProperties</b> - Model details

    ```json
    {
      "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "batchDate": "2025-11-21T09:23:35.039Z",
      "numberOfPieces": 2147483647,
      "batchReference": "6146213268139",
      "customReference": "4924",
      "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "imageUrl": "string",
      "vbnProductCode": 0,
      "characteristics": [
        {
          "vbnCode": "str",
          "vbnValueCode": "str"
        }
      ],
      "packingConfiguration": {
        "piecesPerPackage": 9999,
        "layersPerLoadCarrier": 9999,
        "packagesPerLayer": 9999,
        "package": {
          "vbnPackageCode": 999,
          "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "loadCarrier": "NONE"
      }
    }
    ```

    * `batchDate`: This the production date of the Batch, indicating the day the Batch will be processsed. A Batch may be created one or more days before the production date. This means that the `batchDate` is not necessarily similar to the `creationDateTime` (although in practise this is mostly the case).
    * `batchReference`: This is a reference to the Batch, allowing one to keep track of the Batch in its logistical process. The batchReference is also used to generate Plant Passports in Floriday.
    * `customReference`: Also known as Service code, the customerReference is a reference used internally by supplier organizations. It has a maximum limit of 4 digits and may be used to trace a Batch back to for instance a supplier location or a section of a supplier location.
  </Tab>
</Tabs>

<br />

***

<br />

## Implementation - Synchronizing Batch data

> 📘 Sync vs Get endpoints
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

### Synchronizing Batches

In practice, the number of pieces in Batches are subject to frequent mutations. For instance, Batches may be sold, corrected, transformed, split up, relocated or reserved. For this reason, we have **two sync endpoints** for Batches; one for general batch data and one for mutations.

Using both endpoints allows you to separate batch mutation data from the regular sync. This means you don't have to sync the **general Batch sync endpoint** as frequently, while utilizing the less intensive **Batch mutation sync endpoint** to stay updated with detailed information on changes to the number of pieces.

<Callout icon="🧠" theme="default">
  ### How to synchronize data

  For best practices regarding synchronizing data via the Floriday API, please consult the [Best practices](https://developer.floriday.io/docs/best-practices#) page.

  Note that batches are fleeting and used for daily trade. Starting the sync from 0 will also retrieve all old and non-relevant batches that are sold out or have expired.

  Instead, you could start with the `maximumSequenceNumber` endpoint or start the synchronization from several increments lower until the desired data has been retrieved.
</Callout>

<br />

<Tabs>
  <Tab title="Synchronizing general Batch data ">
    This method returns data on all available Batches for a supplier organization. It uses the [GetBatchesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetBatchesBySequenceNumber) endpoint and uses the following model. Properties that may require further explanation are listed below.

    <Callout icon="📘" theme="info">
      With this method, all available Batch data is returned, with the exception of mutations in number of pieces, the type of mutation and the salesOrderId.

      Updates on `numberOfPieces` is included in the [GetBatchMutationsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetBatchMutationsBySequenceNumber) endpoint (see next tab).
    </Callout>

    <br />

    <b>GetBatchesBySequenceNumber</b> - Model details

    ```json
    {
      "maximumSequenceNumber": 0,
      "results": [
        {
          "batchDate": "2025-11-28T10:13:25.087Z",
          "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "supplierOrganizationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "numberOfPieces": 2147483647,
          "initialNumberOfPieces": 2147483647,
          "packingConfiguration": {
            "piecesPerPackage": 9999,
            "package": {
              "vbnPackageCode": 999,
              "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
            },
            "loadCarrier": "NONE",
            "layersPerLoadCarrier": 0,
            "packagesPerLayer": 0
          },
          "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "imageUrl": "string",
          "batchReference": "string",
          "customReference": "6463",
          "sequenceNumber": 0,
          "transitStatus": "IN_TRANSIT",
          "tradeItemVersion": 0,
          "isDeleted": true,
          "creationDateTime": "2025-11-28T10:13:25.087Z",
          "lastModifiedDateTime": "2025-11-28T10:13:25.087Z"
        }
      ]
    }
    ```

    * `batchDate`: This the production date of the Batch, indicating the day the Batch will be processsed. A Batch may be created one or more days before the production date. This means that the `batchDate` is not necessarily similar to the `creationDateTime` (although in practise this is mostly the case).
    * `batchReference`: This is a reference to the Batch, allowing one to keep track of the Batch in its logistical process. The batchReference is also used to generate Plant Passports in Floriday.
    * `customReference`: Also known as Service code, the customerReference is a reference used internally by supplier organizations. It has a maximum limit of 4 digits and may be used to trace a Batch back to for instance a supplier location or a section of a supplier location.
    * `transitStatus`: Indicates the current logistic location of the Batch. This is currently a property only used when retrieving Batch data and is not required when adding Batches.

    <br />
  </Tab>

  <Tab title="Synchronizing Batch mutation data">
    This method returns Batch mutation data on the number of pieces, the type of mutation and the salesOrderId. It uses the [GetBatchMutationsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetBatchMutationsBySequenceNumber) endpoint and uses the following model. Properties that may require further explanation are listed below.

    <br />

    <b>GetBatchMutationsBySequenceNumber</b> - Model details

    ```json
    {
      "maximumSequenceNumber": 0,
      "results": [
        {
          "batchMutationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "deltaNumberOfPieces": 0,
          "reason": "string",
          "targetBatchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "creationDateTime": "2025-11-28T13:37:33.337Z",
          "type": "UNKNOWN",
          "salesOrderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "sequenceNumber": 0
        }
      ]
    }
    ```

    * `deltaNumberOfPieces`: The value of this property indicates the increase or decrease in number of pieces for the batch.
    * `reason`: When using the [EditBatch](https://api.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/EditBatch) to update the quantity of a Batch, a reason for the updated quantity can be added. This will be returned in the Batch mutation sync.
    * `customReference`: Also known as Service code, the customerReference is a reference used internally by supplier organizations. It has a maximum limit of 4 digits and may be used to trace a Batch back to for instance a supplier location or a section of a supplier location.
    * `transitStatus`: Indicates the current logistic location of the Batch. This is currently a property only used when retrieving Batch data and is not required when adding Batches.

    <br />
  </Tab>
</Tabs>

***

<br />

## Implementation - Get Batch data

Currently, there are two Get endpoints for retrieving Batches. The `GetBatches` endpoint is a legacy endpoint and will be phased out in the near future. For retrieving Batch data, please use the sync endpoints as described in the previous section.

The [GetBatchById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetBatchById) endpoint will remain operational as it can be used to retrieve individual Batch data by id. This endpoint returns general Batch data, similar to the [GetBatchesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetBatchesBySequenceNumber) endpoint. For detailed information on the Model, see below.

<details>
  <summary> <b>GetBatchById</b> - Model details</summary>

```json
    {
  "batchDate": "2025-12-12T09:17:00.784Z",
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "supplierOrganizationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "numberOfPieces": 2147483647,
  "initialNumberOfPieces": 2147483647,
  "packingConfiguration": {
    "piecesPerPackage": 9999,
    "package": {
      "vbnPackageCode": 999,
      "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "loadCarrier": "NONE",
    "layersPerLoadCarrier": 0,
    "packagesPerLayer": 0
  },
  "warehouseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "imageUrl": "string",
  "batchReference": "string",
  "customReference": "8433",
  "sequenceNumber": 0,
  "transitStatus": "IN_TRANSIT",
  "tradeItemVersion": 0,
  "isDeleted": true,
  "creationDateTime": "2025-12-12T09:17:00.784Z",
  "lastModifiedDateTime": "2025-12-12T09:17:00.784Z"
}
```

* `batchDate`: This the production date of the Batch, indicating the day the Batch will be processsed. A Batch may be created one or more days before the production date. This means that the `batchDate` is not necessarily similar to the `creationDateTime` (although in practise this is mostly the case).
* `batchReference`: This is a reference to the Batch, allowing one to keep track of the Batch in its logistical process. The batchReference is also used to generate Plant Passports in Floriday.
* `customReference`: Also known as Service code, the customerReference is a reference used internally by supplier organizations. It has a maximum limit of 4 digits and may be used to trace a Batch back to for instance a supplier location or a section of a supplier location.
* `transitStatus`: Indicates the current logistic location of the Batch. This is currently a property only used when retrieving Batch data and is not required when adding Batches.

  <br />
</details>

***

<br />

## Implementation - Get tray labels

Customer organizations may require that tray labels are printed and placed on the products that they order.

Every Batch that is made has its corresponding tray label. This label includes the `batchReference` and information on the product, supplier organization, service code and sub location.

The [GetTrayLabelsAsPdfByBatchIds](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/GetTrayLabelsAsPdfByBatchIds) endpoint may be used to retrieve tray labels based on a BatchId. It will return the label(s) in PDF format.

***

<br />

## Implementation - Update Batches

There are several endpoints that are used to update existing Batches, including updating a Batch photo, updating the quantity of a Batch and to (combine and) transform Batches.

<Tabs>
  <Tab title="EditBatchPhoto">
    The [EditBatchPhoto](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/EditBatchPhoto) endpoint may be used to add a new Batch photo or update an existing Batch photo based on a batchId. ImageIds may be generated using the [Media](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Media/AddImage) endpoint.
  </Tab>

  <Tab title="EditBatch">
    The [EditBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/EditBatch) endpoint allows you to update the quantity of the numberOfPieces of a Batch, based on a `batchId`.

    The endpoint uses the following model. Properties that may require further explanation are listed below.

    ```json
    {
    "correctionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "deltaInPieces": 2147483647,
    "newNumberOfPieces": 2147483647,
    "reason": "string"
    }
    ```

    * `correctionId`: The id used for `correctionId` is shown as the batchMutationId in the Batch mutation sync.
    * To indicate the change in quantity, you can choose to use either `deltaInPieces` or `newNumberOfPieces`. `newNumberOfPieces `has priority if both properties are used.
      * `deltaInPieces`: The value of this property indicates the increase or decrease in number of pieces for the batch.
      * `newNumberOfPieces`: The number of pieces after the update.
    * `reason`: The reason for the update of the quantity.

    <br />
  </Tab>

  <Tab title="TransformBatch">
    The [TransformBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/TransformBatch) endpoint allows you to transform a batch into a new batch with modifications.

    Using the endpoint requires you to enter the batchId you wish to transform and a newBatchId you wish to transform the old batch into.

    Optionally, you may also indicate a tradeItemId, a packingConfiguration and a numberOfPieces the batch should use after transforming.

    The endpoint uses the following model. Properties that may require further explanation are listed below.

    ```json
    {
    "newBatchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "packingConfiguration": {
    "piecesPerPackage": 9999,
    "layersPerLoadCarrier": 9999,
    "packagesPerLayer": 9999,
    "package": {
      "vbnPackageCode": 999,
      "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    "loadCarrierType": "NONE",
    "packageLength": 0,
    "packageWidth": 0,
    "photoUrl": "string",
    "transportHeightInCm": 2147483647
    },
    "numberOfPieces": 2147483647
    }
    ```

    * `packageLength, packageWidth & transportHeightInCm`: These are legacy properties that serve no function and will be removed in the 2026v1 version.

    <br />
  </Tab>

  <Tab title="CombineAndTransformBatch">
    The [CombineAndTransformBatches](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/CombineAndTransformBatches) endpoint allows you to merge and transform multiple existing batches into a single new batch with modifications.

    Using this endpoint requires you use the `batchesToCombine` and include at least two `batchIds` to combine and the `numberOfPieces` of each batch that should combine into the `newBatchId`. The `numberOfPieces` entered here will be subtracted from the `numberOfPieces` of the original batch.

    The subtracted `numberOfPieces` from the batchesToCombine object are not automatically added to the `newBatchId`. Instad, the total number of pieces of the `newBatchId` is determined by the `numberOfPieces` entered for the new batch.

    A `tradeItemId`, `numberOfPieces` and `packingConfiguration` for the new batch are required. Optionally, `customReference` and a new `imageUrl` may be added.

    The endpoint uses the following model. Properties that may require further explanation are listed below.

    ```json
    {
      "batchesToCombine": [
        {
          "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "numberOfPieces": 0
        }
      ],
      "newBatchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "numberOfPieces": 0,
      "packingConfiguration": {
        "piecesPerPackage": 9999,
        "layersPerLoadCarrier": 9999,
        "packagesPerLayer": 9999,
        "package": {
          "vbnPackageCode": 999,
          "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        },
        "loadCarrierType": "NONE",
        "packageLength": 0,
        "packageWidth": 0,
        "photoUrl": "string",
        "transportHeightInCm": 2147483647
      },
      "customReference": "0783",
      "imageUrl": "string"
    }
    ```

    * `packageLength, packageWidth & transportHeightInCm`: These are legacy properties that serve no function and will be removed in the 2026v1 version.

    <br />
  </Tab>

  <br />
</Tabs>

<br />

<br />

<br />
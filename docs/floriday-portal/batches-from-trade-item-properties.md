---
updatedAt: 2026-06-12T09:40:58.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Batches from Trade item properties

In the 2025v1 version, we added a feature that allows you to add Batches based on a set of characteristics, without actually creating a Trade item. With this feature, we aim to decrease cluttering of the Catalog while allowing supplier organizations to create Batches at a much faster rate for Daytrade and Auction supply.

<Callout icon="❗️" theme="error">
  **Not to be used for Direct Sales**

  This feature creates so called 'Clock trade items'. This type of trade item is meant for limited use and is not listed in the supplier organization's Catalog.

  Because these trade items are not listed, this feature **should not be used for Direct Sales**. They should only be used for the Daytrade and Auction workflow.
</Callout>

***

<br />

## Implementation

The [AddBatchFromTradeItemProperties](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatchFromTradeItemProperties) endpoint is similar to the [AddBatch](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Batches/AddBatch) endpoint, with some differences.

Take note:

* Instead of a tradeItemId, `AddBatchFromTradeItemProperties` works by adding **multiple characteristics** with `vbnCode` and `vbnValueCode`.
* Even though a trade item is not created, batches created this way must still use the mandatory characteristics associated with the VBN Product Code of the trade item. Characteristics data and VBN Product Code data may be [retrieved from Floricode](https://developer.floriday.io/docs/general-starting-conditions#/).
* The data below is for ease of use. We recommend consulting the Swagger website for the most up to date data.

<br />

```json
{
  "batchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "batchDate": "2025-09-01T08:24:24.221Z",
  "numberOfPieces": 2147483647,
  "batchReference": "2342793961866",
  "customReference": "3416",
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
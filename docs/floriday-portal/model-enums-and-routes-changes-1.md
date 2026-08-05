---
updatedAt: 2025-04-28T11:41:56.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Model, enums and routes changes

# Suppliers

<br />

## Legend

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Icon
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:
      </td>

      <td>
        The property or model has been removed
      </td>
    </tr>

    <tr>
      <td>
        :abc:
      </td>

      <td>
        The property or model has been renamed
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:
      </td>

      <td>
        The attribute such as maximum length or required vs optional has been changed
      </td>
    </tr>

    <tr>
      <td>
        :new:
      </td>

      <td>
        The property has been newly added to the model
      </td>
    </tr>
  </tbody>
</Table>

***

## Route changes

### CatalogPrices

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        HTTP
      </th>

      <th>
        OperationId
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         PUT
      </td>

      <td>
        EditWeeklyBaseSupplyLines
      </td>

      <td>
        Added with route 

        `/trade-items/base-supply/{year}/{week}`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         GET
      </td>

      <td>
        GetWeeklyBaseSupplies
      </td>

      <td>
        Changed the rate/burst limit to: Rate limit: 

        `1 per second`

         , Burst limit: 

        `20`
      </td>
    </tr>
  </tbody>
</Table>

***

### PriceGroups :new:

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        HTTP
      </th>

      <th>
        OperationId
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPriceGroupById
      </td>

      <td>
        Added with route 

        `/price-groups/{priceGroupId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPriceGroupsBySequenceNumber
      </td>

      <td>
        Added with route 

        `/price-groups/sync/{sequenceNumber}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPriceGroupsMaxSequence
      </td>

      <td>
        Added with route 

        `/price-groups/current-max-sequence`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrders

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        HTTP
      </th>

      <th>
        OperationId
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         PATCH
      </td>

      <td>
        SetSalesOrderCancelled
      </td>

      <td>
        Added with route 

        `/sales-orders/{salesOrderId}/cancel`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         PATCH
      </td>

      <td>
        SetSalesOrderCommitted
      </td>

      <td>
        Added with route 

        `/sales-orders/{salesOrderId}/commit`
      </td>
    </tr>
  </tbody>
</Table>

***

## Enum changes

### AdditionalServiceUnit

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        LABEL
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentType :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        UNKNOWN
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CLOCK
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        DIRECT\_SALES
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        GOODS\_MOVEMENT
      </td>
    </tr>
  </tbody>
</Table>

***

### Incoterm

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CPT
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CIP
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        DPU
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        FAS
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CFR
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CIF
      </td>
    </tr>
  </tbody>
</Table>

***

### PriceGroupType :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CALCULATED
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        MANUAL
      </td>
    </tr>
  </tbody>
</Table>

***

## Model changes

### AddBatchPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddFulfillmentOrderCorrection :new:

*Added a copy of FulfillmentOrderCorrection without the unused properties*

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed unused property
      </td>

      <td>
        `status`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed unused property
      </td>

      <td>
        `errors`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed unused property
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed unused property
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddLoadCarrierConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `sortIndex`
      </td>

      <td>
        `sequenceNumber`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Added a minimum length of 1 item
      </td>

      <td>
        `loadCarrierItems`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddLoadCarrierCorrection :new:

*Added a copy of LoadCarrierCorrection with changed properties*

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `documentReference`
      </td>

      <td>
        `logisticLabelCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddLoadCarrierItem

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `batchId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `batchReference`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `logisticLabelCode`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `sortIndex`
      </td>

      <td>
        `itemPosition`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryRemarks`
      </td>

      <td>
        `deliveryRemark`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from required to optional
      </td>

      <td>
        `deliveryRemark`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Added minimum length of 1 character
      </td>

      <td>
        `deliveryRemark`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `commercialInvoiceReference`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddLoadCarrierItemCorrection :new:

*Added a copy of LoadCarrierItemCorrection with changed properties*

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteLetter`
      </td>

      <td>
        `sequenceCharacter`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryNoteCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### BatchPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### ClockSupplyLinePackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomerSticker

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `additionalServiceId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `compositions`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomerStickerComposition :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `stickerType`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditWeeklyBaseSupplyLines :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `basePricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `manualPriceGroupPrices`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditWeeklyBaseSupplyManualPriceGroupPrice :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `priceGroupId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `manualPricePerPiece`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrder

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `submissionError`
      </td>

      <td>
        `submissionErrors`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteCodes`
      </td>

      <td>
        `logisticLabelCodes`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from type 

        **FulfillmentOrderSubmissionErrors**

         to 

        `string`
      </td>

      <td>
        `submissionErrors`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum
      </td>

      <td>
        `fulfillmentType`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `oneLabelOnly`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrderCorrection

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `errors`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrderCreate

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :pencil2:

         Added a minimum length of 13 characters
      </td>

      <td>
        `deliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `oneLabelOnly`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrderInbound

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteCodes`
      </td>

      <td>
        `logisticLabelCodes`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `carrierOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrderStatus

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `submissionError`
      </td>

      <td>
        `submissionErrors`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from type 

        **FulfillmentOrderSubmissionErrors**

         to 

        `string`
      </td>

      <td>
        `submissionErrors`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `status`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `clockMinimumPrice`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `sortIndex`
      </td>

      <td>
        `sequenceNumber`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `documentReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryNoteCodes`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isReceived`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `receiptDateTime`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierConfigurationInbound

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `sortIndex`
      </td>

      <td>
        `sequenceNumber`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `documentReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryNoteCodes`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierCorrection

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `documentReference`
      </td>

      <td>
        `logisticLabelCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierItem

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryRemarks`
      </td>

      <td>
        `deliveryRemark`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteCode`
      </td>

      <td>
        `logisticLabelCode`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteLetter`
      </td>

      <td>
        `itemPosition`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `batchId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `commercialInvoiceReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `sortIndex`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierItemCorrection

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteLetter`
      </td>

      <td>
        `sequenceCharacter`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `numberOfPackages`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryNoteCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierItemInbound

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :abc:

         Renamed property into 

        `deliveryNoteCode`
      </td>

      <td>
        `logisticLabelCode`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `sortIndex`
      </td>

      <td>
        `itemPosition`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryNoteLetter`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `sortIndex`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deliveryRemarks`
      </td>
    </tr>
  </tbody>
</Table>

***

### OrderedAdditionalService

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

***

### Organization

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `email`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `phone`
      </td>
    </tr>
  </tbody>
</Table>

***

### PackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### PackingConfigurationRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### PriceGroup :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `priceGroupId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `type`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `salesUnit`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `includedServices`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `customers`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `sequenceNumber`
      </td>
    </tr>
  </tbody>
</Table>

***

### RequestPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrder

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyCancelledOn`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderExternalIntegrationRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `orderDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `includedServices`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplyLinePackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplyLinePackingConfigurationCreate

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeItemUpdate

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :pencil2:

         Changed maximum length from 14 to 13
      </td>

      <td>
        `articleGtin`
      </td>
    </tr>
  </tbody>
</Table>

***

### TransformBatchRequestPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### WeeklyBaseSupply

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `numberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `priceGroupPrices`
      </td>
    </tr>
  </tbody>
</Table>

***

### WeeklyBaseSupplyPriceGroupPrice :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `priceGroupId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `pricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `priceGroupType`
      </td>
    </tr>
  </tbody>
</Table>

***

<br />

# Customers

<br />

## Legend

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Icon
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:
      </td>

      <td>
        The property or model has been removed
      </td>
    </tr>

    <tr>
      <td>
        :abc:
      </td>

      <td>
        The property or model has been renamed
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:
      </td>

      <td>
        The attribute such as maximum length or required vs optional has been changed
      </td>
    </tr>

    <tr>
      <td>
        :new:
      </td>

      <td>
        The property has been newly added to the model
      </td>
    </tr>
  </tbody>
</Table>

# Route changes

### SalesOrders

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        HTTP
      </th>

      <th>
        OperationId
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :pencil2:

         PUT
      </td>

      <td>
        AddSalesOrderAdditionalStickerService
      </td>

      <td>
        This endpoint cannot be used when uploading a PDF of MULTI\_TYPE.
      </td>
    </tr>

    <tr>
      <td>
        :new:

         PUT
      </td>

      <td>
        AddSalesOrderAdditionalStickerServiceMultiType
      </td>

      <td>
        Added with route 

        `/sales-orders/{salesOrderId}/additional-sticker-service-multiple`
      </td>
    </tr>
  </tbody>
</Table>

### TradeItemGroupSelection :new:

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        HTTP
      </th>

      <th>
        OperationId
      </th>

      <th>
        Description
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetTradeItemGroupSelectionsBySequenceNumber
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/sync/{sequenceNumber}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetTradeItemGroupSelectionsMaxSequence
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/current-max-sequence`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetTradeItemGroupSelectionById
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/{tradeItemGroupSelectionId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         POST
      </td>

      <td>
        AddTradeItemGroupSelection
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         PUT
      </td>

      <td>
        EditTradeItemGroupSelection
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/{tradeItemGroupSelectionId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         POST
      </td>

      <td>
        AddTradeItemsToTradeItemGroupSelection
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/{tradeItemGroupSelectionId}/trade-items`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         DELETE
      </td>

      <td>
        DeleteTradeItemsFromTradeItemGroupSelection
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/{tradeItemGroupSelectionId}/trade-items`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         DELETE
      </td>

      <td>
        DeleteTradeItemGroupSelection
      </td>

      <td>
        Added with route 

        `/trade-item-group-selections/{tradeItemGroupSelectionId}`
      </td>
    </tr>
  </tbody>
</Table>

# Enum changes

### AdditionalServiceUnit

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        LABEL
      </td>
    </tr>
  </tbody>
</Table>

### Incoterm

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Value
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CPT
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CIP
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        DPU
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        FAS
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CFR
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added enum value
      </td>

      <td>
        CIF
      </td>
    </tr>
  </tbody>
</Table>

# Model changes

### AddAdditionalStickerServiceComposition :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `stickerType`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `additionalServiceId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `price`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

### AddPackingConfigurationRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### AddPurchaseOrderRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `deviatingCharacteristics`
      </td>
    </tr>
  </tbody>
</Table>

### AddPurchaseOrderRequestPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### AddPurchaseOrderVbnCriteria

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `characteristics`
      </td>
    </tr>
  </tbody>
</Table>

### AddSalesOrderAdditionalStickerService

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `composition`
      </td>
    </tr>
  </tbody>
</Table>

### AddSalesOrderAdditionalStickerServiceMultiType :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `stickerId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `size`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `additionalInformation`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `stickerFileInformation`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `compositions`
      </td>
    </tr>
  </tbody>
</Table>

### AddSupplyRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `supplyRequestGroupId`
      </td>
    </tr>
  </tbody>
</Table>

### AddTradeItemGroupSelection :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemSelectionId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `description`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `imageUrl`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemIds`
      </td>
    </tr>
  </tbody>
</Table>

### ClockSupplyLinePackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### CustomerSticker

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `additionalServiceId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Mark as deprecated in the description
      </td>

      <td>
        `purchaseOrderId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Mark as deprecated in the description
      </td>

      <td>
        `blanketOrderId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `compositions`
      </td>
    </tr>
  </tbody>
</Table>

### CustomerStickerComposition :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `stickerType`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

### EditTradeItemGroupSelection :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `description`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `imageUrl`
      </td>
    </tr>
  </tbody>
</Table>

### OrderedAdditinalService

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `numberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

### Organization

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `email`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `phone`
      </td>
    </tr>
  </tbody>
</Table>

### PackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### PackingConfigurationRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### PurchaseOrderPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

### SalesOrder

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `salesOrderGroupId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyCancelledOn`
      </td>
    </tr>
  </tbody>
</Table>

### SelectedTradeItem

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isDeletedFromCatalog`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `photoIsUnavailableInCatalog`
      </td>
    </tr>
  </tbody>
</Table>

### SelectedTradeItemPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isUnavailableInCatalog`
      </td>
    </tr>
  </tbody>
</Table>

### SupplyRequest

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `supplyRequestGroupId`
      </td>
    </tr>
  </tbody>
</Table>

### TradeItemGroupSelection :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `description`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `imageUrl`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItems`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `added`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `lastModified`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `sequenceNumber`
      </td>
    </tr>
  </tbody>
</Table>

### TradeItemGroupSelectionTradeItem :new:

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `added`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `lastModified`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>
  </tbody>
</Table>

### TradeItemRequestPackingConfiguration

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Description
      </th>

      <th>
        Property
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        :no_entry_sign:

         Removed obsolete property
      </td>

      <td>
        `bunchesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>
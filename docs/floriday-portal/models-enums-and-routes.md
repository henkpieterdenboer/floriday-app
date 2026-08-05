---
updatedAt: 2025-04-28T11:42:12.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Models, enums and routes changes

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

### Auction

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

         POST
      </td>

      <td>
        AddClockSupplyLine
      </td>

      <td>
        Added with route 

        `/clock-supply-lines`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentOrders

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
        SetFulfillmentOrderCarrierOrganization
      </td>

      <td>
        Added with route 

        `/{fulfillmentOrderId}/carrier`
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
        SetAdditionalServicesOnSalesOrder
      </td>

      <td>
        Added with route 

        `/sales-orders/{salesOrderId}/additional-services`
      </td>
    </tr>
  </tbody>
</Table>

***

## Enum changes

### ContractPeriodKind

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

         Added new enum value
      </td>

      <td>
        `HALF_YEAR`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `YEAR`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierType

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

         Added new enum value
      </td>

      <td>
        `IFCO_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `CHEP_PALLET_BLUE`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `CHEP_PALLET_RED`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `BLOCK_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `HT_EURO_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `ONE_THIRD_DANISH_TROLLEY`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed enum value
      </td>

      <td>
        `WATERING_CONTAINER_BASE`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed enum value
      </td>

      <td>
        `WATERING_CONTAINER_POST_181`
      </td>
    </tr>
  </tbody>
</Table>

***

### PaymentProvider

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

         Added new enum value
      </td>

      <td>
        `RFH_AFTERPAY`
      </td>
    </tr>
  </tbody>
</Table>

***

### PaymentProviderCreate

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
        :no_entry_sign:

         Removed enum value
      </td>

      <td>
        `RFH_E_WALLET`
      </td>
    </tr>
  </tbody>
</Table>

***

## Model changes

### AddAdditionalService :new:

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
        `AdditionalServiceId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `NumberOfUnits`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddClockPresales:new:

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
        `pricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `supplyLineId`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddClockSupplyLine:new:

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
        `batchId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `auctionDate`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `auctionRemark`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `minimumNumberOfPiecesReservedForAuction`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `minimumPricePerPiece`
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
        `supplyLineId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `clockPresales`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `photos`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `auctionGroupCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddClockSupplyLinePhoto:new:

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
        `isPrimary`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `photoId`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddSalesOrderCorrectionRequest

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

         Added optional property
      </td>

      <td>
        `expiresAtDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `shouldReturnPackages`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderCorrectionRequest

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
        `shouldReturnPackages`
      </td>
    </tr>
  </tbody>
</Table>

***

### Batch

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

         Changed from nullable to non-nullable
      </td>

      <td>
        `initialNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `batchReference`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `tradeItemVersion`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>
  </tbody>
</Table>

***

### BatchMutation

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

        `creationDateTime`
      </td>

      <td>
        `addedOn`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomerOffer

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
        `customerOfferId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `supplyRequestId`
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
        `customerOfferLines`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added property
      </td>

      <td>
        `customerOfferType`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added property
      </td>

      <td>
        `customerOrganizationIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `agreementReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added property
      </td>

      <td>
        `isDraft`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `imageUrl`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `title`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
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
        `quantityUnitUsed`
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

### CustomerOfferLine

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
        `customerOfferLineId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `supplyRequestLineId`
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
        `tradePeriod`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `deliveryPeriod`
      </td>
    </tr>

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

        Added optional property
      </td>

      <td>
        `tradeItemVersion`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added property
      </td>

      <td>
        `warehouseId`
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
        `volumePrices`
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
        `usesCatalogAvailability`
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

        Added optional property
      </td>

      <td>
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `counterId`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomPackage

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

         Added optional property
      </td>

      <td>
        `floricodeVrsPackagingId`
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
        :new:

         Added property
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>
  </tbody>
</Table>

***

### DeliveryLocation

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
  </tbody>
</Table>

***

### EditClockPresalesSupplyLine

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

         Changed type from 

        `double`

         to 

        `decimal`
      </td>

      <td>
        `pricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

        Changed maximum value from 

        `9999999999999999`

         to  

        `9999.999`
      </td>

      <td>
        `pricePerPiece`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentRequestCreateAuctionTradeItem

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

         Changed from nullable to non-nullable
      </td>

      <td>
        `clockMinimumPrice`
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

        Added optional property
      </td>

      <td>
        `stickerId`
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
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `commercialName`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `physicalAddress`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `mailingAddress`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `lastModified`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `paymentProviders`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed to enum type 

        **PaymentProvider**
      </td>

      <td>
        `paymentProviders`
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

        Added optional property
      </td>

      <td>
        `batchReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `isPaid`
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

        Added a minimum length of 1 character
      </td>

      <td>
        `customerOrderId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

        Added a minimum length of 1 character
      </td>

      <td>
        `createdByUser`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

        Added a minimum length of 1 item
      </td>

      <td>
        `additionalServices`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

        Added a minimum length of 1 character
      </td>

      <td>
        `deliveryRemarks`
      </td>
    </tr>
  </tbody>
</Table>

***

### BatchBaseSupply

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

         Added optional property
      </td>

      <td>
        `batchReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `batchId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `batchDate`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `orderPeriod`
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

    <tr>
      <td>
        :new:

         Added optional property
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
        `tradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `warehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `initialNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `currentNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `isSoldOut`
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
        `packingConfigurations`
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

### BatchBaseSupplyPackingConfiguration

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
        `isPrimary`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `piecesPerPackage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `packagesPerLayer`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `layersPerLoadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `package`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `loadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `allowedCustomerOrganizationIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `additionalPricePerPiece`
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

***

### BatchBaseSupplyPriceGroupPrice

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
        `supplyLineId`
      </td>
    </tr>

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
        `priceGroupPrice`
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

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `pricePerPieceLastModified`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeItem

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

         Added optional property
      </td>

      <td>
        `additionalPackagingInformationFloricodeVrsPackagingIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `sellerOrganizationId`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeItemSummary

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
        `sellerOrganizationId`
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
        :new:

         Added optional property
      </td>

      <td>
        `floricodeVrsPackagingId`
      </td>
    </tr>
  </tbody>
</Table>

***

### Warehouse

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

         Changed from nullable to non-nullable
      </td>

      <td>
        `creationDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `lastModifiedDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>
  </tbody>
</Table>

***

# Customers

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

## Enum changes

### ContractPeriodKind

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

         Added new enum value
      </td>

      <td>
        `HALF_YEAR`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `YEAR`
      </td>
    </tr>
  </tbody>
</Table>

***

### LoadCarrierType

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

         Added new enum value
      </td>

      <td>
        `IFCO_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `CHEP_PALLET_BLUE`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `CHEP_PALLET_RED`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `BLOCK_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `HT_EURO_PALLET`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `ONE_THIRD_DANISH_TROLLEY`
      </td>
    </tr>
  </tbody>
</Table>

***

### PaymentProvider

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

         Added new enum value
      </td>

      <td>
        `RFH_AFTERPAY`
      </td>
    </tr>
  </tbody>
</Table>

***

### PaymentProviderCreate:new:

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

         Added new enum value
      </td>

      <td>
        `RFH`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `VRM`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `PLANTION`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `FX_SERVICES`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new enum value
      </td>

      <td>
        `OTHER`
      </td>
    </tr>
  </tbody>
</Table>

***

### PhotoType

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

         Added new enum value
      </td>

      <td>
        `WEBSHOP_FRIENDLY`
      </td>
    </tr>
  </tbody>
</Table>

***

## Model changes

### AddContract

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

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddContractVersion

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

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddPurchaseOrder

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

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>

***

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
        :pencil2:

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>

***

### AddSalesOrderCorrectionRequest

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

         Added optional property
      </td>

      <td>
        `expiresAtDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added optional property
      </td>

      <td>
        `shouldReturnPackages`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderCorrectionRequest

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
        `shouldReturnPackages`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomPackage

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
        `floricodeVrsPackagingId`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContract

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

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
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
        :new:

         Added property
      </td>

      <td>
        `creationDateTime`
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

        Added optional property
      </td>

      <td>
        `stickerId`
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
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `paymentProviders`
      </td>
    </tr>
  </tbody>
</Table>

***

### OrganizationDetails

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

         Changed from nullable to non-nullable
      </td>

      <td>
        `commercialName`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `mailingAddress`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `physicalAddress`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `name`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `paymentProviders`
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

        Added optional property
      </td>

      <td>
        `batchReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `isPaid`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderCalculatedFields

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

        Added optional property
      </td>

      <td>
        `totalAuctionLevies`
      </td>
    </tr>

    <tr>
      <td>
        :new:

        Added optional property
      </td>

      <td>
        `totalPackageRentalCosts`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeItem

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

         Added optional property
      </td>

      <td>
        `additionalPackagingInformationFloricodeVrsPackagingIds`
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
        :new:

         Added optional property
      </td>

      <td>
        `floricodeVrsPackagingId`
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
        :new:

         Added property
      </td>

      <td>
        `supplierOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed type from 

        **PaymentProvider**

         to 

        **PaymentProviderCreate**
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>
  </tbody>
</Table>
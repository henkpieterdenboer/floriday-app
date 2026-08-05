---
updatedAt: 2025-04-28T11:42:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Model, enums and routes changes

# Suppliers

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

### DeliveryOrders

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
        :no_entry_sign:

         POST
      </td>

      <td>
        AddFulfillmentRequest
      </td>

      <td>
        Removed with route 

        `/delivery-orders/{deliveryOrderId}/auction/fulfillment-requests`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         POST
      </td>

      <td>
        AddDeliveryOrderAuction
      </td>

      <td>
        Renamed endpoint into 

        `AddClockDeliveryOrder`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         DELETE
      </td>

      <td>
        DeleteDeliveryOrderAuction
      </td>

      <td>
        Renamed endpoint into 

        `DeleteClockDeliveryOrder`
      </td>
    </tr>
  </tbody>
</Table>

***

### PlantPassports :new:

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
        GetPlantPassportPdf
      </td>

      <td>
        Added with route 

        `/plant-passports`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPlantPassportPdfBySalesChannelOrderId
      </td>

      <td>
        Added with route 

        `/plant-passports/by-sales-channel-order-id/{salesChannelOrderId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPlantPassportPdfBySalesOrderId
      </td>

      <td>
        Added with route 

        `/plant-passports/by-sales-order-id/{salesOrderId}`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeSettings :new:

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
        GetCustomerTradeSettingsByOrganizationId
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/by-id/{customerOrganizationId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetCustomerTradeSettingsMaxSequence
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/max-sequence`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetCustomerTradeSettingsBySequenceNumber
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/sync/{sequenceNumber}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetSupplierTradeSettingFromOrganization
      </td>

      <td>
        Added with route 

        `/trade-settings/supplier/current-organization`
      </td>
    </tr>
  </tbody>
</Table>

***

## Enum changes

### AuctionLocation

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
        :abc:

         Renamed enum value into 

        `DIGITAL`
      </td>

      <td>
        `NURSERY`
      </td>
    </tr>
  </tbody>
</Table>

***

## Model changes

### AddClockSalesFromNurserySupplyLine

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

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>
  </tbody>
</Table>

***

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

         Set a minimum length of 1
      </td>

      <td>
        `title`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Set a minimum length of 1
      </td>

      <td>
        `description`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `subSupplierOrganizationIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `allowTradeItemVariants`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `delivery`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Set a minimum length of 1
      </td>

      <td>
        `contractLines`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `startDateTime`
      </td>

      <td>
        `startDate`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `endDateTime`
      </td>

      <td>
        `endDate`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `deliveryConditionId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultDeliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `despatchWarehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `nextLegIdentifier`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultIncoterm`
      </td>
    </tr>
  </tbody>
</Table>

***

### ClockPresalesSupplyLine

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
        `auctionDate`
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
        :new:

         Added property
      </td>

      <td>
        `deliveryNotecode`
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
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `deliveryNoteReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `initialAuctionLocation`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
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
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemVersion`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `tradingTerms`
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

         Removed property
      </td>

      <td>
        `additionalPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `allowedCustomerOrganizationIds`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `layersPerLoadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `packagesPerLayer`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `transportHeightInCm`
      </td>
    </tr>
  </tbody>
</Table>

***

### Contract

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

         Changed to model 

        **ContractVersion**

         and moved as 

        `versionNumber`
      </td>

      <td>
        `version`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `version`

         as 

        `reasonForVersionUpdate`
      </td>

      <td>
        `versionDescription`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed to model 

        **ContractStatus**

         and moved as 

        `approvalStatus`
      </td>

      <td>
        `status`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `status`

         as 

        `approvedOnDateTime`
      </td>

      <td>
        `dateOfApproval`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `status`
      </td>

      <td>
        `declineDescription`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `status`
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `status`

         as 

        `isDeleteRequestedBySupplier`
      </td>

      <td>
        `deleteRequestedBy`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `initiatedBy`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `IsInitiatedBySupplier`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Set a minimum length of 1
      </td>

      <td>
        `contractLines`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `startDateTime`
      </td>

      <td>
        `startDate`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `endDateTime`
      </td>

      <td>
        `endDate`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `delivery`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`

         as 

        `deliveryConditionId`
      </td>

      <td>
        `deliveryConditionSetId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultDeliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `despatchWarehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `nextLegIdentifier`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultIncoterm`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `allowTradeItemVariants`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `reference`
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
  </tbody>
</Table>

***

### ContractDelivery :new:

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

         Added new property
      </td>

      <td>
        `deliveryConditionId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `defaultDeliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `despatchWarehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `defaultIncoterm`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `nextLegIdentifier`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLine

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

         Removed property
      </td>

      <td>
        `contractLineTradeItems`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `tradeItem`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `periods`
      </td>

      <td>
        `contractLinePeriods`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `additionalServiceIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `additionalServices`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLineAdditionalService :new:

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

         Added new property
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
        `isOptional`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLinePeriod

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

        `startDateTime`
      </td>

      <td>
        `startDate`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `endDateTime`
      </td>

      <td>
        `endDate`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `lowerMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `upperMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `lowerMarginNumberOfPiecesPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `upperMarginNumberOfPiecesPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `pricePerPieceMargin`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `numberOfPiecesMargin`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLinePeriodBandwidthNumberOfPieces :new:

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

         Added new property
      </td>

      <td>
        `lowerMarginNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `lowerMarginPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPercentage`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLinePeriodBandwidthPricePerPiece :new:

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

         Added new property
      </td>

      <td>
        `lowerMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `lowerMarginPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPercentage`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractLineTradeItem

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

         Removed property
      </td>

      <td>
        `isPrimary`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed to model 

        **PackingConfigurationBase**
      </td>

      <td>
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `contractLineTradeItemGroupId`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractPackingConfiguration

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

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractStatus :new:

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

         Added new property
      </td>

      <td>
        `approvalStatus`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `approvedOnDateTime`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `declineDescription`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `isDeleteRequestedBySupplier`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `isDeleted`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractVersion

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

         Added new property
      </td>

      <td>
        `versionNumber`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `isLatestApprovedVersion`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `reasonForVersionUpdate`
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
        :pencil2:

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomerTradeSettings :new:

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
        `CustomerOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsDirectOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequestsOnDirectOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequestsOnSupplyOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `allowSuppliersToManageSelectedTradeItemAssortment`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsSupplyOfTypePurchaseTip`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesContracts`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsTransportCost`
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

### DeliveryOrderAuction

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

        `batchFulfillmentRequests`
      </td>

      <td>
        `fulfillmentRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemFulfillmentRequests`
      </td>
    </tr>
  </tbody>
</Table>

***

### ContractTradeItemGroup :new:

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
        `contractTradeItemGroupId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `SupplierOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `Name`
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

***

### ContractTradeItemGroupTradeItem :new:

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
        `isPrimary`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `packingConfiguration`
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

         Set a minimum length of 1
      </td>

      <td>
        `title`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Set a minimum length of 1
      </td>

      <td>
        `description`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `subSupplierOrganizationIds`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `allowTradeItemVariants`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `delivery`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Set a minimum length of 1
      </td>

      <td>
        `contractLines`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `startDateTime`
      </td>

      <td>
        `startDate`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `endDateTime`
      </td>

      <td>
        `endDate`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `deliveryConditionId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultDeliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `despatchWarehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `nextLegIdentifier`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property and moved to 

        `delivery`
      </td>

      <td>
        `defaultIncoterm`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `customerOrganizationId`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractDelivery :new:

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
        `deliveryConditionId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `defaultDeliveryLocationGln`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `despatchWarehouseId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `defaultIncoterm`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `nextLegIdentifier`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLine

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

        `tradeItem`
      </td>

      <td>
        `contractLineTradeItem`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `periods`
      </td>

      <td>
        `contractLinePeriods`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `additionalServices`
      </td>

      <td>
        `contractLineAdditionalServices`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemGroup`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from required to optional
      </td>

      <td>
        `tradeItem`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLinePeriod

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

        `startDateTime`
      </td>

      <td>
        `startDate`
      </td>
    </tr>

    <tr>
      <td>
        :abc:

         Renamed property into 

        `endDateTime`
      </td>

      <td>
        `endDate`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required and as type decimal
      </td>

      <td>
        `pricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `lowerMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `upperMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `lowerMarginNumberOfPiecesPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `upperMarginNumberOfPiecesPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `pricePerPieceMargin`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `numberOfPiecesMargin`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from optional to required
      </td>

      <td>
        `numberOfPieces`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLinePeriodBandwidthNumberOfPieces :new:

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

         Added new property
      </td>

      <td>
        `lowerMarginNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginNumberOfPieces`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `lowerMarginPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPercentage`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLinePeriodBandwidthPricePerPiece :new:

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

         Added new property
      </td>

      <td>
        `lowerMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `lowerMarginPercentage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `upperMarginPercentage`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLineTradeItem

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

         Changed to model 

        **EditContractPackingConfiguration**
      </td>

      <td>
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `tradeItemVersion`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractLineTradeItemGroup :new:

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

         Added new property
      </td>

      <td>
        `contractLineTradeItemId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `contractTradeItemGroupId`
      </td>
    </tr>
  </tbody>
</Table>

***

### EditContractPackingConfiguration :new:

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

         Added new property
      </td>

      <td>
        `piecesPerPackage`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `customPackageId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `packagesPerLayer`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `layersPerLoadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `loadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added new property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentRequestCreateAuction

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
        `auctionRemark`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
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
        `imageUrl`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `remarks`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `piecesPerPackage`
      </td>
    </tr>
  </tbody>
</Table>

***

### FulfillmentRequestCreateAuctionTradeItem :new:

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
        `auctionRemark`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
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
        `clockMinimumPrice`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `clockPreSalesPrice`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `fulfillmentRequestId`
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
        `newBatchId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
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
        `packingAgentOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `serviceCode`
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
  </tbody>
</Table>

***

### InvoiceLine

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
        `invoiceLineId`
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
        `salesChannelOrderId`
      </td>
    </tr>
  </tbody>
</Table>

***

### OrderRequest

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
        `isDeleted`
      </td>
    </tr>
  </tbody>
</Table>

***

### Package

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

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### PackingConfigurationBase

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

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
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
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `salesChannelOrderId`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `status`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `paymentProvider`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `createdBySupplier`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `calculatedFields`
      </td>
    </tr>
  </tbody>
</Table>

***

### SalesOrderMutables

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

         Changed 

        [Range]

         to 1-999
      </td>

      <td>
        `vbnPackageCode`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplierTradeSettings :new:

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
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesCancellationGracePeriodOfMinimumQuantityIsNotMet`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesContract`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesCustomerStickers`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsOrderRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsSupplyRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsTradeItemRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsPackingConfigurationRequests`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplyLine

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
        `pricePerPieceLastModified`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `tradingTerms`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeSetting :new:

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
        `isActive`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `exemptedOrganizationIds`
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
  </tbody>
</Table>

***

### WeeklyBaseSupplyPriceGroupPrice

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
        `pricePerPieceLastModified`
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

***

## Route changes

### PlantPassports :new:

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
        GetPlantPassportPdfBySalesChannelOrderId
      </td>

      <td>
        Added with route 

        `/plant-passports/by-sales-channel-order-id/{salesChannelOrderId}/pdf`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetPlantPassportPdfBySalesOrderId
      </td>

      <td>
        Added with route 

        `/plant-passports/by-sales-order-id/{salesOrderId}/pdf`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeSettings :new:

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
        GetCustomerTradeSettingsByOrganizationId
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/by-id/{customerOrganizationId}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetCustomerTradeSettingsMaxSequence
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/max-sequence`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetCustomerTradeSettingsBySequenceNumber
      </td>

      <td>
        Added with route 

        `/trade-settings/customer/sync/{sequenceNumber}`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         GET
      </td>

      <td>
        GetSupplierTradeSettingFromOrganization
      </td>

      <td>
        Added with route 

        `/trade-settings/supplier/current-organization`
      </td>
    </tr>
  </tbody>
</Table>

***

## Enum changes

### AuctionLocation

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
        :abc:

         Renamed enum value into 

        `DIGITAL`
      </td>

      <td>
        `NURSERY`
      </td>
    </tr>
  </tbody>
</Table>

***

## Model changes

### ClockPresalesSupplyLine

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
        `auctionDate`
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
        :new:

         Added property
      </td>

      <td>
        `deliveryNotecode`
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
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `deliveryNoteReference`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `initialAuctionLocation`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
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
        `packingConfiguration`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `salesChannel`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `tradeItemVersion`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `tradeInstrument`
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

         Removed property
      </td>

      <td>
        `additionalPricePerPiece`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `layersPerLoadCarrier`
      </td>
    </tr>

    <tr>
      <td>
        :pencil2:

         Changed from nullable to non-nullable
      </td>

      <td>
        `packagesPerLayer`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `photoUrl`
      </td>
    </tr>

    <tr>
      <td>
        :no_entry_sign:

         Removed property
      </td>

      <td>
        `additionalPricePerPiece`
      </td>
    </tr>
  </tbody>
</Table>

***

### CustomerTradeSettings :new:

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
        `CustomerOrganizationId`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsDirectOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequestsOnDirectOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequestsOnSupplyOrders`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `allowSuppliersToManageSelectedTradeItemAssortment`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsSupplyOfTypePurchaseTip`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesContracts`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsTransportCost`
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

### InvoiceLine

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
        `invoiceLineId`
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
        `salesChannelOrderId`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplierTradeSettings :new:

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
        :new:

         Added property
      </td>

      <td>
        `automaticallyAcceptsCorrectionRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesCancellationGracePeriodOfMinimumQuantityIsNotMet`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesContract`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `usesCustomerStickers`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsOrderRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsSupplyRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsTradeItemRequests`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `acceptsPackingConfigurationRequests`
      </td>
    </tr>
  </tbody>
</Table>

***

### SupplyLine

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
        `pricePerPieceLastModified`
      </td>
    </tr>
  </tbody>
</Table>

***

### TradeSetting :new:

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
        `isActive`
      </td>
    </tr>

    <tr>
      <td>
        :new:

         Added property
      </td>

      <td>
        `exemptedOrganizationIds`
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
        `barcodeLogisticServiceProvider`
      </td>
    </tr>
  </tbody>
</Table>
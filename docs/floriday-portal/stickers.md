---
updatedAt: 2026-06-17T10:26:16.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer stickers

## Supported stickers scenarios

* Receiving stickers
* Creating stickers
* Deleting stickers

For the business rules concerning stickers, please read [Stickers via Floriday](https://developer.floriday.io/docs/customer-stickers).

<br />

***

## Receiving customer stickers

**Purpose:**\
Receive stickers from Floriday.

<br />

| NR | Process step                                                                       | API call / scenario                                                                                                                                            |
| :- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns the sticker by ID as PDF file.                                             | *[GetCustomerStickerAsPdfById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerAsPdfById)*         |
| 2  | Returns the maximum sequence number found in stickers.                             | *[GetCustomerStickersMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickersMaxSequence)*   |
| 3  | Returns a list of max 1000 connections starting  from a specified sequence number. | *[GetStickersBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickersBySequenceNumber)* |

<br />

***

## Adding customer stickers

**Purpose:**\
Adding customer stickers to Floriday for supplier.

<br />

**Prerequisites:**

* A customer sticker object linked to an additionalServiceId is required to add customer stickers, see [Stickers via Floriday](https://developer.floriday.io/docs/customer-stickers);
* *Quantity* must be equal the number of pages in the PDF or the number of times you want the page duplicated in case of *UploadLayout.SINGLE*.

<br />

| NR | Process step           | API call / scenario                                                                                                                                        |
| :- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new sticker. | *[AddCustomerStickerInformation](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/AddCustomerStickerInformation)* |

<br />

***

## Deleting stickers

**Purpose:**\
Deleting customer sticker, customer sticker information and additional service linked to sales order and customer sticker object from Floriday.

<br />

**Prerequisites:**

* StickerID has to be known in Floriday.

<br />

| NR | Process step                                                                           | API call / scenario                                                                                                                                          |
| :- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Sets the sticker as deleted and deletes the PDF document from the server by StickerId. | *[DeleteAdditionalStickerService](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomerStickers/DeleteAdditionalStickerService)* |
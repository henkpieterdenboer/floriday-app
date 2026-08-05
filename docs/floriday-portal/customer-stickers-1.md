---
updatedAt: 2026-06-15T07:15:18.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer stickers

## Supported customer sticker scenarios

* Receive customer sticker meta data;
* Receive customer stickers in PDF;
* Indicate which stickers are printed and placed.

For the business rules concerning stickers, please read [Customer stickers](https://developer.floriday.io/docs/customer-stickers).

***

<br />

## Implementation requirements

If the following steps are implemented and validated by an implementation consultant, it's considered to be a correct implementation in the [Implementation overview](https://www.floriday.io/en/software-suppliers-growers), visualized as a green check mark.

<Image align="left" border={true} src="https://files.readme.io/a444c9869aa17a01250f47e9e1e970309b9587bbc06f5866fe192248515bae31-image.png" className="border" />

<br />

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>

      </th>

      <th>
        Workflow
      </th>

      <th>
        Required endpoints
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        1
      </td>

      <td>
        Enable supplier organizations to receive customer sticker data of sales orders placed by customer organizations.
      </td>

      <td>
        [Receive customer sticker data](https://developer.floriday.io/docs/customer-stickers-1#receive-customer-sticker-data)
      </td>
    </tr>

    <tr>
      <td>
        2
      </td>

      <td>
        Enable supplier organizations to receive customer sticker files in PDF, based on stickerId.
      </td>

      <td>
        [Receive customer sticker files](https://developer.floriday.io/docs/customer-stickers-1#receive-customer-sticker-files)
      </td>
    </tr>

    <tr>
      <td>
        3
      </td>

      <td>
        Enable supplier organizations to indicate which stickers have already been handled. The isHandled status signals to customer organizations that the sticker has been printed and placed and should therefore not be modified.

        When implementing the SetCustomerStickersIsHandled endpoint, you may choose to let the supplier set the isHandled status manually or to automatically set the isHandled status when stickers are printed.

        In either case, we recommend to add a feature to remove the isHandled status as well. If a grower is somehow unable to place the stickers, the customer organization will want to know.
      </td>

      <td>
        [Indicate which stickers are handled](https://developer.floriday.io/docs/customer-stickers-1#indicate-which-stickers-are-handled)
      </td>
    </tr>
  </tbody>
</Table>

> 👍 Why isHandled?
>
> Stickers that are set to isHandled lead to a more efficient logistic and financial process for customer organizations. Customer organizations that know that stickers have been placed, will not have to schedule self-placement or invoicing of stickers afterwards. It also removes the necessity of having to directly contact the supplier organization about the status.

> ❗️ Additional services are required
>
> Supplier organizations are required to set up their sticker configurations in Floriday once. They can do this by adding stickers as Additional services in the Floriday application. Once they've added their stickers this way, customer organizations will be able to know which sticker types the supplier organization supports.
>
> Currently, supplier organizations can only add them in the Floriday application. They can read how by following the step by step guide in the [Floriday Helpcenter](https://helpcenter.floriday.com/nl/articles/5540583-aanvullende-diensten-stickers).

***

<br />

## Receive customer sticker data

<br />

#### Purpose:

Receive instructions and order references for the received customer stickers.

> 📘 Important note when syncing sticker data
>
> A supplier may retrieve a sticker PDF with the GetCustomerStickerPdfById & GetCustomerStickerPdfByIds API Calls. When this happens, the `lastRequestedOn` property is updated on the customer side. This allows the customer to see when stickers have been requested by the supplier.
>
> Even though the property is only updated on the customer side, a sequence bump on the supplier side is also triggered. Although this usually indicates an update, if you keep requesting the sticker data when this sequence bump is triggered, you will end up in an infinite loop.
>
> This is why we recommend to only request the sticker data once when:
>
> * The supplier actually needs the sticker data or;
> * The sticker object is new / contains `stickerFileInformation` for the first time.

***

<br />

#### Process steps:

| NR | Process step                                                                     | API call / scenario                                                                                                                                                    |
| :- | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns the maximum sequence number found in customerStickers.                   | *[GetCustomerStickersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickersMaxSequence)*           |
| 2  | Returns a list of max 1000 customers starting  from a specified sequence number. | *[GetCustomerStickersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickersBySequenceNumber)* |

***

<br />

## Receive customer sticker files

<br />

#### Purpose:

Receive customer sticker files in PDF format.

***

<br />

#### Process steps:

| NR  | Process step                                                          | API call / scenario                                                                                                                                  |
| :-- | :-------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Returns multiple customer stickers in pdf format based on stickerIds. | *[GetCustomerStickerPdfByIds](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerPdfByIds)* |
| 1 B | Returns a single customer sticker in pdf format based on stickerId.   | *[GetCustomerStickerPdfById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerPdfById)*   |

***

<br />

## Indicate which stickers are handled

<br />

#### Purpose:

Indicate to customer which stickers are handled.

***

<br />

#### Process steps:

| NR | Process step                         | API call / scenario                                                                                                                                      |
| :- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Indicate which stickers are handled. | *[SetCustomerStickersIsHandled](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/SetCustomerStickersIsHandled)* |
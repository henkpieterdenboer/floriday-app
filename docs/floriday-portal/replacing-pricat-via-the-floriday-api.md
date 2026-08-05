---
updatedAt: 2026-06-10T08:02:50.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Replacing EDI-PRICAT via the Floriday API

Step by step, we are working towards a secure, stable and future‑proof digital infrastructure for the floriculture sector. That is why Royal FloraHolland will stop a number of outdated EDI-PRICAT services for growers as of 1 September 2026. This technology no longer fits the way we want to exchange data securely, reliably and flexibly.

As of 1 September 2026, Royal FloraHolland will stop the following EDI-PRICAT services for growers:

* Daily proceeds direct and auction clock (**E-Invoice EPT**) (*Elektronisch dagafschrift*)
* Price information during the auction (**V EPT**) (*Prijsinformatie tijdens veilen*)
* Daily statistics – average auction prices (**DAGSTA**) (*Dagstatistieken*)

This page describes the available alternative data retrieval methods. The alternatives are meant to offer at least the same data than the EDI-PRICAT did, in order to keep the existing processes functioning.

***

<br />

## E-Invoice EPT (Elektronisch dagafschrift)

The E-Invoice EPT (Also known as Elektronisch dagafschrift in Dutch) contains daily direct, auction clock and clock pre sales invoiced product transactions and their related logistic means transfers.

<br />

This data is used by supplier organizations:

* to process all product transactions and their related logistic means transfers in their administration
* to match the product transactions and their related logistic means transfers with:
  * the original to be settled sales orders based on the fulfillment orders for direct sales
  * the original batches for clock pre sales/auction sales.

To retrieve this data in the Floriday API, we have extended the [InvoiceLines endpoints](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/InvoiceLines).

`InvoiceLines` now contains sync endpoints for retrieving Invoice status of both Sales orders and related Logistic means. An additional GET by id endpoint is available for Sales orders as well, which allows you to retrieve an invoice status for individual sales orders.

Contrary to the E-Invoice EPT, **Invoice status** via the Floriday API contains also the product transactions of Royal FloraHolland Daytrade and their related logistic means.

> 📘 Two phases of an InvoiceLine
>
> InvoiceLines are created as soon as the settlement request is successfully processed by the payment service provider before the actual invoicing. This means that the invoice number and invoice date will be made available after invoicing, at which time the invoice line is updated to include the additional information.
>
> The upside to this is that the supplier organization receives at an earlier stage the invoice status of the corresponding sales orders.
>
> Take note that this should not be interpreted as a correction in the traditional sense. If a financial correction is applied, new invoice lines will be generated accordingly, consistent with how they are presented on the invoice and communicated via PRICAT.
>
> Please consider that Plantion and VRM payment service providers currently do not provide invoice statuses for the corresponding sales orders via Floriday. It is expected that once they provide these, the invoiceLines will not contain a invoice number and invoice date at the start.

<br />

Below are the model details of both sync endpoints. For the most up to date model information, always consult the Swagger page.

<Tabs>
  <Tab title="Sales orders - Invoice lines">
    The model below is from the sync endpoint [GetInvoiceLinesBySalesOrderId](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/InvoiceLines/GetInvoiceLinesBySalesOrderId).

    The GET by id endpoint is similar, apart from not returning a maximumSequenceNumber.

    <br />

```json Sales order invoice lines
{
  "maximumSequenceNumber": 0,
  "results": [
    {
      "invoiceLineId": "string",
      "invoiceId": "string",
      "salesOrderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "salesChannelOrderId": "string",
      "deliveryFormReference": "string",
      "subTotalAmount": 0,
      "numberOfPieces": 0,
      "invoiceDate": "2026-06-10T08:02:24.230Z",
      "lastModified": "2026-06-10T08:02:24.230Z",
      "sequenceNumber": 0,
      "creationDateTime": "2026-06-10T08:02:24.230Z"
    }
  ]
}
```

    <br />
  </Tab>

  <Tab title="Logistic means - Invoice lines">
    The model below is from the sync endpoint [GetLogisticMeansInvoiceStatusBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/InvoiceLines/GetLogisticMeansInvoiceStatusBySequenceNumber), including an explanation of properties that may not be as straightforward as other properties.

```json Logistic means invoice lines
{
  "maximumSequenceNumber": 0,
  "results": [
    {
      "invoiceLineId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "loadCarrierBarcode": "string",
      "deliveryNoteCode": "string",
      "fulfillmentOrderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "invoiceId": "string",
      "invoiceDate": "2026-06-10T08:01:03.471Z",
      "itemCode": "string",
      "logisticMeansType": "AUCTION_TROLLEY_LAYER",
      "numberOfItems": 0,
      "lastModified": "2026-06-10T08:01:03.471Z",
      "sequenceNumber": 0,
      "creationDateTime": "2026-06-10T08:01:03.471Z"
    }
  ]
}
```

    * `itemCode`: Optional property. Will only return packaging codes in case of logisticMeansType.PACKAGE.

    * `logisticMeansType`: The type of logistic means related to the invoiceLine.

    * `numberOfItems`: The amount associated with the returned logisticMeansTypes. For instance 3 Danish trolleys or 8 packages.
  </Tab>
</Tabs>

> 📘 Plantion and VRM
>
> Sales orders of Plantion and VRM are supported, Invoice status is currently not supported by Plantion and VRM.  We will inform software developers if the Invoice status will be developed and provided by Plantion and VRM.

***

<br />

## V EPT (Prijsinformatie tijdens veilen)

The V EPT (Also known as Prijsinformatie tijdens veilen in Dutch) contains auction clock and clock pre sales transactions which are sent after auctioning the batch.

This data is mainly used by supplier organizations:

* to process and view up to date auction prices for the purpose of sales price determination
* actual insight in to auction revenues.

To receive auction price information through the Floriday API, this data can be retrieved using the [salesOrders endpoints](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders). Floriday sales orders contain up-to-date sales price data on Daytrade, Clock pre sales and auction sales.

Furthermore, there is no need to wait for update emails like with the V EPT. Instead, the sync endpoint allows for live sales price data, including corrected sales order data.

For more information on the Implementation of salesOrders, please view the [Implementation Guide](https://developer.floriday.io/docs/sales-orders).

> 📘 Example in the Floriday application
>
> The Sales orders overview in the Floriday application uses a visual indication to show if the sales order has been invoiced completely. A colored icon of a stack is coins is used to indicate if the invoicing was successful or not.
>
> * Gray for when the sales order has not been invoiced yet.
> * Green for when the the sales order is invoiced completely.
> * Red for when an incorrect amount was invoiced. This usually takes place when only part of a sales order is fulfilled.
>
> <Image align="left" src="https://files.readme.io/f1a0832722690883cba0c836eb5ef4fffbc7795c78f3338ead7810d2910589ca-image.png" />

> 📘 Plantion and VRM
>
> Sales orders of Plantion and VRM are supported.

***

<br />

## DAGSTA (Dagstatistiek)

<br />

The DAGSTA (Also known as Dagstatistiek in Dutch) contains daily average auction prices based on auction transactions which are sent after the auction.

This data is mainly used by supplier organizations:

* to process and view up to daily average auction prices for the purpose of sales price determination.
* actual insight/benchmark in to suppliers' own auction prices relative to average market prices.

To receive average auction price information through the Insights API (non Floriday), this data can be retrieved using the [Insights endpoints](https://api.floriday.io/insights/swagger/index.html). Insights endpoints contain daily average auction prices for products sold by the supplier. In addition to DAGSTA, the Insights API also contains an endpoint for daily average auction prices of general product groups.

The average auction price data provided by DAGSTA can be retrieved using Insights. There are two ways for supplier organizations to view this data:

* By utilizing the Insights API, letting software developers create their own implementation of average auction price data. An Insights subscription is mandatory for retrieving data from the Insights API.
* A supplier organization may access the Insights app via Floriday by taking out a subscription. This allows the supplier organization to view the average auction prices in the Insights app.

Please refer to [this page](https://intercom.help/royal-floraholland-grower-helpcenter/en/articles/10420460-use-the-rfh-insights-api) for more information.

In both cases, please contact <martienroling@royalfloraholland.com> for access and additonal information regarding the Insights API.

> 📘 Plantion and VRM
>
> Average auction prices for Plantion and VRM are currently supported in the Insights API.

<br />
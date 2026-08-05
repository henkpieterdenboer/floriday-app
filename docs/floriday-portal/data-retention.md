---
updatedAt: 2025-04-28T11:05:15.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Data retention

This page contains information on the data retention periods for the resources used in Floriday.

## Guidance

* Transactional data is the basis for agreements and have to be stored for 5 years for legal purposes like disputes and claims.
* Masterdata has a retention period of at least 5 years given its purpose for historical records.
* The retention periods for Operational storage listed below are **minimum** retention periods. In practice, the actual retention period may be longer.
* Operational storage data can be accessed via the Floriday API.
* Cold storage data can only be accessed manually.
* Storage costs money especially media storage, please take this into account when implementing the integration by e.g. reusing image URLs.
* Data retention should be regarded as an indication, the retention periods can deviate and can be changed by Floriday. No rights can be derived from the given retention periods.
* Implementation of data retention is in progress, communication will be done accordingly.

<Table align={["left","left","left","left","left"]}>
  <thead>
    <tr>
      <th style={{ textAlign: "left" }}>
        Resource
      </th>

      <th style={{ textAlign: "left" }}>
        Classification
      </th>

      <th style={{ textAlign: "left" }}>
        Operational storage
      </th>

      <th style={{ textAlign: "left" }}>
        Cold Storage
      </th>

      <th style={{ textAlign: "left" }}>
        From
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td style={{ textAlign: "left" }}>
        Trade item
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Organizations
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Commercial services
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Custom packages
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Warehouses
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Media
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata  

        Additional information
      </td>

      <td style={{ textAlign: "left" }}>
        In use >5 years  

        If not in use 'clean-up'
      </td>

      <td style={{ textAlign: "left" }}>
        TBD
      </td>

      <td style={{ textAlign: "left" }}>
        not in use
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Base items
      </td>

      <td style={{ textAlign: "left" }}>
        Supply chain masterdata
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        > 5 years
      </td>

      <td style={{ textAlign: "left" }}>
        n.a.
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Connections
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 month
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        isDeleted
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Requests
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        creationDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Supply lines
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        14 days
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        deliveryPeriodEndDate
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Additional services
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        isDeleted
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Sales orders
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        latestDeliveryDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Purchase orders
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        latestDeliveryDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Blanket orders
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        latestDeliveryDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Contracts
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        contractEndDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Delivery Orders
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        1 year
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        isDeleted
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Fulfilment Orders
      </td>

      <td style={{ textAlign: "left" }}>
        Transaction data
      </td>

      <td style={{ textAlign: "left" }}>
        3 months logistic data\
        1 year transaction data for settlement
      </td>

      <td style={{ textAlign: "left" }}>
        5 years
      </td>

      <td style={{ textAlign: "left" }}>
        deliveryDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Batches
      </td>

      <td style={{ textAlign: "left" }}>
        Additional information
      </td>

      <td style={{ textAlign: "left" }}>
        30 days
      </td>

      <td style={{ textAlign: "left" }}>

      </td>

      <td style={{ textAlign: "left" }}>
        creationDateTimeBatch
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Customer stickers
      </td>

      <td style={{ textAlign: "left" }}>
        Additional information
      </td>

      <td style={{ textAlign: "left" }}>
        30 days
      </td>

      <td style={{ textAlign: "left" }}>

      </td>

      <td style={{ textAlign: "left" }}>
        latestDeliveryDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Plantpassport
      </td>

      <td style={{ textAlign: "left" }}>
        Additional information
      </td>

      <td style={{ textAlign: "left" }}>
        3 years
      </td>

      <td style={{ textAlign: "left" }}>
        3 years
      </td>

      <td style={{ textAlign: "left" }}>
        creationDateTime
      </td>
    </tr>

    <tr>
      <td style={{ textAlign: "left" }}>
        Delivery notes (PDF)
      </td>

      <td style={{ textAlign: "left" }}>
        Additional information
      </td>

      <td style={{ textAlign: "left" }}>
        7 days
      </td>

      <td style={{ textAlign: "left" }}>

      </td>

      <td style={{ textAlign: "left" }}>
        deliveryDateTime
      </td>
    </tr>
  </tbody>
</Table>
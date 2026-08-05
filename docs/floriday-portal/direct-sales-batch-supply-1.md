---
updatedAt: 2025-04-28T13:56:34.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Direct sales Batch Supply

## Target audience

* Supplier organizations;
* Customer organizations.

<br />
## Purpose

* Enables creating, updating and deleting batch supply lines by Supplier organizations;
* Enables getting batch sales supply-lines for placing purchase orders or sales orders by Customer organizations.

<br />
## Guidance

For Business Rules and differences between different supply types please refer to [Supply type overview](https://developer.floriday.io/docs/supply-type-overview).

**Option 1 Price calculation & availability filters in Floriday: batch base-supply**\
User sets the customer specific price calculation and availability filters in the Floriday application. By adding a base price for price calculation, a batch and period, batch base supply is created.

**Option 2 Price calculation & availability filters in Supplier application: batch supply-lines**\
User sets the customer specific price calculation and availability filters in the supplier ERP, batch supply-lines are created.

<br />
<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>

      </th>
      <th>
        Batch base-supply
      </th>
      <th>
        Batch supply-lines
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>

      </td>
      <td>
        Option 1
      </td>
      <td>
        Option 2
      </td>
    </tr>
    <tr>
      <td>
        Customer specific pricegroups & availability filters
      </td>
      <td>
        <strong>Floriday application</strong>
      </td>
      <td>
        <strong>Supplier application</strong>
      </td>
    </tr>
    <tr>
      <td>
        Differences
      </td>
      <td>
        \+less load for supplier application<br />
        +less complexity in supplier application<br />
        -no customization of price calculation and availability.
      </td>
      <td>
        \-more load for supplier application<br />
        -more complexity in supplier application<br />
        +customization of price calculation and availability.
      </td>
    </tr>
  </tbody>
</Table>

<br />
> 👍 Checking direct sales supply in Floriday 'Supply Overview'
>
> Users and developers can view created, updated and deleted direct sales supply in the Floriday application by going to [Direct sales > Supply overview](https://app.floriday.io/supply/direct-sales/supply-overview). See the image below for an example.

<br />
![](https://files.readme.io/c92559d-Screenshot_2021-02-20_at_03.14.08.png "Screenshot 2021-02-20 at 03.14.08.png")

<br />
> 👍 Checking direct sales supply in Floriday 'My Shop'
>
> Users and developers can check direct sales supply in the Floriday application in 'My Shop' as it will be shown to the customers.

<br />
## Implementation model

![](https://files.readme.io/aa1045c-Screenshot_2022-02-14_at_22.40.57.png "Screenshot 2022-02-14 at 22.40.57.png")

<br />
## Interaction model

![](https://files.readme.io/6168868-Screenshot_2022-02-14_at_22.40.31.png "Screenshot 2022-02-14 at 22.40.31.png")

<br />
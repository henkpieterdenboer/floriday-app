---
updatedAt: 2026-06-15T07:05:48.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Base Supply

## Supported scenarios

* Receive supply lines;
* Create base supply;
* Create supply lines;
* Update Base Supply;
* Toggle supply lines.

For the business rules concerning base supply, please read [Direct sales Batch Supply](https://developer.floriday.io/docs/direct-sales-batch-supply-1).

<br />

## Receive supply lines

**Purpose:**\
Get supply lines added or changed in Floriday from Floriday in supplier application.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted (base) supply with or without one or more specific customer organizations in Floriday.

<br />

**Process steps:**

<table>
  <thead>
    <tr>
      <th>NR</th>
      <th>Process step</th>
      <th>API call / scenario</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>1</td>
      <td>Sync supply lines with limit and latest sequence number. Supply has supply type 'batch price'.</td>
      <td><em><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLinesBySequenceNumber">GetSupplyLinesBySequenceNumber</a></em></td>
    </tr>

    <tr>
      <td>Once-only</td>
      <td>Get supply lines with all product specifications and one or more packing options, included services, trade period, customer organizations, trading terms and supply type (batch price).</td>
      <td><em><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLines">GetSupplyLines</a></em></td>
    </tr>

    <tr>
      <td>After creating, updating or deleting supply.</td>
      <td>Get supply line by supply lineID with all product specifications and one or more packing options, included services, trade period, customer organizations, trading terms and supply type (batch price).</td>
      <td><em><a href="https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLineById">GetSupplyLineById</a></em></td>
    </tr>

    <tr>
      <td>2</td>
      <td>Process the retrieved supply lines in the supplier application with their unique supply line ID. The supply lines will be added or updated in the supplier application.\
      The supply lines are a basis to create and process sales orders.</td>

      <td />
    </tr>
  </tbody>
</table>

<br />

<br />

## Create Base Supply

**Purpose:**\
Create base supply based on batches in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted one or more price conditions for one or multiple groups of customer organizations (price groups) for direct sales in Floriday;
* The user has inserted direct sales base price and period for the batch in the supplier application.

<br />

**Process steps:**

| NR | Process step                                                                                | API call / scenario                                                                                                     |
| :- | :------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| 1  | Add base price, period for the batch.                                                       | *[EditBaseSupply](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/EditBaseSupply)* |
| 2  | Supply lines will be created in Floriday based on price conditions and delivery conditions. |                                                                                                                         |
| 3  | Supply lines will be allocated in the customer channels.                                    |                                                                                                                         |
| 4  | Supply lines can be retrieved by the Customer organizations from the Customer channel.      |                                                                                                                         |

<br />

<br />

## Create supply lines

**Purpose:**\
Create supply lines based on batches in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted his prices with commercial available quantity for a period in the supplier application.

<br />

**Process steps:**

| NR | Process step                                                                                           | API call / scenario                                                                                                   |
| :- | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| 1  | Add specific price, period and commercial available quantity for the batch.                            | *[AddSupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/AddSupplyLine)* |
| 2  | Supply lines will be created or updated in Floriday based on price conditions and delivery conditions. |                                                                                                                       |
| 3  | Supply lines can be retrieved by the Customer organizations from the Customer channel.                 |                                                                                                                       |

<br />

<br />

## Update Base Supply

**Purpose:**\
Update base supply based on batches in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted one or more price conditions for one or multiple groups of customer organizations (price groups) for direct sales in Floriday;
* The user has updated direct sales base price and period for the batch in the supplier application.

**Process steps:**

| NR | Process step                                                                                | API call / scenario                                                                                                             |
| :- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Update base price for the batch.                                                            | *[SetSupplyLinePrice](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/SetSupplyLinePrice)* |
|    | Supply lines will be updated in Floriday based on price conditions and delivery conditions. |                                                                                                                                 |
| 2  | Supply lines will be updated in the customer channels.                                      |                                                                                                                                 |
| 3  | Supply lines can be retrieved by the Customer organizations from the Customer channel.      |                                                                                                                                 |

<br />

<br />

## Toggle supply lines

**Purpose:**\
New: Toggle supply line status availability in Floriday channels for customers.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The user has inserted supply lines in Floriday;
* The supplier application has the latest update of supply lines;
* The supplier application or user toggles the supply line availability in the supplier application.

<br />

**Process steps:**

| NR | Process step                                                                                  | API call / scenario                                                                                                               |
| :- | :-------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Toggle a specific supply line status to available or not available.                           | *[SetSupplyLineStatus](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/SetSupplyLineStatus)* |
|    | Supply line status will be set to available or not available in Floriday.                     |                                                                                                                                   |
| 2  | Supply line status will be set to  available or not available in the Floriday channels.       |                                                                                                                                   |
| 3  | Supply lines status can be retrieved by the Customer organizations from the Customer channel. |                                                                                                                                   |
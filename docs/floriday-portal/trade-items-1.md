---
updatedAt: 2026-06-15T14:59:22.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade items

## Supported trade item scenarios

* Receiving trade items;
* Selecting and deselecting trade items;
* Receiving selected trade items.

For the business rules concerning trade items, please read [Trade items](https://developer.floriday.io/docs/trade-items-2) and [Selected trade items](https://developer.floriday.io/docs/selected-trade-items).

<br />

***

## Receiving trade items

**Purpose:**\
Synchronise trade items from Floriday in customer application.

<br />

**Prerequisites:**

* The customer application has the latest update of connections.

<br />

| NR | Process step                                                                                                                                                                                                           | API call / scenario                                                                                                                                  |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Receive all trade items by SupplierId.                                                                                                                                                                                 | [*GetTradeItems*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItems)                                 |
| 2  | Receive all trade items by TradeItemId.                                                                                                                                                                                | [*GetTradeItemById*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemById)                           |
| 3  | Receive all trade items by TradeItemId and version.                                                                                                                                                                    | *[GetTradeItemByIdAndVersion](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemByIdAndVersion)*       |
| 4  | Receive your maximum found sequence number.                                                                                                                                                                            | [*GetTradeItemsMaxSequence*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemsMaxSequence)           |
| 5  | Receive modified trade items from all the suppliers in your network with a maximum of 1000 based on your given sequence number. Repeat until your given  sequence number is the same as maximum found sequence number. | [*GetTradeItemsBySequenceNumber*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemsBySequenceNumber) |

<br />

***

## Selecting trade items via the Floriday API

> 📘 Selecting trade items
>
> There are four ways to select trade items as a customer:
>
> * Select trade items on the platform Floraxchange by adding the trade item to a week list;
> * Select trade items on the buyers platform Flordiday by marking the trade item as a favourite;
> * Enable suppliers to mark their trade items as your selected trade items by enabling this in the system settings on the Floriday platform;
> * Select trade items via the Floriday API.

<br />

**Purpose:**\
Selecting trade items from Floriday suppliers in customer application.

<br />

**Prerequisites**\
All trade items of the connected suppliers have been received and saved;

<br />

| NR | Process step                                                                     | API call / scenario                                                                                                                                                                              |
| :- | :------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Select a specific trade item by using the right TradeItemId.                     | [*AddSelectedTradeItem*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/AddSelectedTradeItem)                                                       |
| 2  | Add a packing configuration to the selected trade item.                          | [*SetSelectedTradeItemPackingConfiguration*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/SetSelectedTradeItemPackingConfiguration)               |
| 3  | Set the SelectedTradeItemPackingConfiguration as primary for the given supplier. | [*SetSelectedTradeItemPackingConfigurationPrimary*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/SetSelectedTradeItemPackingConfigurationPrimary) |

<br />

***

## Deselecting trade items via the Floriday API

**Purpose:**\
Deselecting trade items from Floriday suppliers in customer application.

<br />

**Prerequisites**\
Trade items of the connected suppliers have been received and saved en used for deselection.

<br />

| NR | Process step                                                    | API call / scenario                                                                                                                                |
| :- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Deselect a specific trade item by using the right TradeItemId.  | [*DeleteSelectedTradeItem*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/DeleteSelectedTradeItem)   |
| 2  | Deselect multiple trade items by using the right TradeItemId's. | [*DeleteSelectedTradeItems*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/DeleteSelectedTradeItems) |

<br />

***

## Receiving selected trade items

**Purpose:**\
Synchronise selected trade items from Floriday in customer application.

<br />

<Table align={["left","left","left"]}>
  <thead>
    <tr>
      <th>
        NR
      </th>

      <th>
        Process step
      </th>

      <th>
        API call / scenario
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        1
      </td>

      <td>
        Receive your maximum found sequence number.
      </td>

      <td>
        [_GetSelectedTradeItemsMaxSequence_](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/GetSelectedTradeItemsMaxSequence)
      </td>
    </tr>

    <tr>
      <td>
        2
      </td>

      <td>
        Receive the selected trade items based on the provided sequence number.
      </td>

      <td>
        [_GetSelectedTradeItemsBySequenceNumber_](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SelectedTradeItems/GetSelectedTradeItemsBySequenceNumber)
      </td>
    </tr>

    <tr>
      <td>
        3
      </td>

      <td>
        Receive the modified selected trade items based on the provided sequence number by filtering out all the non selected trade items with the parameter _PostFilterSelectedTradeItems_ on true.
      </td>

      <td>
        [_GetTradeItemsBySequenceNumber_](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemsBySequenceNumber)
      </td>
    </tr>

    <tr>
      <td>
        4
      </td>

      <td>
        * All the non-selected trade items will be filtered out of the completed call;
      </td>

      <td>

      </td>
    </tr>
  </tbody>
</Table>
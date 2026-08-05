---
updatedAt: 2026-06-12T09:03:24.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Collections

This page describes how to implement the Collection feature, which allows supplier organization to categorize trade items into groups.

To categorize trade items, supplier organizations can assign trade items to one or more Collections. This allows supplier organizations to customize how their supply lines are portrayed in their Shop. The Shop is a separate page in the Floriday application where the supplier organization's supply lines are gathered in one place. Customer organizations that use the Floriday application may view a supplier organization's Shop to view all their supply on one page.

Without Collections, supply lines in the Shop are only shown by trade item, which can clutter the view of the Shop. With Collections, supply lines are categorized in seperate groups with their own name, description, image and/or theme. This allows supplier organizations to present their supply lines to customers in a clear and professional way.

For more information on the Shop and how Collections are used and presented in the Floriday application, read [this Helpcentre article](https://helpcenter.floriday.com/en/articles/10515728-set-up-your-shop-with-collections).

<br />

## Supported scenarios

* Create, update and delete collections.
* Sync collections.
* Set sort index for a collection.
* Add and remove trade items from collections.

***

<br />

## Create, update and delete Collections

<br />

<Tabs>
  <Tab title="Create">
    #### Guidance

    These steps allow you to create a Collection for use in the Shop within the Floriday application. Collections are created with the [AddCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/AddCollection) endpoint and contains the following properties. Properties that may require further explanation are listed below.

    ```json
    {
      "collectionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "string",
      "description": "string",
      "photos": [
        {
          "photoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "sortIndex": 2147483647
        }
      ],
      "isVisible": true,
      "isHighlighted": true,
      "t17ThemeValueCodes": [
        "string"
      ],
      "usesTradeItemSpecificPackingConfiguration": true
    }
    ```

    * `name`: Used to set the name of a Collection.
    * `description`: Used to set a description for a Collection.
    * `sortIndex`: Is used to set the order in which Collections are shown. Value 0 is shown first, value 1 is shown second, etc.
    * `isVisible`: Allows you to hide or show Collections to customer organizations. Supplier organizations may choose to only use Collections to manage their own supply lines in the Floriday application and might not want the Collection to be visible to customer organizations.
    * `isHighlighted`: Allows you to highlight certain Collections. These collections are more prominently shown than non-highlighted Collections.
    * `t17ThemeValueCodes`: Allows you to set a Theme for a Collection. These are seasonal or holiday related themes which can be a powerful tool to highlight supply lines specifically created for those themes. These themes are based on the VBN product characteristic T17.
    * `usesTradeItemSpecificPackingConfiguration`:
      * Setting this property to `true` enables supplier organizations to change the packing configuration of Trade items added to Collections. Note that this currently can only be changed in the Floriday application. With this property set to `true`, the Shop only shows available supply lines for trade items including the same packing configuration set for the trade items in the Collection.
      * Setting this property to `false` disables supplier organizations to change the packing configuration of Trade items added to Collections. With this property set to `false`, the Shop shows the available supply lines of all trade items in the Collection.

    > 📘 VBN Product Characteristics
    >
    > Collections may be created with Themes based on the VBN product characteristic T17. For a complete implementation of Collections, access to the Floricode codelist: **VBN product characteristics**  is required.
    >
    > Read [General starting conditions](https://developer.floriday.io/update/docs/general-starting-conditions#/) for more information, including a link to the Floricode page with regards to Floricode codelists.

    ***

    <br />

    #### Process steps

    <br />

    | Nr | Process step                                                 | API Call / Scenario                                                                                                 |
    | :- | :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
    | 1  | Create a new Collection.                                     | [AddCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/AddCollection) |
    | 2  | The Collection is added for use in the Floriday application. |                                                                                                                     |

    ***
  </Tab>

  <Tab title="Update">
    #### Guidance

    These steps allow you to update an existing Collection based on `collectionId`. Collections are updated with the [EditCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/EditCollection) endpoint and contains the following properties:

    ```json
    {
      "name": "string",
      "description": "string",
      "photos": [
        {
          "photoId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "sortIndex": 2147483647
        }
      ],
      "isVisible": true,
      "isHighlighted": true,
      "t17ThemeValueCodes": [
        "string"
      ],
      "usesTradeItemSpecificPackingConfiguration": true
    }
    ```

    <br />

    * `sortIndex`: Is used to set the order in which Collections are shown. Value 0 is shown first, value 1 is shown second, etc.
    * `isVisible`: Allows you to hide or show Collections to customer organizations. Supplier organizations may choose to only use Collections to manage their own supply lines in the Floriday application and might not want the Collection to be visible to customer organizations.
    * `isHighlighted`: Allows you to highlight certain Collections. These collections are more prominently shown than non-highlighted Collections.
    * `t17ThemeValueCodes`: Allows you to set a Theme for a Collection. These are seasonal or holiday related themes which can be a powerful tool to highlight supply lines specifically created for those themes. These themes are based on the VBN product characteristic T17.
    * `usesTradeItemSpecificPackingConfiguration`:
      * Setting this property to `true` enables supplier organizations to change the packing configuration of Trade items added to Collections. Note that this currently can only be changed in the Floriday application. With this property set to `true`, the Shop only shows available supply lines for trade items including the same packing configuration set for the trade items in the Collection.
      * Setting this property to `false` disables supplier organizations to change the packing configuration of Trade items added to Collections. With this property set to `false`, the Shop shows the available supply lines of all trade items in the Collection.

    > 📘 VBN Product Characteristics
    >
    > Collections may be created with Themes based on the VBN product characteristic T17. For a complete implementation of Collections, access to the Floricode codelist: **VBN product characteristics**  is required.
    >
    > Read [General starting conditions](https://developer.floriday.io/update/docs/general-starting-conditions#/) for more information, including a link to the Floricode page with regards to Floricode codelists.

    ***

    <br />

    #### Process steps

    | Nr | Process step                                           | API Call / Scenario                                                                                                   |
    | :- | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
    | 1  | Update an existing Collection based on collectionId.   | [EditCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/EditCollection) |
    | 2  | The Collection is updated in the Floriday application. |                                                                                                                       |

    ***
  </Tab>

  <Tab title="Delete">
    #### Guidance

    These steps allow you to delete an existing Collection based on `collectionId`. Collections are deleted with the [DeleteCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/DeleteCollection) endpoint.

    ***

    <br />

    #### Process steps

    | Nr | Process step                                             | API Call / Scenario                                                                                                 |
    | :- | :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
    | 1  | Delete an existing Collection based on collectionId.     | [AddCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/AddCollection) |
    | 2  | The Collection is removed from the Floriday application. |                                                                                                                     |

    ***
  </Tab>
</Tabs>

***

<br />

## Sync Collections

<br />

#### Guidance

Syncing collections allow you to keep a supplier organization's Collections up to date.

***

<br />

#### Process steps

| Nr | Process steps                                                                                                | API Call / Scenario                                                                                                                                   |
| :- | :----------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Retrieve highest generated sequence number found in Collections.                                             | [GetCollectionsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/GetCollectionsMaxSequence)           |
| 2  | Retrieve changed Collections since last sequence number. Repeat step until all Collections are synchronised. | [GetCollectionsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/GetCollectionsBySequenceNumber) |

***

<br />

## Add and remove trade items from Collections

<br />

<Tabs>
  <Tab title="Add trade items">
    <br />

    #### Guidance

    <br />

    This step allows a supplier organization to add trade items to a Collection. Note that a trade item may exist in multiple Collections at once.

    Trade items may be added using the [AddTradeItemsToCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/AddTradeItemsToCollection) endpoint and contains the following properties. Properties that may require further explanation are listed below.

    ```json
    [
      {
        "tradeItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "isHighlighted": true,
        "packingConfiguration": {
          "piecesPerPackage": 2147483647,
          "packagesPerLayer": 2147483647,
          "layersPerLoadCarrier": 2147483647,
          "package": {
            "vbnPackageCode": 999,
            "customPackageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          },
          "loadCarrier": "NONE",
          "allowedCustomerOrganizationIds": [
            "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          ]
        }
      }
    ]
    ```

    <br />

    * `isHighlighted`: Allows you to highlight certain Collections. These collections are more prominently shown than non-highlighted Collections.

    ***

    <br />

    #### Process steps

    | Nr | Process steps                                          | API Calls / Scenario                                                                                                                        |
    | :- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
    | 1A | Add a trade item to a Collection based on collectionId | [AddTradeItemsToCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/AddTradeItemsToCollection) |

    <br />

    ***
  </Tab>

  <Tab title="Remove trade items">
    This step allows a supplier organization to remove trade items from a Collection.

    <br />

    #### Process steps

    | Nr | Process steps                                               | API Calls / Scenario                                                                                                                          |
    | :- | :---------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
    | 1A | Remove a trade item from a Collection based on collectionId | [DeleteCollectionTradeItems](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/DeleteCollectionTradeItems) |

    ***
  </Tab>
</Tabs>

***

<br />

## Set sort index for a collection

<br />

#### Guidance

The sort index allows a supplier organization to determine the order in which Collections are shown to customer organizations.

***

<br />

#### Process steps

<br />

| Nr | Process steps                                                                                                                                                                    | API Call / Scenario                                                                                                                         |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Set the sort index based on collectionId. A Collection with sortIndex 0 will be shown at the top of the list of Collections. A Collection with sortIndex 1 is shown second, etc. | [SetSortIndexForCollection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Collections/SetSortIndexForCollection) |
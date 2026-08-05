---
updatedAt: 2025-04-28T11:24:02.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# General starting conditions

The following general starting conditions are applicable.

| Nr | Condition                                                                                                               |
| :- | :---------------------------------------------------------------------------------------------------------------------- |
| 1  | The supplier or customer application has an updated GLN company code codelist from **Floricode**.                       |
| 2  | The supplier or customer application has an updated VBN productcode codelist from **Floricode**.                        |
| 3  | The supplier or customer application has an updated VBN product characteristics codelist from **Floricode**.            |
| 4  | The supplier or customer application has an updated VBN product regulatory characteristics codelist from **Floricode**. |
| 5  | The supplier or customer application has an updated VBN packaging codelist from **Floricode**.                          |

<br />

> 🚧 Floricode codelists
>
> The above mentioned Floricode codelists are available from Floricode. Floricode manages and distributes our horticultural sector masterdata (e.g. productcodes, company codes, location codes, etc.).
>
> **Important:** Access to these codelists need to be purchased from Floricode. Prices may differ per codelist.
>
> See <https://www.floricode.com/en-us/distribution/downloading-codes> for more information or use the Contact information at the bottom of the Floricode web site.

***

<br />

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>
        Nr
      </th>

      <th>
        Condition
      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        6
      </td>

      <td>
        The supplier or customer organization is registered as an organization on Floriday.
      </td>
    </tr>

    <tr>
      <td>
        7
      </td>

      <td>
        The (mandated) key user with all permissions of a supplier or customer organization is registered as a user on Floriday. Further referred to as the user.
      </td>
    </tr>

    <tr>
      <td>
        8
      </td>

      <td>
        The supplier or customer application has a valid ClientID and client secret ID (not applicable for PKCE flow) from Floriday. See [Authorization](https://developer.floriday.io/docs/authorization) to learn more.
      </td>
    </tr>

    <tr>
      <td>
        9
      </td>

      <td>
        The supplier or customer application has been given all necessary permissions by the user (by default all permissions will be given). For more information see [Authorization profiles](https://developer.floriday.io/docs/authorization-profiles).
      </td>
    </tr>

    <tr>
      <td>
        10
      </td>

      <td>
        The user has a valid API-key from Floriday entered in the supplier application.
      </td>
    </tr>

    <tr>
      <td>
        11
      </td>

      <td>
        The user has agreed to the terms & conditions of Floriday.
      </td>
    </tr>

    <tr>
      <td>
        12
      </td>

      <td>
        The user has agreed to the terms & conditions of the customer’ channels (eg. FloraMondo, FloraXchange, auction) in Floriday.
      </td>
    </tr>

    <tr>
      <td>
        13
      </td>

      <td>
        The user of the supplier organization has set up their warehouse location(s) in Floriday. (Warehouse locations are registered with Royal Flora Holland and subsequently in Floricode, after which they are made available in Floriday.) 
      </td>
    </tr>

    <tr>
      <td>
        14
      </td>

      <td>
        The user of the supplier organization has configured their delivery conditions in Floriday.
      </td>
    </tr>

    <tr>
      <td>
        15
      </td>

      <td>
        The key user of the supplier organization has set the Floriday application for managing his trade-items. For migration purposes the user can choose between managing trade-items in the FX application (temporarily) or Floriday application. Floriday can only guarantee proper supplier application integration if Floriday has reading and writing permissions on all Trade-items.
      </td>
    </tr>

    <tr>
      <td>
        16
      </td>

      <td>
        The supplier or customer organization have at least one GLN company and location code from Floricode.  

        If no GLN location code is available, a new location code can be requested at Floricode by the Supplier or Customer organization. Although not preferable, the Supplier organization can start with a temporary GLN location code for its warehouse and the Customer can use an address as a delivery location.
      </td>
    </tr>
  </tbody>
</Table>

***
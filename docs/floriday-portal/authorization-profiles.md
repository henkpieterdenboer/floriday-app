---
updatedAt: 2026-06-29T07:40:00.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Authorization profiles

## Authorization profiles

In general there are two main authorization profiles:

1. **Supplier (Supplier API)**: The default authorization profile for applications of suppliers, using supplier permissions to the Floriday modules and features. All Supplier API endpoints can be accessed.
2. **Customer (Customer API)**: The default authorization profile for applications of customers, using customer permissions to the Floriday modules and features. All Customer API endpoints can be accessed.

An additional authorization profile is available for External Warehouses via the Supplier API:

3. **External Warehouse (Supplier API)**: The authorization profile for applications of fulfillment by 'External warehouses' for other suppliers (e.g. import agents, grower organizations).\
   These applications have permissions to the Floriday modules and features on a logistic warehouse-level. Therefore, supplier API endpoints that can be accessed by this authorization profile are limited. See [Authorization External Warehouses](https://developer.floriday.io/docs/authorization#authorization-external-warehouses) for more information.

***

<br />

## Scopes

Together with the provision of the JWT; the period of validity and the permissions should be provided by means of 'scopes'. The scopes (permissions) apply to the authorization for organizations to Floriday modules, features and resources.

The scopes should always be used when making API calls. Please refer to the swagger docs for the scopes of every endpoint.

> 📘 Scopes
>
> Take note that the `role:app` is required for each call.

![](https://files.readme.io/e80f698-Screenshot_2022-08-02_at_10.42.05.png "Screenshot 2022-08-02 at 10.42.05.png")

***

<br />

## Authorization External warehouses

External warehouses have the following permissions.

| Module              | Permissions                                     | Resources                                                                                                                                                                 | External Warehouse |
| :------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- |
| catalog             | Read permissions for the catalog module         | additional-services commercial service types custom packing trade-items                                                                                                   | ✅  *(1)*           |
| delivery-conditions | Read permissions the delivery conditions module | delivery condition sets                                                                                                                                                   | ✅                  |
| fulfillment         | Read permissions for the fulfillment module     | delivery orders delivery order stickers fulfillment orders fulfillment order corrections fulfillment orders inbound fulfillment order logistic-label fulfillment requests | ✅                  |
| fulfillment         | Write permissions for the fulfillment module    | delivery orders goods movement delivery orders auction fulfillment orders fulfillment orders mark goods receipt fulfillment order corrections fulfillment requests        | ✅                  |
| organization        | Read permissions for the organization module    | organizations warehouses                                                                                                                                                  | ✅                  |
| sticker             | Read permissions for the sticker module         | customer stickers customer sticker metadata                                                                                                                               | ✅                  |
| sticker             | Write permissions for the sticker module        | customer stickers mark handled                                                                                                                                            | ✅                  |
| stock               | Read permissions for batches                    | batches                                                                                                                                                                   | ✅ *(2)*            |
| stock               | Write permissions for the batches               | batches                                                                                                                                                                   | ✅ *(2)*            |
| webhooks            | Write permissions for webhooks                  | webhooks                                                                                                                                                                  | ✅                  |

*(1)* External warehouses are authorized to have read access for the catalog resources. They can only retrieve catalog resource by ID, based on batches that are to be delivered to, from or located on the external warehouse.\
*(2)* External warehouses are authorized to have read and write access for the 'batches' resource. Batches need to be delivered to, from or located on the external warehouse. External warehouses are authorized to get, correct or repack batches.
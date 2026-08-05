---
updatedAt: 2026-06-12T07:40:43.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Swagger docs explanation and tools

## Explanation

The Swagger docs are primarily intended to communicate the Floriday API endpoints for developers. They can be found here:

* [Swagger docs - Floriday Supplier API](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html)
* [Swagger docs - Floriday Customer API](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html)

> 👍 Getting started
>
> A direct link to a coding tutorial screencast (NL) can be found at the top of each Swagger docs page.

***

<br />

**The Swagger docs:**

* are available for both the Supplier and Customer API.
* are versioned and have a versionID YEARv1 or YEARv2.
* have a URL.
* will be promoted according to the release process lifecycle.
  * From Alpha to Beta, from Beta to Main, from Main to 'To be deprecated' and from 'To be deprecated' to 'Deprecated' on the specified dates.
* are applicable for staging and live.

<br />

<br />

![](https://files.readme.io/dac6821-Screenshot_2022-02-08_at_14.20.25.png "Screenshot 2022-02-08 at 14.20.25.png")

<br />

***

<br />

**Swagger endpoints:**

* are grouped by Floriday module(s) or function(s) e.g. Sales orders, Supply lines, etc.
* have different methods such as: POST, PUT, PATCH, GET and DELETE.
* include a brief functional description.
* may include a brief instruction.
* may include parameters, either mandatory(\*) or optional.
* consist of auto-generated examples by Swagger.
* include scopes such as 'catalog:read'.
* may have a rate limit. If not mentioned, fair use is applicable.
* consist of object-models of the 'body' and 'responses' with either mandatory(\*) or conditional/optional fields.

<br />

![](https://files.readme.io/7eb0fb9-Screenshot_2022-02-08_at_15.14.53.png "Screenshot 2022-02-08 at 15.14.53.png")

***

<br />

## Editor.swagger.io

The URL that refers to the API specification can be easily imported and translated to different clients by using [editor.swagger.io](https://editor.swagger.io).

***

<br />

## Postman

With [Postman](https://www.postman.com/), a mockup or test client can be created by importing the URL, adding the API-key and client credentials and configuring parameter values. Please refer to [Postman documentation](https://www.postman.com/api-documentation-tool/) for more information.

<br />
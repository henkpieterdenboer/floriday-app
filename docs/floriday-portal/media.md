---
updatedAt: 2026-06-12T08:02:56.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Media

## Supported scenarios

* Create media

For the business rules concerning media, please read [Business Rules - Media](https://developer.floriday.io/docs/media-2).

***

<br />

## Create Media

<br />

#### Purpose

Create an image of the supplier organization trade-item or batch in the Floriday image repository.

***

<br />

#### Prerequisites

* The user has inserted images in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                                                                                   | API call / scenario                                                                                   |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| 1  | Create an image in Floriday with a unique mediaId.                                                                                                                                                                                             | *[AddImage](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Media/AddImage)* |
|    | After Supplier ERP has added an image with an mediaID in Floriday, the supplier ERP creates a Floriday image media URL: For staging: **<https://image.staging.floriday.io/mediaId.jpg>** For live: **<https://image.floriday.io/mediaId.jpg>** |                                                                                                       |
|    | Process the image media in the supplier application.                                                                                                                                                                                           |                                                                                                       |
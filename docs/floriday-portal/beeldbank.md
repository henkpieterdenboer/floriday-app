---
updatedAt: 2025-09-16T10:55:32.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Image bank (Beeldbank)

* Beeldbank images used are now also available via Floriday, by using the <https://image.floriday.io/beeldbank/{beeldbankid}> URL. The Floriday URL is no longer case sensitive, whereas the beeldbank URL used to be case sensitive and only supported ids that were in upper case.
* Both the customer as well as the suppliers API received new endpoints to request a `beeldbankid` from an `imageid` and vice versa. The respective endpoints are `GetBeeldbankIdFromImage` and `GetImageFromBeeldbankId`. The endpoints can be found in the swagger pages of the Floriday API versions 2025v1 and higher.
* We are currently in the process of changing the beeldbank URL to request photos through a DNS change. Once the DNS settings have resolved everywhere, the photos will be uploaded from the old URL (<https://beeldbankfotos.royalfloraholland.com/foto/volledig/{beeldbankid}>) to the new URL (<https://image.floriday.io/beeldbank/{beeldbankid}>).
* After the DNS settings have resolved, photos will no longer be retrievable through the beeldbank SOAP service, although uploading to the soap service will still be temporarily possible.
* We have also added a check on the file hash of the image that must be added via the AddImage endpoint. This checks if the same organization has uploaded a duplicate image. In that case we will return the imageId of the already existing image, without uploading a new image.

<br />
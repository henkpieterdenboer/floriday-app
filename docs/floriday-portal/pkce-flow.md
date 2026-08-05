---
updatedAt: 2025-04-28T11:05:04.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Oauth2 Authorization code with PKCE flow

If the calling client cannot keep the credentials secret, the 'Authorization Code with PKCE' is the recommended flow to use. This flow is primarily used by builders of native apps for the Floriday application.

## Guidelines

* A client ID is required:
  * Client ID: XXXXXXXXXXXX

***

<br />

## JSON web token

After registration, the Client ID is provided per application by email.

![](https://files.readme.io/2304991-APIv03-Authenticatie_PKCE_registratie.JPG "APIv03-Authenticatie_PKCE_registratie.JPG")

<br/>
<br/>

In this flow, after the user has entered his login details, the app receives a code after sending the Client ID and challenge with a redirect URL.

![](https://files.readme.io/8e0660b-APIv03-Authenticatie_PKCE_code.JPG "APIv03-Authenticatie_PKCE_code.JPG")

<br/>
<br/>

This code can then be safely exchanged for a JWT (JSON web token) with a limited period of validity (1 hour). This token is accompanied by a refresh token, which can subsequently be used to obtain a new token with a longer validity period (7 days).

![](https://files.readme.io/84683dd-APIv03-Authenticatie_token.JPG "APIv03-Authenticatie_token.JPG")

<br/>
<br/>

This JWT is an encrypted JSON message. To inspect the contents and learn more about this token, please visit [www.jwt.io](http://jwt.io).

By using the [API-key](https://developer.floriday.io/docs/api-key) alongside the JWT-token, the user's data can be accessed.

![](https://files.readme.io/de915af-APIv03-Authenticatie_ClientCredentials_Data.JPG "APIv03-Authenticatie_ClientCredentials_Data.JPG")

<br/>
<br/>

The implementation will then look as follows:

![](https://files.readme.io/c8197fb-APIv03-Authenticatie_PKCE_overview.JPG "APIv03-Authenticatie_PKCE overview.JPG")

<br />

More information can be found on the [Okta developer section](https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main/).
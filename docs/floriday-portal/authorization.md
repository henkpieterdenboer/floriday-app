---
updatedAt: 2025-10-22T08:03:04.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Authorization

Once your [client application](https://developer.floriday.io/docs/register-client-application) has been approved, your client will be registered as an application in Floriday. After a succesful registration, we will supply the required Client credentials to get started.

To gain access to the features of Floriday and the data of your end user(s), you will need to set up authorization for your client. For this purpose, an authorization framework according to the OAuth2 standard and an API key is required.

***

<br />

### OAuth2 Frameworks

We currently support two different OAuth2 flows:

1. [Oauth2 Client credentials flow](https://developer.floriday.io/docs/client-credentials-flow) + [API key](https://developer.floriday.io/docs/api-key)
2. [Oauth2 Authorization code with PKCE flow](https://developer.floriday.io/docs/pkce-flow)

In practice, most applications use the Client Credentials flow. The most important condition is whether the application is able to keep the Client Credentials secret.

<br />

<Image border={false} src="https://files.readme.io/66f9cfa-APIv03-Floridayauthenticatie.JPG" title="APIv03-Floridayauthenticatie.JPG" />

***

<br />

### Generating an API key

Once a client application has been registered in Floriday, an end user may generate an API key in the Floriday application. The end user does so by logging into Floriday and going to Settings > Apps & Integrations.

The end user can search for your application in the list on this page, open the application and click the **Add application** buttong to generate an API key.

See the documentation page [API key](https://developer.floriday.io/docs/api-key) for more information.
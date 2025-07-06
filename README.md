# Sitecore XM Cloud to Coveo Push API

This project provides a **Next.js API route** that pushes Sitecore XM Cloud content to a **Coveo Push Source**. It supports full-site and single-item indexing, with flexible control over templates, components, and fields — ideal for headless, cloud-native Sitecore implementations.

---

## Features

- Push **all site items** using the Sitemap Service
- Push a **specific item** via `itemId`
- Filter content by **template**
- Skip items marked as `DoNotIndex`
- Extract data only from **selected components/fields**
- Include only **specific page-level fields**
- Works with **Sitecore XM cloud webhooks** (on `publish:end` or `expeirence edge wehbook`)
- Compatible with **Vercel Cron Jobs** or any scheduled runner

---

## API Endpoint

```http
POST /api/coveo/push
```

## Query Parameters:

| Param     | Description                             |
| --------- | --------------------------------------- |
| `pushAll` | Push all site items via Sitemap Service |
| `itemId`  | Push a specific Sitecore item by ID     |

## Environment Setup:
Add the following variable in .env file:


**COVEO_PUSH_URL**=https://api.cloud.coveo.com/push/v1/organizations/{orgid}/sources/{srcid}/documents<br>
**COVEO_ORG_ID**={Your coveo Organization Id}<br>
**COVEO_SOURCE_ID**={Your coveo Source Id}<br>
**COVEO_API_KEY**={Your coveo push api key}

## Important files and directory:
**src/lib/coveo/coveo-push-service.ts**<br>
**src/pages/api/coveo/** <br>

### Code
**api** - /src/pages/api/coveo/push/index.ts <br>
**helper methods to get the content** - /src/pages/api/coveo/push/content-push-helper.ts <br>
**graphql query to getch the template name** - /src/pages/api/coveo/graphql/template.graphql.ts<br>
**graphql client call to fetch template name** - src/pages/api/coveo/fetchTemplateName.ts



## Configuration:
You can control which templates and fields are used by editing the index.ts(src\pages\api\coveo\push\index.ts):

```
//list the page template names here, all the items based on these templates will be pushed to coveo.
//if template is not present, the item based on that template will not get pushed.
enum TemplateNames {
  Page = 'Page',
}
```
```
//list the components you want to exclude
const excludeComponents: string[] = ['Hero'];

//list the fields to exclude
const excludeFields: string[] = [];

//list the fields to include for page item
const includedPageItemFields: string[] = [];
```

**TemplateNames**: Only items with these template IDs will be indexed.

**excludeFields**: These field values will be skipped during indexing.

**includedPageItemFields**: Only these field values will be used during indexing. This is used for the page item fields.

##  Local Development
1. Clone the repo
2. Set up required .env variables mentioned above
3. Install dependencies:
     ```npm install```
4. Run the application:
    ```npm run start:connected```

## Example Usage

### Push All Items
curl -X POST https://your-app.com/api/coveo/push?pushAll=true

### Push a Specific Item
curl -X POST https://your-app.com/api/coveo/push?itemId={GUID}



## Requirements
1. Sitecore XM Cloud instance
2. Coveo Push Source configured
3. API Key with Push access to your source
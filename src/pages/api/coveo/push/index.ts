import type { NextApiRequest, NextApiResponse } from 'next';
import { layoutServiceFactory } from 'lib/layout-service-factory';
import {
  Field,
  LayoutServiceData,
  MultisiteGraphQLSitemapService,
} from '@sitecore-jss/sitecore-jss-nextjs';

import clientFactory from 'lib/graphql-client-factory';
import {
  pushToCoveo,
  PageDocument,
  deleteOldCoveoItems,
  deleteCoveoItem,
} from 'lib/coveo/coveo-push-service';

import { fetchTemplateNameData$ } from '../fetchTemplateName';
import { collectJsonValues, extractAllFieldValuesFromComponents } from './content-push-helper';

//list the page template names here, all the items based on these templates will be pushed to coveo.
//if template is not present, the item based on that template will not get pushed.
enum TemplateNames {
  Page = 'Page',
}

//list the components you want to exclude
const excludeComponents: string[] = ['Hero'];

//list the fields to exclude
const excludeFields: string[] = [];

//list the fields to include for page item
const includedPageItemFields: string[] = [];

const site = process.env.SITECORE_SITE_NAME ?? '';
const host = process.env.PUBLIC_URL ?? 'http://localhost:3000';
const layoutService = layoutServiceFactory.create(site);

async function getContentForItem(layoutData: LayoutServiceData): Promise<PageDocument | undefined> {
  if (!layoutData?.sitecore?.route?.placeholders) {
    return undefined;
  }

  const renderings = layoutData.sitecore.route.placeholders;

  //extract page item field values
  const pageItemFields = collectJsonValues(
    layoutData.sitecore.route.fields,
    [],
    '',
    [],
    true, // isPageItem
    includedPageItemFields
    //['Title', 'Content'] // includedFields
  );
  const pageitemcontent = pageItemFields.join(' ').trim();
  let content = extractAllFieldValuesFromComponents(renderings, excludeComponents, excludeFields);
  content = pageitemcontent + content;

  return {
    documentId: host + layoutData.sitecore.context.itemPath?.toString().toLowerCase(),
    title: (layoutData.sitecore.route.fields?.Title as Field<string>)?.value,
    id: layoutData.sitecore.route.itemId + '',
    data: content,
    //add image based on the need
  };
}

async function pushAllPages(language: string) {
  const orderingId = new Date().getTime();

  const sitemapService = new MultisiteGraphQLSitemapService({
    clientFactory,
    sites: [site],
  });
  const pages = await sitemapService.fetchExportSitemap(language);

  await Promise.all(
    pages.map(async (p) => {
      const path = '/' + p.params.path.slice(1).join('/');
      const layoutData = await layoutService.fetchLayoutData(path, language);
      if ((layoutData?.sitecore?.route?.fields?.['DoNotIndex'] as Field<boolean>)?.value != true) {
        return getContentForItem(layoutData).then((d) => d && pushToCoveo(d));
      }
    })
  );

  deleteOldCoveoItems(orderingId);
}

interface PublishEvent {
  EventName: string;
  PublisherOptions: PublisherOptions;
  WebhookItemId: string;
  WebhookItemName: string;
}

interface PublisherOptions {
  CompareRevisions: boolean;
  Deep: boolean;
  FromDate: string;
  Mode: string;
  PublishDate: string;
  PublishingTargets: string[];
  RepublishAll: boolean;
  RecoveryId: string;
  SourceDatabaseName: string;
  TargetDatabaseName: string;
  RootItemId: string;
  UserName: string;
  WillBeQueued: boolean;
  Languages: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!req.query.itemId && !req.body.WebhookItemName && !req.query.pushAll) {
    return res.status(500).json({ message: 'Bad request' });
  }

  let language = Array.isArray(req.query.language) ? req.query.language[0] : req.query.language;
  if (!language) {
    language = 'en';
  }

  let itemId = req.query.itemId;
  if (itemId && Array.isArray(itemId)) {
    itemId = itemId[0];
  }

  if (req.body.WebhookItemName == 'Push Coveo Event') {
    const publishEventRequest = req.body as PublishEvent;
    itemId = publishEventRequest.PublisherOptions.RootItemId;
  }

  if (itemId) {
    const templatedata = await fetchTemplateNameData$([itemId, 'en']);

    if (
      !Object.values(TemplateNames).includes(
        templatedata?.templatedetails?.template?.name as TemplateNames
      )
    ) {
      return res.status(200).json({ message: 'This item is not a page template item' });
    }

    const layoutData = await layoutService.fetchLayoutData(itemId, language);

    //delete coveo record if item is set to not to index
    if ((layoutData?.sitecore?.route?.fields?.['DoNotIndex'] as Field<boolean>)?.value == true) {
      const documentId = host + layoutData.sitecore.context.itemPath?.toString().toLowerCase();
      await deleteCoveoItem(documentId);

      return res.status(200).json({ message: 'This item is not included for indexing' });
    }
    const document = await getContentForItem(layoutData);

    if (document) await pushToCoveo(document);
  } else if (req.query.pushAll) {
    await pushAllPages(language);
  }

  return res.status(200).json({ message: 'Content pushed to coveo successfully' });
}

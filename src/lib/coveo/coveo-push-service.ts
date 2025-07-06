export type IbResponseData = {
  _id: string;
  content: string;
  name: string;
  v3Thumbnail?: string;
  id: string;
  file: File;
  height: string;
  thumbnail: string;
  width: string;
  createTime: string;
  lastUpdateTime: string;
  imageWidth: string;
  imageHeight: string;
  fancyFileSize: string;
  fancyFileType: string;
  reviewDate: string;
};

type File = {
  name: string;
  type: string;
};

type BaseDocument = {
  documentId: string;
  title: string;
  id: string;
};

export type PageDocument = BaseDocument & {
  data: string;
  categories?: string[];

  image?: string;
};

const getCoveoPushApiUrl = () => {
  return process.env.COVEO_PUSH_URL?.replace('{orgid}', process.env.COVEO_ORG_ID || '').replace(
    '{srcid}',
    process.env.COVEO_SOURCE_ID || ''
  );
};

export const pushToCoveo = async (document: PageDocument) => {
  const coveoPushApiUrl = getCoveoPushApiUrl();
  const coveoResponse = await fetch(`${coveoPushApiUrl}?documentId=${document.documentId}`, {
    method: 'Put',
    headers: {
      Authorization: `Bearer ${process.env.COVEO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  });

  const responseText = await coveoResponse.text();
  console.log('Coveo push API response for document ID ' + document.documentId, responseText);

  if (!coveoResponse.ok) {
    throw new Error(
      `Failed to push document ${document.documentId} to Coveo: ${coveoResponse.statusText}`
    );
  }

  console.log('Pushed document to Coveo', document.documentId);
};

export const deleteOldCoveoItems = async (orderingId: number) => {
  const deleteUrl = getCoveoPushApiUrl() + '/olderthan';

  const coveoResponse = await fetch(`${deleteUrl}?orderingId=${orderingId}`, {
    method: 'Delete',
    headers: {
      Authorization: `Bearer ${process.env.COVEO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!coveoResponse.ok) {
    console.error(`Failed to delete old coveo records`, coveoResponse.statusText);
  }
};

export const deleteCoveoItem = async (documentId: string) => {
  const deleteUrl = getCoveoPushApiUrl();
  console.log('provided document id for deletion', documentId);
  const coveoResponse = await fetch(`${deleteUrl}?deleteChildren=false&documentId=${documentId}`, {
    method: 'Delete',
    headers: {
      Authorization: `Bearer ${process.env.COVEO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!coveoResponse.ok) {
    console.error(`Failed to delete coveo record`, coveoResponse.statusText);
  } else {
    console.log('Coveo record deleted', documentId);
  }
};

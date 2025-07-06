import clientFactory from 'lib/graphql-client-factory';
import { TemplateData } from './types/templateNameType';
import { getTemplateNameGraphql } from './graphql/template.graphql';

function fetchTemplateNameData(itemPath: string, lang: string): Promise<TemplateData> {
  const client = clientFactory();

  return client.request<TemplateData>(getTemplateNameGraphql, {
    itemPath: itemPath,
    lang: lang,
  });
}

export function fetchTemplateNameData$(queryKey: string[]): Promise<TemplateData> {
  return fetchTemplateNameData(queryKey[0], queryKey[1]);
}

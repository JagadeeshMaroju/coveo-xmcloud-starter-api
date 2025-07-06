import {
  ComponentFields,
  ComponentRendering,
  HtmlElementRendering,
  PlaceholdersData,
} from '@sitecore-jss/sitecore-jss-nextjs';

//list the components you want to exclude
//const excludeComponents: string[] = ['Footer'];

//list the fields to exclude
//const excludeFields: string[] = [];

function isComponentRendering(
  r: ComponentRendering<ComponentFields> | HtmlElementRendering
): r is ComponentRendering<ComponentFields> {
  return 'componentName' in r;
}

export function collectJsonValues(
  obj: unknown,
  excludeFields: string[],
  fieldKeyContext: string = '',
  bucket: string[] = [],
  isPageItem: boolean = false,
  includedFields: string[] = []
): string[] {
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const currentKeyPath = fieldKeyContext ? `${fieldKeyContext}.${key}` : key;

      if (excludeFields.includes(key)) {
        continue;
      }

      if (isPageItem && !includedFields.includes(key)) {
        continue;
      }

      if (
        value &&
        typeof value === 'object' &&
        'jsonValue' in value &&
        typeof (value as { jsonValue?: unknown }).jsonValue === 'object'
      ) {
        const raw = (value as { jsonValue: { value: unknown } }).jsonValue.value;

        if (raw && typeof raw === 'object' && ('href' in raw || 'src' in raw)) {
          continue;
        }

        if (typeof raw !== 'object' && raw !== undefined && raw !== null && String(raw).trim()) {
          bucket.push(String(raw));
        } else {
          collectJsonValues(raw, excludeFields, currentKeyPath, bucket);
        }
      } else if (
        value &&
        typeof value === 'object' &&
        'value' in value &&
        typeof (value as { value?: unknown }).value !== 'object'
      ) {
        const raw = (value as { value: unknown }).value;
        if (raw !== undefined && raw !== null && String(raw).trim()) {
          bucket.push(String(raw));
        }
      } else {
        collectJsonValues(value, excludeFields, currentKeyPath, bucket);
      }
    }
  }

  return bucket;
}
export function extractAllFieldValuesFromComponents(
  placeholderData: PlaceholdersData<string>,
  excludeComponents: string[],
  excludeFields: string[]
): string {
  const values: string[] = [];

  function processPlaceholderData(data: PlaceholdersData<string>) {
    const placeholderKeys = Object.keys(data);

    placeholderKeys.forEach((pk) => {
      const components = data[pk];

      components.forEach((component) => {
        if (isComponentRendering(component)) {
          if (!excludeComponents.includes(component.componentName) && component.fields) {
            values.push(...collectJsonValues(component.fields, excludeFields));
          }

          // Recurse into nested placeholders
          if (component.placeholders) {
            processPlaceholderData(component.placeholders);
          }
        }
      });
    });
  }

  processPlaceholderData(placeholderData);
  return values.join(' ').trim();
}

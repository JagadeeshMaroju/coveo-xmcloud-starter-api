export const getTemplateNameGraphql = `
query GetTemplateName($itemPath: String, $lang: String!) {
  templatedetails: item(path: $itemPath, language: $lang) {
    template {
      name
    }
  }
}

`;

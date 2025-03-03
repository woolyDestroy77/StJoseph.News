export function linkify(text: string) {
  const urlRegex = /(?:(?:https?|ftp):\/\/)?[\w.-]+\.[a-z]{2,}(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?/gi;

  return text.replace(urlRegex, function(url) {
      let href = url;
      if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('ftp://')) {
          href = 'http://' + href;
      }
      return '<a href="' + href + '">' + url + '</a>';
  });
}



export function sanitizeHTML(html: string) {
  const allowedTags = ['p', 'strong', 'em', 'a', 'br', 'span', 'div'];
  const allowedAttributes = {
    a: ['href', 'target', 'rel'],
    span: ['style'],
    div: ['style'],
    p: ['style'],
    strong: ['style'],
    em: ['style']
  };

  const tagRegex = /<\/?([a-zA-Z]+)([^>]*)>/g;
  const attributeRegex = /([a-zA-Z]+)="([^"]*)"/g;

  return html.replace(tagRegex, (match, tagName, attributes) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      if (attributes) {
        let sanitizedAttributes = '';
        attributes.replace(attributeRegex, (_attrMatch: string, attrName: string, attrValue: string) => {
          const tagNameLower = tagName.toLowerCase() as keyof typeof allowedAttributes;
          if (allowedAttributes[tagNameLower] && allowedAttributes[tagNameLower].includes(attrName.toLowerCase())) {
            if (attrName.toLowerCase() === 'href') {
              attrValue = attrValue.replace(/javascript:/i, '');
            }

            sanitizedAttributes += ` ${attrName}="${attrValue}"`;
          }
        });
        return `<${tagName}${sanitizedAttributes}>`;
      }
      return match;
    }
    return '';
  });
}
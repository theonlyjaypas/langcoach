export function renderMarkdown(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) => {
      if (part.match(/^\*\*[^*]+\*\*$/)) {
        return {
          type: 'bold',
          content: part.slice(2, -2),
          key: i,
        };
      }
      return {
        type: 'text',
        content: part,
        key: i,
      };
    });
}

export function parseMarkdownToJSX(text: string) {
  return renderMarkdown(text).map((segment) => {
    if (segment.type === 'bold') {
      return <strong key={segment.key}>{segment.content}</strong>;
    }
    return segment.content;
  });
}

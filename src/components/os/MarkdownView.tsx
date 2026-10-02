import type { ReactNode } from 'react';

interface MarkdownViewProps {
  markdown: string;
}

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\`[^\`]+\`|\[\[[^\]]+\]\])/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      return <span className="os-wikilink" key={index}>{part.slice(2, -2)}</span>;
    }
    return part;
  });
}

export function MarkdownView({ markdown }: MarkdownViewProps) {
  const lines = markdown.split('\n');
  const nodes: ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  let code: string[] | null = null;

  const flushList = () => {
    if (list.length === 0) return;
    const Tag = ordered ? 'ol' : 'ul';
    nodes.push(
      <Tag key={`list-${nodes.length}`}>
        {list.map((item, index) => <li key={index}>{inline(item)}</li>)}
      </Tag>,
    );
    list = [];
    ordered = false;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      flushList();
      if (code) {
        nodes.push(
          <pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>,
        );
        code = null;
      } else {
        code = [];
      }
      return;
    }

    if (code) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const content = inline(heading[2]);
      if (level === 1) nodes.push(<h1 key={index}>{content}</h1>);
      if (level === 2) nodes.push(<h2 key={index}>{content}</h2>);
      if (level === 3) nodes.push(<h3 key={index}>{content}</h3>);
      if (level === 4) nodes.push(<h4 key={index}>{content}</h4>);
      return;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (ordered) flushList();
      list.push(bullet[1]);
      return;
    }

    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (numbered) {
      if (list.length > 0 && !ordered) flushList();
      ordered = true;
      list.push(numbered[1]);
      return;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushList();
      nodes.push(<blockquote key={index}>{inline(quote[1])}</blockquote>);
      return;
    }

    const divider = /^---+$/.test(line.trim());
    if (divider) {
      flushList();
      nodes.push(<hr key={index} />);
      return;
    }

    flushList();
    nodes.push(<p key={index}>{inline(line)}</p>);
  });

  flushList();

  if (code) {
    nodes.push(<pre key="code-tail"><code>{code.join('\n')}</code></pre>);
  }

  return <article className="os-markdown">{nodes}</article>;
}

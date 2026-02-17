'use client';

import { useMemo, memo, type ReactNode, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { ChartRenderer } from './ChartRenderer';
import { CollapsibleTable } from './CollapsibleTable';
import { transformVisualizations, type Message } from '@/lib/chat/utils';

const MessageContext = createContext<{ message: Message } | null>(null);

/**
 * Shared markdown components that don't depend on message state
 */
const BASE_MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => (
    <p className="mt-4 first:mt-0 mb-4 last:mb-0 leading-relaxed text-white/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-2 mt-6 mb-8 pl-2 border-l-2 border-[#00ff87]/20 bg-white/5 p-4 rounded-xl shadow-inner">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-2 mt-6 mb-8 pl-2 border-l-2 border-[#00ff87]/20 bg-white/5 p-4 rounded-xl shadow-inner">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-white/80 mb-1 last:mb-0">{children}</li>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5 border-b border-white/10 whitespace-nowrap">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 font-black uppercase tracking-widest text-[10px] text-[#00ff87]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-b border-white/5 text-white/80 whitespace-nowrap">
      {children}
    </td>
  ),
};

/**
 * Shared markdown components for stable identity
 */
const MarkdownTable = ({ children }: { children?: ReactNode }) => {
  const ctx = useContext(MessageContext);
  if (!ctx) return <CollapsibleTable hasChart={false}>{children}</CollapsibleTable>;
  
  const hasChart = ctx.message.content?.includes('viz://') || ctx.message.content?.includes('```vega-lite');
  return <CollapsibleTable hasChart={hasChart}>{children}</CollapsibleTable>;
};

const MarkdownCode = ({ className, children }: { className?: string; children?: ReactNode }) => {
  const isInline = !className;
  if (!isInline && className?.includes('language-vega-lite')) {
    const content = Array.isArray(children) ? children.join('') : String(children || '');
    return <ChartRenderer spec={content} />;
  }
  return isInline ? (
    <code className="px-1.5 py-0.5 bg-[#37003c] text-[#00ff87] rounded font-mono text-xs border border-white/10">
      {children}
    </code>
  ) : (
    <div className="relative group">
      <pre className="p-4 bg-black/40 rounded-xl border border-white/5 overflow-x-auto font-mono text-xs my-4">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

const MarkdownImage = ({ src, alt }: { src?: string | unknown; alt?: string }) => {
  const ctx = useContext(MessageContext);
  
  // Validate src
  if (!src || typeof src !== 'string' || src.trim() === '' || src === 'null' || src === 'undefined') {
    return null;
  }

  if (src.startsWith('viz://')) {
    if (!ctx) return <div className="italic text-white/60 p-4 border border-white/5 rounded-xl my-4">Generating visualization...</div>;
    
    const id = src.slice('viz://'.length);
    const tc = ctx.message.toolCalls?.find((t) => t.tool_call_id === id);
    
    if (tc?.results && Array.isArray(tc.results) && tc.results.length > 0) {
      const first = tc.results[0] as Record<string, unknown>;
      const possibleSpec = (first?.vega || first?.spec || first?.['vega-lite'] || first?.vega_lite) as string | object | undefined;
      
      if (possibleSpec) {
        return <ChartRenderer spec={possibleSpec} />;
      }
      
      if (typeof first === 'string' && (first as string).startsWith('data:image')) {
        return (
          <Image 
            src={first as string} 
            alt={alt || 'Visual representation'} 
            width={800} 
            height={600} 
            sizes="100vw" 
            className="w-full h-auto rounded-xl object-contain my-4 px-1" 
            unoptimized 
          />
        );
      }
      
      const dataObj = first?.data as { values: unknown[] } | undefined;
      if (dataObj && Array.isArray(dataObj.values)) {
        const vegaSpec = { 
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json', 
          data: { values: dataObj.values }, 
          mark: 'bar', 
          encoding: {} 
        };
        return <ChartRenderer spec={vegaSpec} />;
      }
      return <pre className="p-3 bg-black/20 rounded-xl text-sm mt-2">{JSON.stringify(tc.results, null, 2)}</pre>;
    }
    return <div className="italic text-white/60 p-4 border border-white/5 rounded-xl my-4">Generating visualization...</div>;
  }
  
  return (
    <Image 
      src={src} 
      alt={alt || 'Image'} 
      width={800} 
      height={600} 
      sizes="100vw" 
      className="w-full h-auto rounded-xl object-contain my-4 px-1" 
    />
  );
};

const MARKDOWN_COMPONENTS: Components = {
  ...BASE_MARKDOWN_COMPONENTS,
  table: MarkdownTable,
  code: MarkdownCode,
  img: MarkdownImage,
};

/**
 * MessageContent handles memoized markdown rendering to prevent flickering 
 * on unrelated state changes (like input typing)
 */
export const MessageContent = memo(function MessageContent({ message }: { message: Message }) {
  const md = useMemo(() => transformVisualizations(message.content || ''), [message.content]);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00ff87] prose-a:text-[#00ff87] prose-strong:text-[#00ff87] prose-strong:font-black">
      <MessageContext.Provider value={{ message }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MARKDOWN_COMPONENTS}
        >
          {md}
        </ReactMarkdown>
      </MessageContext.Provider>
    </div>
  );
});

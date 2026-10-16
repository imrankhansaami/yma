import { RichText } from "@/components/common/RichText";

type AnyData = Record<string, any>;

const alignClass = (align?: string) =>
  align === "center"
    ? "text-center"
    : align === "right"
      ? "text-right"
      : "text-left";

const flexAlign = (align?: string) =>
  align === "center"
    ? "justify-center"
    : align === "right"
      ? "justify-end"
      : "justify-start";

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

export function HeadingBlock({ content }: { content: AnyData }) {
  const level = Math.min(6, Math.max(1, Number(content.level) || 2));
  const text = String(content.text || "");
  if (!text) return null;
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <Tag className={alignClass(content.align)}>{text}</Tag>;
}

export function ParagraphBlock({ content }: { content: AnyData }) {
  const html = String(content.html || "");
  if (!html) return null;
  return <RichText html={html} className={alignClass(content.align)} />;
}

export function QuoteBlock({ content }: { content: AnyData }) {
  const text = String(content.text || "");
  if (!text) return null;
  return (
    <blockquote className="my-6 border-l-4 border-brand-orange-500 bg-slate-50 px-5 py-4 text-slate-700 italic">
      <p>{text}</p>
      {content.author ? (
        <footer className="mt-2 text-sm text-slate-500 not-italic">
          — {String(content.author)}
        </footer>
      ) : null}
    </blockquote>
  );
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

export function ImageBlock({ content }: { content: AnyData }) {
  const src = String(content.src || "");
  if (!src) return null;
  const width = content.width ? `${Number(content.width)}%` : "100%";
  return (
    <figure
      className={`my-6 flex flex-col ${flexAlign(
        content.align === "left" ? "left" : content.align === "right" ? "right" : "center",
      )}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={String(content.alt || "")}
        style={{ width, height: "auto" }}
        className="rounded-xl"
      />
      {content.caption ? (
        <figcaption className="mt-2 text-sm text-slate-500">
          {String(content.caption)}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ButtonBlock({ content }: { content: AnyData }) {
  const label = String(content.label || "");
  if (!label) return null;
  const href = String(content.href || "#");
  const outline = content.variant === "outline";
  const classes = outline
    ? "border border-brand-orange-500 text-brand-orange-500 hover:bg-brand-orange-50"
    : "bg-brand-orange-500 text-white hover:bg-brand-orange-600";
  return (
    <div className={`my-4 flex ${flexAlign(content.align)}`}>
      <a
        href={href}
        className={`inline-flex items-center rounded-full px-6 py-3 font-medium transition-colors ${classes}`}
      >
        {label}
      </a>
    </div>
  );
}

export function HtmlBlock({ content }: { content: AnyData }) {
  const html = String(content.html || "");
  if (!html) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export function DividerBlock() {
  return <hr className="my-8 border-t border-slate-200" />;
}

export function SpacerBlock({ content }: { content: AnyData }) {
  const height = String(content.height || "2rem");
  return <div style={{ height }} aria-hidden="true" />;
}

export function ColumnsBlock({ content }: { content: AnyData }) {
  const columns: AnyData[] = Array.isArray(content.columns) ? content.columns : [];
  if (columns.length === 0) return null;

  const count = Math.min(4, Math.max(1, Number(content.count) || columns.length));
  const shown = columns.slice(0, count);
  const grid =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "md:grid-cols-2"
        : count === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4";

  return (
    <div className={`my-6 grid grid-cols-1 gap-6 ${grid}`}>
      {shown.map((column, index) => (
        <div key={index} className="space-y-2">
          {column.heading ? (
            <h3 className="text-xl font-semibold">{String(column.heading)}</h3>
          ) : null}
          {column.html ? <RichText html={String(column.html)} /> : null}
        </div>
      ))}
    </div>
  );
}

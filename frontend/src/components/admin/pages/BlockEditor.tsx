"use client";

import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Box,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  ClipboardPaste,
  CodeXml,
  Columns3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  FolderInput,
  GripVertical,
  Heading1,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  LayoutTemplate,
  Layers,
  List,
  ListTree,
  Mail,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  MousePointerClick,
  MoveVertical,
  Package,
  Phone,
  Plus,
  Quote as QuoteIcon,
  Scale,
  Search,
  SeparatorHorizontal,
  Sparkles,
  Star,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import TextEditor from "@/components/admin/inventory/TextEditor";
import { useAdminToast } from "@/components/ui/admin-toast";
import {
  BLOCK_CATALOG,
  BLOCK_LABELS,
  LOCATION_BODY_SECTIONS,
  NESTED_BLOCK_TYPES,
  PAGE_STYLES_TYPE,
  TYPOGRAPHY_ROLES,
} from "@/lib/blocks/types";
import { bodyToHtml, heroToHtml } from "@/lib/blocks/locationContent";
import type {
  BlockStyles,
  TextStyle,
  TypographyMap,
  TypographyRole,
} from "@/lib/blocks/types";
import {
  getAllPageContent,
  getPageContentByKey,
  upsertPageContent,
} from "@/services/pageContent.service";
import type { PageContent, PageSection } from "@/services/pageContent.service";

type AnyRecord = Record<string, any>;

/* -------------------------------------------------------------------------- */
/* Reusable blocks (kept in this browser)                                      */
/* -------------------------------------------------------------------------- */

const REUSABLE_STORAGE_KEY = "yma:reusable-blocks";

type ReusableBlock = { id: string; name: string; block: PageSection };

/** Structured clone for block payloads (they are plain JSON). */
function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T;
}

function loadReusableBlocks(): ReusableBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REUSABLE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

const BLOCK_ICONS: Record<string, LucideIcon> = {
  heading: Heading1,
  paragraph: AlignLeft,
  richText: FileText,
  bulletList: List,
  quote: QuoteIcon,
  image: ImageIcon,
  button: MousePointerClick,
  html: CodeXml,
  columns: Columns3,
  divider: SeparatorHorizontal,
  spacer: MoveVertical,
  [PAGE_STYLES_TYPE]: Type,
  hero: Sparkles,
  pageHeader: LayoutTemplate,
  faq: HelpCircle,
  categoryTiles: LayoutGrid,
  productGrid: Package,
  featureGrid: Star,
  mediaText: ImagePlus,
  testimonials: MessageSquareQuote,
  productTabs: Layers,
  cta: Megaphone,
  newsletter: Mail,
  locationHero: MapPin,
  locationBody: MapIcon,
  locationHub: MapIcon,
  contactPage: Phone,
  legalPage: Scale,
  seoContent: Search,
};

function BlockIcon({ type, className }: { type?: string; className?: string }) {
  const Icon = BLOCK_ICONS[type || "richText"] || Box;
  return <Icon className={className} />;
}

function stripTags(value: string) {
  return String(value).replace(/<[^>]*>/g, " ");
}

/** One-line preview of a block's content, shown in the block list. */
function blockSummary(block: PageSection): string {
  const data = (block.data as AnyRecord) || {};
  const type = block.type || "richText";

  if (type === "columns") {
    const count = Array.isArray(data.columns)
      ? data.columns.length
      : Number(data.count) || 0;
    return count ? `${count} column${count === 1 ? "" : "s"}` : "";
  }
  if (type === "spacer") return data.height ? `Height ${data.height}` : "";
  if (type === "divider") return "";

  const candidates = [
    data.text,
    data.title,
    data.heading,
    block.title,
    typeof data.html === "string" ? stripTags(data.html) : "",
    block.content ? stripTags(block.content) : "",
    data.label,
    data.subtitle,
  ];
  const first = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );
  if (!first) return "";
  const text = String(first).replace(/\s+/g, " ").trim();
  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
}

/** Hover-revealed "+ Add block" point between two blocks. */
function InsertPoint({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="group/insert relative h-4">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-transparent transition-colors group-hover/insert:bg-brand-orange-200" />
      <button
        type="button"
        onClick={onAdd}
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500 opacity-0 shadow-sm transition-opacity hover:border-brand-orange-400 hover:text-brand-orange-600 group-hover/insert:opacity-100"
      >
        <Plus className="h-3 w-3" /> Add block
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Heading outline (like an SEO plugin's "Headings" panel)                      */
/* -------------------------------------------------------------------------- */

type OutlineItem = { level: number; text: string };

/** Headings written inside a block's rich text, in document order. */
function htmlOutline(html: unknown): OutlineItem[] {
  const source = String(html ?? "");
  if (!source || !/<h[1-6][\s>]/i.test(source)) return [];

  const out: OutlineItem[] = [];
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const text = stripTags(match[2])
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push({ level: Number(match[1]), text });
  }
  return out;
}

/** The headings a single block contributes to the page outline, in order. */
function blockOutline(block: PageSection): OutlineItem[] {
  const data = (block.data as AnyRecord) || {};
  const type = block.type || "richText";
  const out: OutlineItem[] = [];
  const add = (level: unknown, text: unknown) => {
    const value = String(text ?? "").replace(/\s+/g, " ").trim();
    if (value) {
      out.push({
        level: Math.min(6, Math.max(1, Number(level) || 2)),
        text: value,
      });
    }
  };

  switch (type) {
    case "heading":
      add(data.level, data.text);
      break;
    case "pageHeader":
      add(1, data.title);
      break;
    case "locationHero":
      add(2, data.title);
      break;
    case "locationBody":
      add(2, data.aboutTitle);
      add(2, data.whyTitle);
      (data.whyItems || []).forEach((item: AnyRecord) => add(3, item?.title));
      add(2, data.servicesTitle);
      (data.servicesItems || []).forEach((item: AnyRecord) =>
        add(3, item?.title),
      );
      add(2, data.safetyTitle);
      (data.safetyItems || []).forEach((item: AnyRecord) =>
        add(3, item?.title),
      );
      add(2, data.occasionsTitle);
      break;
    case "columns":
      (data.columns || []).forEach((column: AnyRecord) => {
        add(3, column?.heading);
        out.push(...htmlOutline(column?.html));
        (column?.blocks || []).forEach((nested: PageSection) =>
          out.push(...blockOutline(nested)),
        );
      });
      break;
    case "richText":
      add(2, block.title);
      out.push(...htmlOutline(block.content));
      break;
    case "paragraph":
      out.push(...htmlOutline(data.html));
      break;
    case "html":
      out.push(...htmlOutline(data.html));
      break;
    default:
      // Section blocks (hero, faq, featureGrid, ...) render their title as an H2.
      add(2, data.title ?? data.heading ?? block.title);
      out.push(...htmlOutline(data.html));
      break;
  }

  return out;
}

/** SEO checks over the finished outline. */
function outlineIssues(outline: OutlineItem[]): {
  level: "error" | "warn";
  message: string;
}[] {
  const issues: { level: "error" | "warn"; message: string }[] = [];

  const h1s = outline.filter((item) => item.level === 1);
  if (outline.length === 0) {
    return issues;
  }
  if (h1s.length === 0) {
    issues.push({ level: "error", message: "No H1 on the page." });
  } else if (h1s.length > 1) {
    issues.push({
      level: "error",
      message: `${h1s.length} H1s. A page should have exactly one.`,
    });
  }

  let previous = 1;
  outline.forEach((item) => {
    if (item.level > previous + 1) {
      issues.push({
        level: "warn",
        message: `H${previous} → H${item.level} skips H${previous + 1}: “${item.text}”.`,
      });
    }
    previous = item.level;
  });

  outline
    .filter((item) => item.text.length > 70)
    .slice(0, 3)
    .forEach((item) => {
      issues.push({
        level: "warn",
        message: `H${item.level} is ${item.text.length} characters long. Keep headings under ~70.`,
      });
    });

  return issues;
}

/** The whole page outline: the template's H1 then every block's headings. */
function pageOutline(pageHeading: string | undefined, blocks: PageSection[]) {
  const items: OutlineItem[] = [];
  if (String(pageHeading || "").trim()) {
    items.push({ level: 1, text: String(pageHeading).trim() });
  }
  blocks
    .filter((block) => block.visible !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((block) => items.push(...blockOutline(block)));
  return items;
}

/* -------------------------------------------------------------------------- */
/* Paste content -> blocks                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Turns pasted rich text into blocks: every H1-H6 becomes a Heading block and
 * everything between headings becomes a Paragraph block. A pasted H1 is demoted
 * to H2 because the page template already renders the page's only H1.
 */
function htmlToBlocks(source: string): PageSection[] {
  const raw = String(source || "").trim();
  if (!raw) return [];

  const clean = (value: string) => value.replace(/&nbsp;/g, " ").trim();
  const looksLikeHtml = /<(h[1-6]|p|ul|ol|blockquote|table|figure|img|div)\b/i.test(
    raw,
  );
  const nodes: { tag: string; html: string; text: string }[] = [];

  if (looksLikeHtml) {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    const collect = (parent: Element) => {
      Array.from(parent.children).forEach((child) => {
        const tag = child.tagName.toLowerCase();
        // Unwrap structural wrappers so headings inside them are not lost.
        if (tag === "div" && child.children.length > 0) {
          collect(child);
          return;
        }
        nodes.push({
          tag,
          html: child.outerHTML,
          text: clean(child.textContent || ""),
        });
      });
    };
    collect(doc.body);
  } else {
    raw.split(/\n{2,}/).forEach((chunk) => {
      const text = clean(chunk.replace(/\n/g, " "));
      if (text) nodes.push({ tag: "p", html: `<p>${text}</p>`, text });
    });
  }

  const blocks: PageSection[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const html = buffer.join("").trim();
    buffer = [];
    if (!html) return;
    blocks.push({
      sectionKey: `paragraph-${Date.now()}-${blocks.length}`,
      type: "paragraph",
      title: "",
      content: "",
      order: 0,
      visible: true,
      data: { html },
    });
  };

  nodes.forEach((node) => {
    const heading = /^h([1-6])$/.exec(node.tag);
    if (heading && node.text) {
      flush();
      const pastedLevel = Number(heading[1]);
      blocks.push({
        sectionKey: `heading-${Date.now()}-${blocks.length}`,
        type: "heading",
        title: "",
        content: "",
        order: 0,
        visible: true,
        data: { level: pastedLevel === 1 ? 2 : pastedLevel, text: node.text },
      });
      return;
    }
    if (node.html.trim()) buffer.push(node.html);
  });

  flush();
  return blocks;
}

/** Field-level help so the editor stays compact. */
function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <textarea
        value={value ?? ""}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

/** A labelled rich text field, for copy that should support formatting. */
function RichField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <TextEditor value={value || ""} onChange={onChange} />
    </div>
  );
}

function StringList({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value?: string[];
  onChange: (v: string[]) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <textarea
        rows={Math.max(2, (value?.length ?? 0) + 1)}
        value={(value ?? []).join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
      <span className="mt-1 block text-[11px] text-slate-400">
        {help ?? "One item per line."}
      </span>
    </label>
  );
}

/** Image is stored as a URL (e.g. a Cloudinary link) or a site path. */
function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <input
        type="text"
        value={value ?? ""}
        placeholder="/header_bg.png or https://res.cloudinary.com/..."
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="preview"
          className="mt-2 h-20 w-auto rounded-md border border-slate-200 object-cover"
        />
      ) : null}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Typography controls                                                         */
/* -------------------------------------------------------------------------- */

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Default (inherit)", value: "" },
  { label: "Inter", value: "var(--font-inter), Inter, sans-serif" },
  { label: "Londrina Solid", value: "var(--font-londrina-solid), cursive" },
  { label: "System UI", value: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_WEIGHTS = ["", "300", "400", "500", "600", "700", "800", "900"];
const TEXT_TRANSFORMS = ["", "none", "uppercase", "lowercase", "capitalize"];
const ALIGN_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const ROLE_LABELS: Record<TypographyRole, string> = {
  base: "All text",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  h5: "H5",
  h6: "H6",
  p: "Paragraph",
  span: "Span",
  a: "Link",
  li: "List item",
};

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MiniField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">
        {label}
      </span>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
      />
    </label>
  );
}

/**
 * Per-block typography. Pick an element role (H1-H6, paragraph, span, link...)
 * and set its font, size, weight, line height, spacing and colour. The values
 * are rendered as scoped CSS by BlockStyleScope on the storefront.
 */
function TypographyPanel({
  styles,
  onChange,
}: {
  styles?: BlockStyles;
  onChange: (styles: BlockStyles) => void;
}) {
  const [role, setRole] = useState<TypographyRole>("base");
  const typography: TypographyMap = styles?.typography || {};
  const current = typography[role] || {};

  const setRoleStyle = (patch: TextStyle) => {
    const merged: TextStyle = { ...current, ...patch };
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(
        ([, value]) => String(value ?? "").trim() !== "",
      ),
    ) as TextStyle;
    onChange({ ...styles, typography: { ...typography, [role]: cleaned } });
  };

  const setWrapper = (patch: Partial<BlockStyles>) =>
    onChange({ ...styles, ...patch });

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {TYPOGRAPHY_ROLES.map((entry) => {
          const styled =
            typography[entry] && Object.keys(typography[entry] || {}).length > 0;
          const active = entry === role;
          return (
            <button
              key={entry}
              type="button"
              onClick={() => setRole(entry)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-brand-black-950 text-white"
                  : styled
                    ? "bg-white text-brand-black-950 ring-1 ring-brand-orange-400"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800"
              }`}
            >
              {ROLE_LABELS[entry]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          label="Font family"
          value={current.fontFamily}
          onChange={(v) => setRoleStyle({ fontFamily: v })}
          options={FONT_FAMILIES}
        />
        <MiniField
          label="Font size"
          value={current.fontSize}
          onChange={(v) => setRoleStyle({ fontSize: v })}
          placeholder="18px / 1.25rem"
        />
        <Select
          label="Font weight"
          value={current.fontWeight}
          onChange={(v) => setRoleStyle({ fontWeight: v })}
          options={FONT_WEIGHTS.map((w) => ({ label: w || "Default", value: w }))}
        />
        <MiniField
          label="Line height"
          value={current.lineHeight}
          onChange={(v) => setRoleStyle({ lineHeight: v })}
          placeholder="1.6 / 28px"
        />
        <MiniField
          label="Letter spacing"
          value={current.letterSpacing}
          onChange={(v) => setRoleStyle({ letterSpacing: v })}
          placeholder="0.02em"
        />
        <Select
          label="Transform"
          value={current.textTransform}
          onChange={(v) => setRoleStyle({ textTransform: v })}
          options={TEXT_TRANSFORMS.map((t) => ({
            label: t || "Default",
            value: t,
          }))}
        />
        <Select
          label="Align"
          value={current.textAlign}
          onChange={(v) => setRoleStyle({ textAlign: v })}
          options={ALIGN_OPTIONS}
        />
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-slate-500">
            Colour
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={current.color || "#18181b"}
              onChange={(e) => setRoleStyle({ color: e.target.value })}
              className="h-8 w-10 rounded border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={() => setRoleStyle({ color: "" })}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          </div>
        </label>
        <MiniField
          label="Margin top"
          value={current.marginTop}
          onChange={(v) => setRoleStyle({ marginTop: v })}
          placeholder="0"
        />
        <MiniField
          label="Margin bottom"
          value={current.marginBottom}
          onChange={(v) => setRoleStyle({ marginBottom: v })}
          placeholder="12px"
        />
        <Select
          label="Font style"
          value={current.fontStyle}
          onChange={(v) => setRoleStyle({ fontStyle: v })}
          options={[
            { label: "Default", value: "" },
            { label: "Normal", value: "normal" },
            { label: "Italic", value: "italic" },
          ]}
        />
      </div>

      <details className="rounded-md border border-slate-200 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-slate-600">
          Block spacing &amp; background
        </summary>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 sm:grid-cols-4">
          <MiniField
            label="Margin top"
            value={styles?.marginTop}
            onChange={(v) => setWrapper({ marginTop: v })}
          />
          <MiniField
            label="Margin bottom"
            value={styles?.marginBottom}
            onChange={(v) => setWrapper({ marginBottom: v })}
          />
          <MiniField
            label="Padding (top+bottom)"
            value={styles?.paddingY}
            onChange={(v) => setWrapper({ paddingY: v })}
            placeholder="24px"
          />
          <MiniField
            label="Background"
            value={styles?.background}
            onChange={(v) => setWrapper({ background: v })}
            placeholder="#f8fafc"
          />
        </div>
      </details>

      <p className="text-[11px] text-slate-400">
        Styles apply to this block only. Add a “Page Typography” block to style
        the whole page.
      </p>
    </div>
  );
}

/** Generic repeater for array-of-object fields. */
function Repeater({
  label,
  items,
  onChange,
  makeItem,
  renderItem,
}: {
  label: string;
  items: AnyRecord[];
  onChange: (items: AnyRecord[]) => void;
  makeItem: () => AnyRecord;
  renderItem: (
    item: AnyRecord,
    update: (patch: AnyRecord) => void,
  ) => ReactNode;
}) {
  const update = (index: number, patch: AnyRecord) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const remove = (index: number) =>
    onChange(items.filter((_, i) => i !== index));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, makeItem()])}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-md border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="mb-2 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-400 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderItem(item, (patch) => update(index, patch))}
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">No items yet.</p>
        ) : null}
      </div>
    </div>
  );
}

const asArray = (data: AnyRecord, key: string): AnyRecord[] =>
  Array.isArray(data?.[key]) ? data[key] : [];

/** Per-type field editors. */
function BlockFields({
  block,
  patch,
}: {
  block: PageSection;
  patch: (p: Partial<PageSection>, dataPatch?: AnyRecord) => void;
}) {
  const type = block.type || "richText";
  const data: AnyRecord = (block.data as AnyRecord) || {};
  const setData = (dataPatch: AnyRecord) => patch({}, dataPatch);

  switch (type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Text label="Headline" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Paragraph" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} />
          <ImageField label="Background image" value={data.backgroundImage} onChange={(v) => setData({ backgroundImage: v })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Text label="Button label" value={data.bookLabel} onChange={(v) => setData({ bookLabel: v })} />
            <Text label="Call link label" value={data.callLabel} onChange={(v) => setData({ callLabel: v })} />
            <Text label="Phone number" value={data.phone} onChange={(v) => setData({ phone: v })} />
          </div>
          <Repeater
            label="Category buttons"
            items={asArray(data, "pills")}
            onChange={(pills) => setData({ pills })}
            makeItem={() => ({ label: "", category: "" })}
            renderItem={(item, update) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Text label="Label" value={item.label} onChange={(v) => update({ label: v })} />
                <Text label="Category (matches catalogue)" value={item.category} onChange={(v) => update({ category: v })} />
              </div>
            )}
          />
        </div>
      );

    case "categoryTiles":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <Text label="Subheading" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} />
          <Repeater
            label="Tiles"
            items={asArray(data, "tiles")}
            onChange={(tiles) => setData({ tiles })}
            makeItem={() => ({ title: "", href: "", image: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <Text label="Link" value={item.href} onChange={(v) => update({ href: v })} />
                <ImageField label="Image" value={item.image} onChange={(v) => update({ image: v })} />
                <Text label="Image alt text" value={item.imageAlt} onChange={(v) => update({ imageAlt: v })} />
              </div>
            )}
          />
        </div>
      );

    case "productGrid":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <Text label="Subheading" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Source</span>
              <select
                value={data.source || "topPicks"}
                onChange={(e) => setData({ source: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="topPicks">Top picks</option>
                <option value="newest">Newest products</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Products per page</span>
              <input
                type="number"
                min={1}
                value={data.limit ?? 16}
                onChange={(e) => setData({ limit: Number(e.target.value) })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
      );

    case "featureGrid":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <Text label="Heading (second line)" value={data.titleAccent} onChange={(v) => setData({ titleAccent: v })} />
          <Repeater
            label="Features"
            items={asArray(data, "items")}
            onChange={(items) => setData({ items })}
            makeItem={() => ({ icon: "castle", title: "", description: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Icon</span>
                    <select
                      value={item.icon || "castle"}
                      onChange={(e) => update({ icon: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="dollar">Pricing</option>
                      <option value="castle">Castle</option>
                      <option value="shield">Safety shield</option>
                      <option value="smile">Smiley</option>
                      <option value="calendar">Calendar</option>
                    </select>
                  </label>
                  <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                </div>
                <RichField label="Description" value={item.description} onChange={(v) => update({ description: v })} />
              </div>
            )}
          />
        </div>
      );

    case "mediaText":
      return (
        <div className="space-y-3">
          <StringList label="Badges" value={data.badges} onChange={(badges) => setData({ badges })} />
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <RichField label="Paragraph" value={data.body} onChange={(v) => setData({ body: v })} />
          <StringList label="Bullet points" value={data.listItems} onChange={(listItems) => setData({ listItems })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Link text" value={data.linkText} onChange={(v) => setData({ linkText: v })} />
            <Text label="Link URL" value={data.linkHref} onChange={(v) => setData({ linkHref: v })} />
          </div>
          <ImageField label="Image" value={data.image} onChange={(v) => setData({ image: v })} />
          <Text label="Image alt text" value={data.imageAlt} onChange={(v) => setData({ imageAlt: v })} />
        </div>
      );

    case "testimonials":
      return (
        <Repeater
          label="Testimonials"
          items={asArray(data, "items")}
          onChange={(items) => setData({ items })}
          makeItem={() => ({ quote: "", author: "", rating: 5 })}
          renderItem={(item, update) => (
            <div className="space-y-2">
              <RichField label="Quote" value={item.quote} onChange={(v) => update({ quote: v })} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Text label="Author" value={item.author} onChange={(v) => update({ author: v })} />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Rating (1-5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.rating ?? 5}
                    onChange={(e) => update({ rating: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>
          )}
        />
      );

    case "productTabs":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <Text label="Subheading" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Button label" value={data.ctaLabel} onChange={(v) => setData({ ctaLabel: v })} />
            <Text label="Button link" value={data.ctaHref} onChange={(v) => setData({ ctaHref: v })} />
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Paragraph" value={data.body} onChange={(v) => setData({ body: v })} rows={3} />
        </div>
      );

    case "newsletter":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Paragraph" value={data.body} onChange={(v) => setData({ body: v })} rows={3} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Input placeholder" value={data.placeholder} onChange={(v) => setData({ placeholder: v })} />
            <Text label="Button label" value={data.buttonLabel} onChange={(v) => setData({ buttonLabel: v })} />
          </div>
          <TextArea label="Privacy note" value={data.privacyPrefix} onChange={(v) => setData({ privacyPrefix: v })} rows={2} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Privacy link text" value={data.privacyLinkText} onChange={(v) => setData({ privacyLinkText: v })} />
            <Text label="Privacy link URL" value={data.privacyHref} onChange={(v) => setData({ privacyHref: v })} />
          </div>
        </div>
      );

    case "pageHeader":
      return (
        <div className="space-y-3">
          <Text label="Eyebrow" value={data.eyebrow} onChange={(v) => setData({ eyebrow: v })} />
          <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
          <RichField label="Intro" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} />
          <StringList label="Badges" value={data.badges} onChange={(badges) => setData({ badges })} />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          <Text label="Eyebrow" value={data.eyebrow} onChange={(v) => setData({ eyebrow: v })} />
          <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
          <RichField label="Intro" value={data.intro} onChange={(v) => setData({ intro: v })} />
          <Repeater
            label="Questions"
            items={asArray(data, "items")}
            onChange={(items) => setData({ items })}
            makeItem={() => ({ question: "", answer: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Question" value={item.question} onChange={(v) => update({ question: v })} />
                <RichField label="Answer" value={item.answer} onChange={(v) => update({ answer: v })} />
              </div>
            )}
          />
        </div>
      );

    case "bulletList":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <RichField label="Intro" value={data.intro} onChange={(v) => setData({ intro: v })} />
          <Repeater
            label="Items"
            items={asArray(data, "items")}
            onChange={(items) => setData({ items })}
            makeItem={() => ({ title: "", text: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <RichField label="Text" value={item.text} onChange={(v) => update({ text: v })} />
              </div>
            )}
          />
        </div>
      );

    case "contactPage":
      return (
        <div className="space-y-3">
          <Text label="Badge" value={data.badge} onChange={(v) => setData({ badge: v })} />
          <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Intro" value={data.intro} onChange={(v) => setData({ intro: v })} rows={2} />
          <StringList label="Pills" value={data.pills} onChange={(pills) => setData({ pills })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Steps label" value={data.stepsLabel} onChange={(v) => setData({ stepsLabel: v })} />
            <Text label="Steps heading" value={data.stepsTitle} onChange={(v) => setData({ stepsTitle: v })} />
          </div>
          <StringList label="Steps" value={data.steps} onChange={(steps) => setData({ steps })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text label="Details label" value={data.detailsLabel} onChange={(v) => setData({ detailsLabel: v })} />
            <Text label="Details heading" value={data.detailsHeading} onChange={(v) => setData({ detailsHeading: v })} />
            <Text label="Phone" value={data.phone} onChange={(v) => setData({ phone: v })} />
            <Text label="Email" value={data.email} onChange={(v) => setData({ email: v })} />
            <Text label="Facebook URL" value={data.facebook} onChange={(v) => setData({ facebook: v })} />
            <Text label="Instagram URL" value={data.instagram} onChange={(v) => setData({ instagram: v })} />
          </div>
          <StringList label="Form badges" value={data.formBadges} onChange={(formBadges) => setData({ formBadges })} />
        </div>
      );

    case "locationHub":
      return (
        <div className="space-y-3">
          <Text label="Eyebrow" value={data.eyebrow} onChange={(v) => setData({ eyebrow: v })} />
          <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Description" value={data.description} onChange={(v) => setData({ description: v })} rows={2} />
          <TextArea label="Sub text" value={data.subtext} onChange={(v) => setData({ subtext: v })} rows={2} />
          <Repeater
            label="Regional showcases"
            items={asArray(data, "showcases")}
            onChange={(showcases) => setData({ showcases })}
            makeItem={() => ({ title: "", intro: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Intro" value={item.intro} onChange={(v) => update({ intro: v })} rows={2} />
              </div>
            )}
          />
        </div>
      );

    case "locationHero": {
      const heroHtml = String(data.html ?? "").trim()
        ? String(data.html)
        : heroToHtml(data);
      return (
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Hero copy
            </span>
            <TextEditor
              value={heroHtml}
              onChange={(value) => setData({ html: value })}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Everything here is rich text — write the headline as an H2 and the
            intro as paragraphs. The Outline panel shows exactly what Google
            reads.
          </p>
        </div>
      );
    }

    case "locationBody": {
      const converted = bodyToHtml(data);
      return (
        <div className="space-y-3">
          {LOCATION_BODY_SECTIONS.map(({ key, label }) => {
            const saved = String(data[key] ?? "").trim();
            const value = saved ? String(data[key]) : converted[key] || "";
            return (
              <div
                key={key}
                className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
              >
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  {label}
                </p>
                <TextEditor
                  value={value}
                  onChange={(next) => setData({ [key]: next })}
                />
              </div>
            );
          })}
          <p className="text-[11px] text-slate-400">
            One box per section — write its H2 and the H3 points with the
            toolbar. Pages saved before this change are converted from their old
            fields automatically.
          </p>
        </div>
      );
    }

    case "seoContent":
      return (
        <div className="space-y-3">
          <Text label="Main heading" value={data.heading} onChange={(v) => setData({ heading: v })} />
          <RichField label="Intro paragraph" value={data.intro} onChange={(v) => setData({ intro: v })} />
          <Text label="Reasons heading" value={data.reasonsHeading} onChange={(v) => setData({ reasonsHeading: v })} />
          <Repeater
            label="Reasons"
            items={asArray(data, "reasons")}
            onChange={(reasons) => setData({ reasons })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <RichField label="Body" value={item.body} onChange={(v) => update({ body: v })} />
              </div>
            )}
          />
          <Text label="Offerings heading" value={data.offeringsHeading} onChange={(v) => setData({ offeringsHeading: v })} />
          <Repeater
            label="Offerings"
            items={asArray(data, "offerings")}
            onChange={(offerings) => setData({ offerings })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <RichField label="Body" value={item.body} onChange={(v) => update({ body: v })} />
              </div>
            )}
          />
          <Repeater
            label="Cross links"
            items={asArray(data, "crossLinks")}
            onChange={(crossLinks) => setData({ crossLinks })}
            makeItem={() => ({ label: "", href: "" })}
            renderItem={(item, update) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Text label="Label" value={item.label} onChange={(v) => update({ label: v })} />
                <Text label="Link" value={item.href} onChange={(v) => update({ href: v })} placeholder="/booking-catalog/..." />
              </div>
            )}
          />
        </div>
      );

    case "legalPage":
      return (
        <div className="space-y-3">
          <Text label="Page heading" value={data.heading} onChange={(v) => setData({ heading: v })} />
          <Text label="Last updated" value={data.lastUpdated} onChange={(v) => setData({ lastUpdated: v })} placeholder="December 2024" />
          <Repeater
            label="Sections"
            items={asArray(data, "sections")}
            onChange={(sections) => setData({ sections })}
            makeItem={() => ({ title: "", content: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Section heading" value={item.title} onChange={(v) => update({ title: v })} />
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-600">Content</span>
                  <TextEditor
                    value={item.content || ""}
                    onChange={(val) => update({ content: val })}
                  />
                </div>
              </div>
            )}
          />
        </div>
      );

    case "heading": {
      const level = Number(data.level ?? 2);
      return (
        <div className="space-y-3">
          <TextArea
            label="Text"
            value={data.text}
            onChange={(v) => setData({ text: v })}
            rows={2}
          />
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Level
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setData({ level: option })}
                    className={`h-8 min-w-[34px] rounded-md px-2 text-[11px] font-semibold transition-colors ${
                      level === option
                        ? "bg-brand-black-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    H{option}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-32">
              <Select
                label="Align"
                value={data.align ?? ""}
                onChange={(v) => setData({ align: v })}
                options={ALIGN_OPTIONS}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Renders as a real{" "}
            <span className="font-mono">{`<h${level}>`}</span> tag, so search
            engines read it as this section&apos;s heading.
          </p>
        </div>
      );
    }

    case "paragraph":
      return (
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Text
            </span>
            <TextEditor
              value={data.html || ""}
              onChange={(v) => setData({ html: v })}
            />
          </div>
          <Select
            label="Align"
            value={data.align ?? ""}
            onChange={(v) => setData({ align: v })}
            options={ALIGN_OPTIONS}
          />
          <p className="text-[11px] text-slate-400">
            Write the whole section in one box: use the <b>H</b> buttons in the
            toolbar to make a line a real heading. Headings written here are
            picked up by the Outline panel and read by Google.
          </p>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <TextArea
            label="Quote"
            value={data.text}
            onChange={(v) => setData({ text: v })}
            rows={3}
          />
          <Text
            label="Author (optional)"
            value={data.author}
            onChange={(v) => setData({ author: v })}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-3">
          <ImageField
            label="Image URL"
            value={data.src}
            onChange={(v) => setData({ src: v })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text
              label="Alt text"
              value={data.alt}
              onChange={(v) => setData({ alt: v })}
            />
            <Text
              label="Caption"
              value={data.caption}
              onChange={(v) => setData({ caption: v })}
            />
            <MiniField
              label="Width (%)"
              value={data.width}
              onChange={(v) => setData({ width: v })}
              placeholder="100"
            />
            <Select
              label="Align"
              value={data.align ?? ""}
              onChange={(v) => setData({ align: v })}
              options={ALIGN_OPTIONS}
            />
          </div>
        </div>
      );

    case "button":
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Text
            label="Label"
            value={data.label}
            onChange={(v) => setData({ label: v })}
          />
          <Text
            label="Link URL"
            value={data.href}
            onChange={(v) => setData({ href: v })}
            placeholder="/booking-catalog"
          />
          <Select
            label="Style"
            value={data.variant ?? "solid"}
            onChange={(v) => setData({ variant: v })}
            options={[
              { label: "Solid", value: "solid" },
              { label: "Outline", value: "outline" },
            ]}
          />
          <Select
            label="Align"
            value={data.align ?? ""}
            onChange={(v) => setData({ align: v })}
            options={ALIGN_OPTIONS}
          />
        </div>
      );

    case "html":
      return (
        <div className="space-y-3">
          <TextArea
            label="HTML"
            value={data.html}
            onChange={(v) => setData({ html: v })}
            rows={8}
          />
          <p className="text-[11px] text-slate-400">
            Rendered as-is on the page. Only paste markup you trust.
          </p>
        </div>
      );

    case "divider":
      return (
        <p className="text-xs text-slate-400">
          A horizontal rule. No settings.
        </p>
      );

    case "spacer":
      return (
        <MiniField
          label="Height"
          value={data.height}
          onChange={(v) => setData({ height: v })}
          placeholder="e.g. 32px or 2rem"
        />
      );

    case "columns": {
      const columns = asArray(data, "columns");
      const shown = Number(data.count) || columns.length || 2;
      const updateColumn = (index: number, patch: AnyRecord) =>
        setData({
          columns: columns.map((column, i) =>
            i === index ? { ...column, ...patch } : column,
          ),
        });

      return (
        <div className="space-y-3">
          <Select
            label="Columns shown"
            value={String(shown)}
            onChange={(v) => setData({ count: Number(v) })}
            options={[1, 2, 3, 4].map((n) => ({
              label: String(n),
              value: String(n),
            }))}
          />

          {columns.map((column, index) => (
            <div
              key={index}
              className="rounded-md border border-slate-200 bg-slate-50/50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Column {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      columns: columns.filter((_, i) => i !== index),
                      count: Math.max(1, shown - 1),
                    })
                  }
                  className="text-red-400 hover:text-red-600"
                  aria-label="Remove column"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <Text
                label="Heading (optional)"
                value={column.heading}
                onChange={(v) => updateColumn(index, { heading: v })}
              />
              <div className="mt-2">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Intro text (optional)
                </span>
                <TextEditor
                  value={column.html || ""}
                  onChange={(v) => updateColumn(index, { html: v })}
                />
              </div>

              <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-white p-2">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Blocks in this column
                </p>
                <BlockEditor
                  sections={(column.blocks as PageSection[]) || []}
                  onChange={(blocks) => updateColumn(index, { blocks })}
                  allowedTypes={NESTED_BLOCK_TYPES}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setData({
                columns: [
                  ...columns,
                  { heading: "", html: "", blocks: [] },
                ],
                count: Math.min(4, columns.length + 1),
              })
            }
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add column
          </button>
        </div>
      );
    }

    case PAGE_STYLES_TYPE:
      return (
        <p className="text-xs text-slate-400">
          This block renders nothing on its own — use the Typography panel below
          to set this page’s H1-H6, paragraph, span and link styles.
        </p>
      );

    case "richText":
    default:
      return (
        <div className="space-y-3">
          <Text label="Heading" value={block.title} onChange={(v) => patch({ title: v })} />
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">Content</span>
            <TextEditor
              value={block.content || ""}
              onChange={(val) => patch({ content: val })}
            />
          </div>
        </div>
      );
  }
}

export default function BlockEditor({
  sections,
  onChange,
  allowedTypes,
  pageHeading,
}: {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
  /**
   * Restricts which types the "add a block" picker offers. Pages whose layout is
   * assembled from blocks pass GENERIC_BLOCK_TYPES so the picker cannot offer a
   * type their page does not render. Existing blocks are always editable.
   */
  allowedTypes?: string[];
  /** The H1 the page template renders, shown at the top of the outline. */
  pageHeading?: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const { notify } = useAdminToast();
  const [reusable, setReusable] = useState<ReusableBlock[]>([]);
  const [copyFor, setCopyFor] = useState<string | null>(null);
  const [pageList, setPageList] = useState<PageContent[] | null>(null);
  const [libraryFor, setLibraryFor] = useState<number | "end" | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [showOutline, setShowOutline] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const [pasteReplace, setPasteReplace] = useState(false);

  useEffect(() => {
    setReusable(loadReusableBlocks());
  }, []);

  // Escape closes the block library.
  useEffect(() => {
    if (libraryFor === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLibraryFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [libraryFor]);

  const ordered = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /** Persist a new order, normalising `order` to the array position. */
  const commit = (next: PageSection[]) =>
    onChange(next.map((block, index) => ({ ...block, order: index })));

  const updateBlock = (
    index: number,
    patch: Partial<PageSection>,
    dataPatch?: AnyRecord,
  ) => {
    commit(
      ordered.map((block, i) => {
        if (i !== index) return block;
        const next: PageSection = { ...block, ...patch };
        if (dataPatch) {
          next.data = { ...((block.data as AnyRecord) || {}), ...dataPatch };
        }
        return next;
      }),
    );
  };

  const removeBlock = (index: number) =>
    commit(ordered.filter((_, i) => i !== index));

  const duplicateBlock = (index: number) => {
    const source = ordered[index];
    if (!source) return;
    const copy: PageSection = {
      ...source,
      sectionKey: `${source.type || "block"}-${Date.now()}`,
      data: JSON.parse(JSON.stringify(source.data || {})),
      styles: source.styles
        ? JSON.parse(JSON.stringify(source.styles))
        : undefined,
    };
    const next = [...ordered];
    next.splice(index + 1, 0, copy);
    commit(next);
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  /** Drag-and-drop reorder: drop the dragged block at the target position. */
  const reorderBlock = (from: number, to: number) => {
    if (from === to) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const addBlockAt = (type: string, at: number | "end") => {
    const block: PageSection = {
      sectionKey: `${type}-${Date.now()}`,
      type,
      title: "",
      content: "",
      order: 0,
      visible: true,
      data: {},
    };
    const next = [...ordered];
    if (at === "end") next.push(block);
    else next.splice(at, 0, block);
    commit(next);
    setLibraryFor(null);
    setLibraryQuery("");
  };

  const expandAll = () => setCollapsed({});

  const collapseAll = () =>
    setCollapsed(
      Object.fromEntries(
        ordered.map((block, index) => [
          block.sectionKey || `${block.type || "richText"}-${index}`,
          true,
        ]),
      ),
    );

  /* --- Reusable blocks (this browser) ------------------------------------ */

  const persistReusable = (items: ReusableBlock[]) => {
    setReusable(items);
    try {
      window.localStorage.setItem(REUSABLE_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable - keep it for this session only */
    }
  };

  const saveReusable = (block: PageSection) => {
    const fallback = BLOCK_LABELS[block.type || "richText"] || "Block";
    const name = window.prompt("Name for this reusable block", fallback);
    if (!name || !name.trim()) return;
    persistReusable([
      ...reusable,
      { id: `rb-${Date.now()}`, name: name.trim(), block: deepCopy(block) },
    ]);
    notify({
      title: "Saved",
      message: `“${name.trim()}” can now be inserted on any page.`,
      variant: "success",
    });
  };

  const removeReusable = (id: string) =>
    persistReusable(reusable.filter((item) => item.id !== id));

  const insertReusable = (item: ReusableBlock) => {
    const block: PageSection = {
      ...deepCopy(item.block),
      sectionKey: `${item.block.type || "block"}-${Date.now()}`,
    };
    const at = libraryFor === null ? "end" : libraryFor;
    const next = [...ordered];
    if (at === "end") next.push(block);
    else next.splice(at, 0, block);
    commit(next);
    setLibraryFor(null);
    setLibraryQuery("");
  };

  /* --- Copy a block to another page -------------------------------------- */

  const openCopyTo = async (key: string) => {
    setCopyFor(key);
    if (pageList) return;
    try {
      setPageList(await getAllPageContent());
    } catch {
      notify({
        title: "Error",
        message: "Could not load the page list",
        variant: "error",
      });
    }
  };

  const copyBlockToPage = async (target: PageContent, block: PageSection) => {
    try {
      const current = await getPageContentByKey(target.pageType, target.pageKey);
      const sections = [...(current?.sections || [])];
      sections.push({
        ...deepCopy(block),
        sectionKey: `${block.type || "block"}-${Date.now()}`,
        order: sections.length,
      });
      await upsertPageContent(target.pageType, target.pageKey, { sections });
      notify({
        title: "Copied",
        message: `Block copied to ${target.pageType} · ${target.pageKey}.`,
        variant: "success",
      });
      setCopyFor(null);
    } catch {
      notify({
        title: "Error",
        message: "Could not copy the block",
        variant: "error",
      });
    }
  };

  /* --- Heading outline ---------------------------------------------------- */

  const outline = pageOutline(pageHeading, ordered);
  const issues = outlineIssues(outline);

  const copyOutline = async () => {
    const text = outline
      .map(
        (item) =>
          `${"  ".repeat(Math.max(0, item.level - 1))}H${item.level}: ${item.text}`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      notify({
        title: "Copied",
        message: "Heading outline copied to the clipboard.",
        variant: "success",
      });
    } catch {
      notify({
        title: "Error",
        message: "Could not copy the outline.",
        variant: "error",
      });
    }
  };

  /* --- Paste content ------------------------------------------------------ */

  const convertPasted = () => {
    const created = htmlToBlocks(pasteHtml);
    if (created.length === 0) {
      notify({
        title: "Nothing to add",
        message: "Paste some content first.",
        variant: "error",
      });
      return;
    }
    commit([...(pasteReplace ? [] : ordered), ...created]);
    setShowPaste(false);
    setPasteHtml("");
    setPasteReplace(false);
    notify({
      title: "Content added",
      message: `${created.length} block${
        created.length === 1 ? "" : "s"
      } created from your paste.`,
      variant: "success",
    });
  };

  const addable = (
    allowedTypes
      ? BLOCK_CATALOG.filter((entry) => allowedTypes.includes(entry.type))
      : BLOCK_CATALOG
  ).filter((entry) => {
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return true;
    return `${entry.label} ${entry.description} ${entry.type}`
      .toLowerCase()
      .includes(q);
  });

  const groups = Array.from(
    new Set(addable.map((entry) => entry.group || "Blocks")),
  );

  return (
    <div className="space-y-3">
      {/* Builder toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <LayoutGrid className="h-4 w-4 text-slate-400" />
          <span className="font-semibold text-slate-700">
            {ordered.length} block{ordered.length === 1 ? "" : "s"}
          </span>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={() => setShowOutline((value) => !value)}
            className={`inline-flex items-center gap-1 ${
              showOutline
                ? "font-semibold text-brand-orange-600"
                : "hover:text-slate-800"
            }`}
          >
            <ListTree className="h-3.5 w-3.5" /> Outline
          </button>
          {ordered.length > 0 ? (
            <>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-slate-800"
              >
                Expand all
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-slate-800"
              >
                Collapse all
              </button>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPaste(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste content
          </button>
          <button
            type="button"
            onClick={() => setLibraryFor("end")}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-black-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-black-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add block
          </button>
        </div>
      </div>

      {showOutline ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-700">
                Heading outline
              </span>
              <span className="text-slate-400">{outline.length} headings</span>
              {issues.length === 0 ? (
                <span className="font-medium text-green-600">
                  ✓ structure looks good
                </span>
              ) : (
                <span className="font-medium text-amber-600">
                  {issues.length} thing{issues.length === 1 ? "" : "s"} to check
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={copyOutline}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardCopy className="h-3.5 w-3.5" /> Copy outline
            </button>
          </div>
          {outline.length === 0 ? (
            <p className="text-xs text-slate-400">
              No headings yet — add a Heading block, or fill in the hero/body
              headings.
            </p>
          ) : (
            <ol className="space-y-1">
              {outline.map((item, index) => (
                <li
                  key={`${item.level}-${index}`}
                  className="flex items-baseline gap-2"
                  style={{ paddingLeft: `${(item.level - 1) * 18}px` }}
                >
                  <span className="w-7 shrink-0 rounded bg-slate-100 px-1 text-center text-[10px] font-semibold text-slate-500">
                    H{item.level}
                  </span>
                  <span className="truncate text-sm text-slate-700">
                    {item.text}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {issues.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {issues.map((issue, index) => (
                <li
                  key={index}
                  className={`text-[11px] ${
                    issue.level === "error" ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {issue.level === "error" ? "✕ " : "! "}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {ordered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            This page has no sections yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add your first block to start building the page.
          </p>
          <button
            type="button"
            onClick={() => setLibraryFor("end")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-black-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-black-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add block
          </button>
        </div>
      ) : (
        <InsertPoint onAdd={() => setLibraryFor(0)} />
      )}

      {ordered.map((block, index) => {
        const type = block.type || "richText";
        const key = block.sectionKey || `${type}-${index}`;
        const isCollapsed = collapsed[key] ?? false;
        const isDragging = dragIndex === index;
        const isDropTarget =
          overIndex === index && dragIndex !== null && dragIndex !== index;
        const isStyled = Object.keys(block.styles?.typography || {}).length > 0;
        const summary = blockSummary(block);

        return (
          <Fragment key={key}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== index) setOverIndex(index);
              }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) reorderBlock(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`rounded-lg border bg-white transition-shadow ${
              isDropTarget
                ? "border-brand-orange-400 ring-2 ring-brand-orange-100"
                : "border-slate-200"
            } ${isDragging ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [key]: !isCollapsed }))
                  }
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={isCollapsed ? "Expand block" : "Collapse block"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <span
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <BlockIcon type={type} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-brand-black-950">
                      {BLOCK_LABELS[type] ?? type}
                    </span>
                    {isStyled ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-orange-50 px-2 py-0.5 text-[10px] font-semibold text-brand-orange-700">
                        <Type className="h-2.5 w-2.5" /> styled
                      </span>
                    ) : null}
                    {block.visible === false ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Hidden
                      </span>
                    ) : null}
                  </span>
                  {summary ? (
                    <span className="block truncate text-[11px] text-slate-400">
                      {summary}
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateBlock(index, { visible: block.visible === false })
                  }
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={block.visible === false ? "Show" : "Hide"}
                  title={block.visible === false ? "Show on site" : "Hide from site"}
                >
                  {block.visible === false ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBlock(index)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Duplicate block"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => saveReusable(block)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Save as reusable block"
                  title="Save as reusable block"
                >
                  <BookmarkPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openCopyTo(key)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Copy to another page"
                  title="Copy to another page"
                >
                  <FolderInput className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Delete block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {copyFor === key ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 p-3">
                <span className="text-xs font-medium text-slate-600">
                  Copy this block to:
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const target = (pageList || []).find(
                      (page) => page._id === e.target.value,
                    );
                    if (target) copyBlockToPage(target, block);
                  }}
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                >
                  <option value="" disabled>
                    Choose a page…
                  </option>
                  {(pageList || []).map((page) => (
                    <option key={page._id} value={page._id}>
                      {page.pageType} · {page.pageKey}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCopyFor(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {isCollapsed ? null : (
              <div className="space-y-3 border-t border-slate-100 p-3">
                <BlockFields
                  block={block}
                  patch={(patch, dataPatch) =>
                    updateBlock(index, patch, dataPatch)
                  }
                />
                <details
                  open={type === PAGE_STYLES_TYPE}
                  className="rounded-md border border-slate-200"
                >
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600">
                    <Type className="h-3.5 w-3.5" /> Typography &amp; spacing
                  </summary>
                  <div className="border-t border-slate-100 p-3">
                    <TypographyPanel
                      styles={block.styles}
                      onChange={(styles) => updateBlock(index, { styles })}
                    />
                  </div>
                </details>
              </div>
            )}
          </div>
            <InsertPoint onAdd={() => setLibraryFor(index + 1)} />
          </Fragment>
        );
      })}

      {libraryFor !== null ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-brand-black-950/40 p-4 pt-14 backdrop-blur-sm"
          onClick={() => setLibraryFor(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-brand-black-950">
                Add a block
              </p>
              <button
                type="button"
                onClick={() => setLibraryFor(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-slate-100 px-4 py-3">
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  placeholder="Search blocks..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {reusable.length > 0 ? (
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Reusable
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {reusable.map((item) => (
                      <span
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                      >
                        <button
                          type="button"
                          onClick={() => insertReusable(item)}
                          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-brand-black-950 hover:text-brand-orange-600"
                          title="Insert this reusable block"
                        >
                          {item.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeReusable(item.id)}
                          className="text-slate-300 hover:text-red-600"
                          aria-label="Delete reusable block"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {groups.map((group) => (
                <div key={group} className="mb-5 last:mb-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {group}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {addable
                      .filter((entry) => (entry.group || "Blocks") === group)
                      .map((entry) => (
                        <button
                          key={entry.type}
                          type="button"
                          onClick={() =>
                            addBlockAt(
                              entry.type,
                              libraryFor === null ? "end" : libraryFor,
                            )
                          }
                          className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-orange-400 hover:bg-brand-orange-50/50"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                            <BlockIcon type={entry.type} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-brand-black-950">
                              {entry.label}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {entry.description}
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}

              {addable.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No blocks match your search.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showPaste ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-brand-black-950/40 p-4 pt-14 backdrop-blur-sm"
          onClick={() => setShowPaste(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-brand-black-950">
                Paste content
              </p>
              <button
                type="button"
                onClick={() => setShowPaste(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-3 text-xs text-slate-500">
                Paste your copy straight from the old site, Word or Google Docs.
                Headings become Heading blocks and the text between them becomes
                Paragraph blocks. A pasted H1 is turned into an H2, because the
                page template already renders the page&apos;s one H1.
              </p>
              <TextEditor value={pasteHtml} onChange={setPasteHtml} />
              <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={pasteReplace}
                  onChange={(event) => setPasteReplace(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Replace all existing blocks instead of adding to them
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setShowPaste(false)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={convertPasted}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-black-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-black-900"
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> Convert to blocks
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

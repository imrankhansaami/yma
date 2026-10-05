"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import TextEditor from "@/components/admin/inventory/TextEditor";
import { BLOCK_CATALOG, BLOCK_LABELS } from "@/lib/blocks/types";
import type { PageSection } from "@/services/pageContent.service";

type AnyRecord = Record<string, any>;

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
                <TextArea label="Description" value={item.description} onChange={(v) => update({ description: v })} rows={2} />
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
          <TextArea label="Paragraph" value={data.body} onChange={(v) => setData({ body: v })} rows={3} />
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
              <TextArea label="Quote" value={item.quote} onChange={(v) => update({ quote: v })} rows={3} />
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
          <TextArea label="Intro" value={data.subtitle} onChange={(v) => setData({ subtitle: v })} rows={2} />
          <StringList label="Badges" value={data.badges} onChange={(badges) => setData({ badges })} />
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          <Text label="Eyebrow" value={data.eyebrow} onChange={(v) => setData({ eyebrow: v })} />
          <Text label="Title" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Intro" value={data.intro} onChange={(v) => setData({ intro: v })} rows={2} />
          <Repeater
            label="Questions"
            items={asArray(data, "items")}
            onChange={(items) => setData({ items })}
            makeItem={() => ({ question: "", answer: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Question" value={item.question} onChange={(v) => update({ question: v })} />
                <TextArea label="Answer" value={item.answer} onChange={(v) => update({ answer: v })} rows={3} />
              </div>
            )}
          />
        </div>
      );

    case "bulletList":
      return (
        <div className="space-y-3">
          <Text label="Heading" value={data.title} onChange={(v) => setData({ title: v })} />
          <TextArea label="Intro" value={data.intro} onChange={(v) => setData({ intro: v })} rows={2} />
          <Repeater
            label="Items"
            items={asArray(data, "items")}
            onChange={(items) => setData({ items })}
            makeItem={() => ({ title: "", text: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Text" value={item.text} onChange={(v) => update({ text: v })} rows={2} />
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

    case "locationHero":
      return (
        <div className="space-y-3">
          <Text label="Headline" value={data.title} onChange={(v) => setData({ title: v })} />
          <StringList label="Paragraphs" value={data.paragraphs} onChange={(paragraphs) => setData({ paragraphs })} />
        </div>
      );

    case "locationBody":
      return (
        <div className="space-y-3">
          <Text label="About heading" value={data.aboutTitle} onChange={(v) => setData({ aboutTitle: v })} />
          <StringList label="About paragraphs" value={data.aboutParagraphs} onChange={(aboutParagraphs) => setData({ aboutParagraphs })} />
          <Text label="Why choose us heading" value={data.whyTitle} onChange={(v) => setData({ whyTitle: v })} />
          <Repeater
            label="Why choose us points"
            items={asArray(data, "whyItems")}
            onChange={(whyItems) => setData({ whyItems })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Body" value={item.body} onChange={(v) => update({ body: v })} rows={3} />
              </div>
            )}
          />
          <Text label="Services heading" value={data.servicesTitle} onChange={(v) => setData({ servicesTitle: v })} />
          <Repeater
            label="Services"
            items={asArray(data, "servicesItems")}
            onChange={(servicesItems) => setData({ servicesItems })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Body" value={item.body} onChange={(v) => update({ body: v })} rows={3} />
              </div>
            )}
          />
          <Text label="Safety heading" value={data.safetyTitle} onChange={(v) => setData({ safetyTitle: v })} />
          <Repeater
            label="Safety points"
            items={asArray(data, "safetyItems")}
            onChange={(safetyItems) => setData({ safetyItems })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Body" value={item.body} onChange={(v) => update({ body: v })} rows={3} />
              </div>
            )}
          />
          <Text label="Occasions heading" value={data.occasionsTitle} onChange={(v) => setData({ occasionsTitle: v })} />
          <Text label="Occasions subheading" value={data.occasionsSubtitle} onChange={(v) => setData({ occasionsSubtitle: v })} />
          <StringList label="Occasions" value={data.occasionsItems} onChange={(occasionsItems) => setData({ occasionsItems })} />
        </div>
      );

    case "seoContent":
      return (
        <div className="space-y-3">
          <Text label="Main heading" value={data.heading} onChange={(v) => setData({ heading: v })} />
          <TextArea label="Intro paragraph" value={data.intro} onChange={(v) => setData({ intro: v })} rows={4} />
          <Text label="Reasons heading" value={data.reasonsHeading} onChange={(v) => setData({ reasonsHeading: v })} />
          <Repeater
            label="Reasons"
            items={asArray(data, "reasons")}
            onChange={(reasons) => setData({ reasons })}
            makeItem={() => ({ title: "", body: "" })}
            renderItem={(item, update) => (
              <div className="space-y-2">
                <Text label="Title" value={item.title} onChange={(v) => update({ title: v })} />
                <TextArea label="Body" value={item.body} onChange={(v) => update({ body: v })} rows={3} />
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
                <TextArea label="Body" value={item.body} onChange={(v) => update({ body: v })} rows={3} />
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
}: {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}) {
  const updateBlock = (
    index: number,
    patch: Partial<PageSection>,
    dataPatch?: AnyRecord,
  ) => {
    onChange(
      sections.map((block, i) => {
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
    onChange(sections.filter((_, i) => i !== index));

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((block, i) => ({ ...block, order: i })));
  };

  const addBlock = (type: string) => {
    onChange([
      ...sections,
      {
        sectionKey: `${type}-${Date.now()}`,
        type,
        title: "",
        content: "",
        order: sections.length,
        visible: true,
        data: {},
      },
    ]);
  };

  const ordered = [...sections].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <div className="space-y-4">
      {ordered.map((block, index) => {
        const type = block.type || "richText";
        return (
          <div
            key={block.sectionKey || index}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {BLOCK_LABELS[type] ?? type}
                </span>
                {block.visible === false ? (
                  <span className="text-[11px] font-medium text-amber-600">
                    Hidden
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
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

            <BlockFields
              block={block}
              patch={(patch, dataPatch) => updateBlock(index, patch, dataPatch)}
            />
          </div>
        );
      })}

      <div className="rounded-lg border border-dashed border-slate-300 p-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {BLOCK_CATALOG.map((entry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => addBlock(entry.type)}
              title={entry.description}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              + {entry.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import type {
  BlockStyles,
  PageBlock,
  TextStyle,
  TypographyMap,
  TypographyRole,
} from "./types";
import { PAGE_STYLES_SCOPE_CLASS } from "./types";

/** Values are injected into a <style> tag, so strip anything that could break out. */
function safeValue(value?: string): string {
  return String(value ?? "")
    .replace(/[;{}<>\\]/g, "")
    .replace(/\/\*/g, "")
    .trim();
}

/** A stable, CSS-safe class name for a block. */
export function blockClassName(
  block?: Pick<PageBlock, "sectionKey"> | null,
): string {
  const key = String(block?.sectionKey || "block").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `cms-blk-${key}`;
}

const ELEMENT_ROLES: TypographyRole[] = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "li",
];

function textStyleCss(style?: TextStyle): string {
  if (!style) return "";
  const out: string[] = [];
  const add = (prop: string, value?: string) => {
    const v = safeValue(value);
    if (v) out.push(`${prop}:${v}`);
  };
  add("font-family", style.fontFamily);
  add("font-size", style.fontSize);
  add("font-weight", style.fontWeight);
  add("font-style", style.fontStyle);
  add("line-height", style.lineHeight);
  add("letter-spacing", style.letterSpacing);
  add("text-transform", style.textTransform);
  add("text-align", style.textAlign);
  add("color", style.color);
  add("margin-top", style.marginTop);
  add("margin-bottom", style.marginBottom);
  return out.join(";");
}

function typographyRules(selector: string, typography?: TypographyMap): string[] {
  if (!typography) return [];
  const rules: string[] = [];

  const base = textStyleCss(typography.base);
  if (base) rules.push(`${selector}{${base}}`);

  for (const role of ELEMENT_ROLES) {
    const css = textStyleCss(typography[role]);
    if (css) rules.push(`${selector} ${role}{${css}}`);
  }

  return rules;
}

/** Scoped CSS for one block's wrapper and its text elements. */
export function blockStyleCss(block?: PageBlock | null): string {
  const styles: BlockStyles | undefined = block?.styles;
  if (!styles) return "";

  const cls = `.${blockClassName(block)}`;
  const rules = typographyRules(cls, styles.typography);

  const wrapper: string[] = [];
  const add = (prop: string, value?: string) => {
    const v = safeValue(value);
    if (v) wrapper.push(`${prop}:${v}`);
  };
  add("margin-top", styles.marginTop);
  add("margin-bottom", styles.marginBottom);
  const py = safeValue(styles.paddingY);
  if (py) wrapper.push(`padding-top:${py}`, `padding-bottom:${py}`);
  add("background", styles.background);
  if (wrapper.length) rules.push(`${cls}{${wrapper.join(";")}}`);

  return rules.join("");
}

/** Page-wide typography from a "pageStyles" block, scoped to the page wrapper. */
export function pageStyleCss(block?: PageBlock | null): string {
  const typography: TypographyMap | undefined = block?.styles?.typography;
  return typographyRules(`.${PAGE_STYLES_SCOPE_CLASS}`, typography).join("");
}

/** True when a block carries anything worth rendering a wrapper for. */
export function hasBlockStyles(block?: PageBlock | null): boolean {
  return Boolean(blockStyleCss(block));
}

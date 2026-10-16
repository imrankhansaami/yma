import type { ReactNode } from "react";

import { blockClassName, blockStyleCss } from "@/lib/blocks/blockStyles";
import type { PageBlock } from "@/lib/blocks/types";

/**
 * Applies a block's saved presentation (typography, spacing) by rendering a
 * scoped wrapper with its generated CSS.
 *
 * Blocks with no overrides render exactly as before - no wrapper, no styles -
 * so pages saved before this feature are untouched.
 */
export function BlockStyleScope({
  block,
  children,
}: {
  block?: PageBlock | null;
  children: ReactNode;
}) {
  const css = blockStyleCss(block);
  if (!css) return <>{children}</>;

  return (
    <div className={blockClassName(block)}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </div>
  );
}

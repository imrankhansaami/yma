import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths, tags } = body;

  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const hasPaths = Array.isArray(paths) && paths.length > 0;
  const hasTags = Array.isArray(tags) && tags.length > 0;

  if (!hasPaths && !hasTags) {
    return NextResponse.json(
      { message: "paths or tags array is required" },
      { status: 400 }
    );
  }

  const revalidated: string[] = [];
  for (const path of hasPaths ? paths : []) {
    if (typeof path === "string" && path.startsWith("/")) {
      revalidatePath(path);
      revalidated.push(path);
    }
  }

  // Purge the underlying CMS fetch entries so the regenerated page reads fresh
  // data instead of the copy cached when the fetch was first made.
  const tagsRevalidated: string[] = [];
  for (const tag of hasTags ? tags : []) {
    if (typeof tag === "string" && tag.trim()) {
      revalidateTag(tag);
      tagsRevalidated.push(tag);
    }
  }

  return NextResponse.json({
    revalidated,
    tags: tagsRevalidated,
    now: Date.now(),
  });
}

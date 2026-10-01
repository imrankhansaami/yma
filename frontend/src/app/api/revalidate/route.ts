import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, paths } = body;

  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json(
      { message: "paths array is required" },
      { status: 400 }
    );
  }

  const revalidated: string[] = [];
  for (const path of paths) {
    if (typeof path === "string" && path.startsWith("/")) {
      revalidatePath(path);
      revalidated.push(path);
    }
  }

  return NextResponse.json({
    revalidated,
    now: Date.now(),
  });
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { downloadImageAsset, isStorageConfigured } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  if (!prisma || !isStorageConfigured()) {
    return NextResponse.json({ error: "Asset storage is not configured." }, { status: 503 });
  }

  const { assetId } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const downloaded = await downloadImageAsset(asset.storageKey);

  return new NextResponse(downloaded.body as unknown as BodyInit, {
    headers: {
      "Content-Type": downloaded.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

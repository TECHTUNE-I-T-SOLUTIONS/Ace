import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/Ace/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ACE-App",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch release" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const apkAsset = data.assets?.find((asset: any) =>
      asset.name.endsWith(".apk")
    );

    return NextResponse.json({
      version: data.tag_name || data.name,
      url: data.html_url,
      downloadUrl: apkAsset?.browser_download_url || null,
      publishedAt: data.published_at,
      notes: data.body,
      size: apkAsset?.size || null,
    });
  } catch (error) {
    console.error("Failed to fetch release:", error);
    return NextResponse.json(
      { error: "Failed to fetch release" },
      { status: 500 }
    );
  }
}
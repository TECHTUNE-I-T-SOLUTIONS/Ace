import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadUrl = searchParams.get("url");

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Download URL is required" },
        { status: 400 }
      );
    }

    // Fetch the file from GitHub
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "ACE-App",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: response.status }
      );
    }

    // Get the filename from the URL
    const filename = downloadUrl.split("/").pop() || "download.apk";

    // Get the content type
    const contentType = response.headers.get("content-type") || "application/vnd.android.package-archive";

    // Get the content length if available
    const contentLength = response.headers.get("content-length");

    // Stream the response body directly instead of buffering
    const stream = response.body;

    if (!stream) {
      throw new Error("No response body");
    }

    // Create a new response with streaming
    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...(contentLength && { "Content-Length": contentLength }),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    if (!imageFile && !imageUrl) {
      return NextResponse.json(
        { error: "No image file or URL provided" },
        { status: 400 }
      );
    }

    // 1. Fetch image binary buffer
    let imageArrayBuffer: ArrayBuffer;
    let mimeType = "image/png";

    if (imageFile) {
      imageArrayBuffer = await imageFile.arrayBuffer();
      mimeType = imageFile.type || "image/png";
    } else if (imageUrl) {
      // Resolve relative URLs (e.g. /api/proxy/...) to absolute URL for server-side fetch
      const absoluteUrl = new URL(imageUrl, req.url).toString();
      const imgRes = await fetch(absoluteUrl);
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL (${imgRes.status})` },
          { status: 400 }
        );
      }
      mimeType = imgRes.headers.get("content-type") || "image/png";
      imageArrayBuffer = await imgRes.arrayBuffer();
    } else {
      return NextResponse.json({ error: "Invalid image input" }, { status: 400 });
    }

    const removeBgApiKey = process.env.REMOVE_BG_API_KEY;

    // Method 1: Remove.bg API (If API key is present in environment)
    if (removeBgApiKey) {
      const apiFormData = new FormData();
      const imageBlob = new Blob([imageArrayBuffer], { type: mimeType });
      apiFormData.append("image_file", imageBlob, "photo.png");
      apiFormData.append("size", "auto");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": removeBgApiKey,
        },
        body: apiFormData,
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // Method 2: Free Hugging Face RMBG-1.4 Open-Source AI Model Endpoint
    const hfToken = process.env.HUGGINGFACE_API_KEY || "";
    const hfHeaders: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };
    if (hfToken) {
      hfHeaders["Authorization"] = `Bearer ${hfToken}`;
    }

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        method: "POST",
        headers: hfHeaders,
        body: imageArrayBuffer,
      }
    );

    if (hfResponse.ok) {
      const transparentImageBuffer = await hfResponse.arrayBuffer();
      return new NextResponse(transparentImageBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Return friendly error if external API services are unreachable
    return NextResponse.json(
      {
        error:
          "Background removal service is currently busy. Please configure REMOVE_BG_API_KEY in .env or try again.",
      },
      { status: 502 }
    );
  } catch (err) {
    console.error("Background Removal API Error:", err);
    return NextResponse.json(
      { error: "Failed to process background removal." },
      { status: 500 }
    );
  }
}

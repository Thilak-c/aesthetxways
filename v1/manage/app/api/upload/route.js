import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    let fileList = [];
    if (formData.has("files")) {
      fileList = formData.getAll("files");
    } else if (formData.has("images")) {
      fileList = formData.getAll("images");
    } else if (formData.has("file")) {
      fileList = [formData.get("file")];
    } else if (formData.has("image")) {
      fileList = [formData.get("image")];
    }

    fileList = fileList.filter((f) => f && typeof f === "object" && f.name && f.size > 0);

    if (fileList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files uploaded. Please attach at least one image." },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "uploads_files");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_INSYS_URL || "https://manage.aesthetxways.com";

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type && !validTypes.includes(file.type)) {
        continue;
      }

      const ext = path.extname(file.name || ".png").toLowerCase() || ".png";
      const filename = `product_${Date.now()}_${i}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      const url = `${baseUrl}/api/uploads/${filename}`;
      results.push({
        url,
        filename,
        originalName: file.name,
        size: buffer.length,
      });
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid image files processed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      files: results,
      urls: results.map((r) => r.url),
      url: results[0].url,
      filename: results[0].filename,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    return NextResponse.json(
      { success: false, error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST an image file to upload",
  });
}

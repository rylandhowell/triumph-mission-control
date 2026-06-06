import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const isInsurance = pathname.startsWith("insurance/");
        const isHousePlan = pathname.startsWith("houseplans/");
        if (!isInsurance && !isHousePlan) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "application/octet-stream",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ purpose: isInsurance ? "subs-insurance" : "job-houseplans" }),
        };
      },
      onUploadCompleted: async () => {
        // no-op
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[BLOB-UPLOAD] token generation failed", error);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 400 },
    );
  }
}

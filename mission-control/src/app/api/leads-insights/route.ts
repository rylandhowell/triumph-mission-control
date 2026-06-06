import { NextResponse } from "next/server";

const INSIGHTS_URL = "https://triumphhomesinc.com/api/insights";

export async function GET() {
  try {
    const r = await fetch(INSIGHTS_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`Insights upstream ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        totals: { pageViews: 0, ctaClicks: 0, formStarts: 0, formSubmits: 0 },
        daily: {},
        updatedAt: null,
        error: String(err?.message || err),
      },
      { status: 200 },
    );
  }
}

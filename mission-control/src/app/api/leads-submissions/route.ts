import { NextResponse } from "next/server";

const URL = "https://triumphhomesinc.com/api/leads-submissions";

export async function GET() {
  try {
    const r = await fetch(URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`Submissions upstream ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ submissions: [], updatedAt: null, error: String(err?.message || err) }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Submissions post upstream ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Submissions patch upstream ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 200 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Submissions delete upstream ${r.status}`);
    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 200 });
  }
}

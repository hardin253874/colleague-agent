import { NextResponse } from 'next/server';

// TODO: GET → colleague metadata; DELETE → remove colleague
export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

const factsFilePath = path.join(process.cwd(), 'src', 'data', 'facts.json');

export async function GET() {
    const file = await readFile(factsFilePath, 'utf8');
    const facts = JSON.parse(file);
    return NextResponse.json(facts);
}
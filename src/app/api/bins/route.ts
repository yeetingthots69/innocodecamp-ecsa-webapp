import { NextRequest, NextResponse } from 'next/server';
import { Bin } from '@/types/bins';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';

const binFilePath = path.join(process.cwd(), 'src', 'data', 'bins.json');

export async function GET() {
    const response = await fetch('http://localhost:3000/bins');
    const data = await response.json();
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const newBin: Bin = await request.json();
    // Read existing bins
    const file = await readFile(binFilePath, "utf8");
    const bins: Bin[] = JSON.parse(file);
    // Check if bin already exists
    const existingBin = bins.find(bin => bin.id === newBin.id);
    if (existingBin) {
        return NextResponse.json({ success: false, message: `Bin with ID ${newBin.id} already exists. Bin name: ${existingBin.name}` }, { status: 400 });
    }
    // Add new bin
    bins.push(newBin);
    // Write updated bins back to file
    await writeFile(binFilePath, JSON.stringify(bins, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: `Bin ${newBin.name} added successfully` });
}

export async function PUT(request: NextRequest) {
    const updatedBin: Bin = await request.json();
    const file = await readFile(binFilePath, "utf8");
    const bins: Bin[] = JSON.parse(file);

    const index = bins.findIndex(bin => bin.id === updatedBin.id);
    if (index === -1) {
        return NextResponse.json({ success: false, message: `Bin with ID ${updatedBin.id} not found` }, { status: 404 });
    }
    bins[index] = updatedBin;
    await writeFile(binFilePath, JSON.stringify(bins, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: `Bin ${updatedBin.name} updated successfully` });
}

export async function DELETE(request: NextRequest) {
    const { id } = await request.json();
    const file = await readFile(binFilePath, "utf8");
    let bins: Bin[] = JSON.parse(file);

    const index = bins.findIndex(bin => bin.id === id);
    if (index === -1) {
        return NextResponse.json({ success: false, message: `Bin with ID ${id} not found` }, { status: 404 });
    }
    bins.splice(index, 1);
    await writeFile(binFilePath, JSON.stringify(bins, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: `Bin with ID ${id} deleted successfully` });
}
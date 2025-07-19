import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    const { email, password } = await req.json();

    const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
    const file = await readFile(filePath, 'utf8');
    const users = JSON.parse(file);
    console.log("Users: " + users);

    const user = users.find(
        (u: any) => u.email === email && u.password === password
    );

    if (user) {
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}
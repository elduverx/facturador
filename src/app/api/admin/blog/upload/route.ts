import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imagenes' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.png';
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    await mkdir(uploadDir, { recursive: true });
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(arrayBuffer));

    return NextResponse.json({ url: `/uploads/blog/${filename}` }, { status: 201 });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

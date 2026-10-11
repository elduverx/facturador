import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const ATTACHMENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind') === 'attachment' ? 'attachment' : 'image';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (kind === 'attachment') {
      const ext = path.extname(file.name).toLowerCase();
      const mimeType = ATTACHMENT_TYPES[ext];
      if (!mimeType) {
        return NextResponse.json({ error: 'Formato no permitido. Use PDF, Word, Excel, ODT o imagen.' }, { status: 400 });
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json({ error: 'El archivo supera 15 MB' }, { status: 400 });
      }

      const filename = `${randomUUID()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog', 'files');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

      return NextResponse.json(
        {
          url: `/uploads/blog/files/${filename}`,
          name: path.basename(file.name, ext) || 'Documento',
          mimeType,
          size: file.size,
        },
        { status: 201 }
      );
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
    console.error('Error subiendo archivo:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

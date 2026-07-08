interface AppointmentEmailData {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  firmName: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
}

function baseTemplate(title: string, body: string, firmName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f5f4;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#0F766E,#0D9488);padding:32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:600;">${title}</h1>
        <p style="color:#CCFBF1;margin:8px 0 0;font-size:14px;">${firmName}</p>
      </div>
      <div style="padding:32px;color:#1C1917;font-size:15px;line-height:1.6;">
        ${body}
      </div>
      <div style="background:#F5F5F4;padding:20px;text-align:center;font-size:12px;color:#A8A29E;border-top:1px solid #E7E5E4;">
        <p style="margin:0;">${firmName}</p>
        <p style="margin:4px 0 0;">Este es un mensaje automatico, por favor no responda directamente.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function appointmentDetails(data: AppointmentEmailData): string {
  return `<div style="background:#F0FDFA;border:1px solid #CCFBF1;border-radius:8px;padding:20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#57534E;font-size:14px;">Servicio:</td><td style="padding:6px 0;font-weight:600;">${data.serviceName}</td></tr>
      <tr><td style="padding:6px 0;color:#57534E;font-size:14px;">Fecha:</td><td style="padding:6px 0;font-weight:600;">${data.date}</td></tr>
      <tr><td style="padding:6px 0;color:#57534E;font-size:14px;">Hora:</td><td style="padding:6px 0;font-weight:600;">${data.time}</td></tr>
    </table>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNewsletterContent(content: string): string {
  const safe = escapeHtml(content || '');
  return safe.replace(/\n/g, '<br />');
}

export function confirmationEmail(data: AppointmentEmailData): string {
  const body = `
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Su cita ha sido registrada correctamente. A continuacion los detalles:</p>
    ${appointmentDetails(data)}
    ${data.firmAddress ? `<p style="font-size:14px;color:#57534E;"><strong>Direccion:</strong> ${data.firmAddress}</p>` : ''}
    ${data.firmPhone ? `<p style="font-size:14px;color:#57534E;">Si necesita cancelar o modificar su cita, contactenos al <strong>${data.firmPhone}</strong>.</p>` : ''}
    <p style="font-size:14px;color:#57534E;">Le recomendamos traer toda la documentacion relacionada con su caso.</p>
  `;
  return baseTemplate('Cita Confirmada', body, data.firmName);
}

export function paymentConfirmationEmail(data: AppointmentEmailData & { amount: number }): string {
  const body = `
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le confirmamos que hemos recibido correctamente el pago de <strong>${data.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong> correspondiente al anticipo de su cita.</p>
    ${appointmentDetails(data)}
    <p style="font-size:14px;color:#57534E;">Su cita ya está asegurada. Nos vemos pronto.</p>
    ${data.firmPhone ? `<p style="font-size:14px;color:#57534E;">Para cualquier duda, contactenos al <strong>${data.firmPhone}</strong>.</p>` : ''}
  `;
  return baseTemplate('Confirmacion de Pago Recibido', body, data.firmName);
}

export function cancellationEmail(data: AppointmentEmailData): string {
  const body = `
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le informamos que su cita ha sido <strong style="color:#DC2626;">cancelada</strong>.</p>
    ${appointmentDetails(data)}
    ${data.firmPhone ? `<p style="font-size:14px;color:#57534E;">Para reprogramar su cita, contactenos al <strong>${data.firmPhone}</strong> o reserve una nueva cita en nuestra web.</p>` : '<p style="font-size:14px;color:#57534E;">Para reprogramar, reserve una nueva cita en nuestra web.</p>'}
  `;
  return baseTemplate('Cita Cancelada', body, data.firmName);
}

export function reminderEmail(data: AppointmentEmailData): string {
  const body = `
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le recordamos que tiene una cita programada para <strong>manana</strong>:</p>
    ${appointmentDetails(data)}
    ${data.firmAddress ? `<p style="font-size:14px;color:#57534E;"><strong>Direccion:</strong> ${data.firmAddress}</p>` : ''}
    <p style="font-size:14px;color:#57534E;">Por favor, recuerde traer toda la documentacion necesaria para su tramite.</p>
    ${data.firmPhone ? `<p style="font-size:14px;color:#57534E;">Si no puede asistir, contactenos al <strong>${data.firmPhone}</strong>.</p>` : ''}
  `;
  return baseTemplate('Recordatorio de Cita', body, data.firmName);
}

export function statusChangeEmail(data: AppointmentEmailData, newStatus: string): string {
  const statusLabels: Record<string, string> = {
    CONFIRMED: 'confirmada',
    COMPLETED: 'completada',
    NO_SHOW: 'marcada como no presentado',
  };
  const label = statusLabels[newStatus] || newStatus.toLowerCase();

  const body = `
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Su cita ha sido <strong>${label}</strong>.</p>
    ${appointmentDetails(data)}
    ${data.firmPhone ? `<p style="font-size:14px;color:#57534E;">Para cualquier consulta, contactenos al <strong>${data.firmPhone}</strong>.</p>` : ''}
  `;
  return baseTemplate('Actualizacion de Cita', body, data.firmName);
}

export function adminNewBookingEmail(data: AppointmentEmailData & { clientEmail: string; clientPhone: string; clientNie?: string; notes?: string }): string {
  const body = `
    <p><strong>Nueva cita registrada:</strong></p>
    ${appointmentDetails(data)}
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:600;font-size:14px;">Datos del cliente:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 0;color:#57534E;">Nombre:</td><td style="padding:4px 0;">${data.clientName}</td></tr>
        <tr><td style="padding:4px 0;color:#57534E;">Email:</td><td style="padding:4px 0;">${data.clientEmail}</td></tr>
        <tr><td style="padding:4px 0;color:#57534E;">Telefono:</td><td style="padding:4px 0;">${data.clientPhone}</td></tr>
        ${data.clientNie ? `<tr><td style="padding:4px 0;color:#57534E;">NIE/Pasaporte:</td><td style="padding:4px 0;">${data.clientNie}</td></tr>` : ''}
      </table>
      ${data.notes ? `<p style="margin:12px 0 0;font-size:14px;color:#57534E;"><strong>Notas:</strong> ${data.notes}</p>` : ''}
    </div>
  `;
  return baseTemplate('Nueva Reserva', body, data.firmName);
}

export function adminClientDocumentEmail(data: {
  firmName: string;
  clientEmail: string;
  clientPhone: string;
  fileName: string;
  description?: string | null;
  aiSummary?: string | null;
  aiStatus?: string | null;
  aiNextAction?: string | null;
  matchedScore?: number | null;
}): string {
  const body = `
    <p><strong>Un cliente ha subido documentacion desde el portal:</strong></p>
    <div style="background:#F0FDFA;border:1px solid #CCFBF1;border-radius:8px;padding:16px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:4px 0;color:#57534E;">Email:</td><td style="padding:4px 0;">${escapeHtml(data.clientEmail)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534E;">Telefono:</td><td style="padding:4px 0;">${escapeHtml(data.clientPhone)}</td></tr>
        <tr><td style="padding:4px 0;color:#57534E;">Archivo:</td><td style="padding:4px 0;">${escapeHtml(data.fileName)}</td></tr>
        ${data.description ? `<tr><td style="padding:4px 0;color:#57534E;">Nota cliente:</td><td style="padding:4px 0;">${escapeHtml(data.description)}</td></tr>` : ''}
      </table>
    </div>
    ${data.aiSummary ? `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;font-size:14px;">Lectura automatica de Claude:</p>
        ${data.aiStatus ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Estado:</strong> ${escapeHtml(data.aiStatus)}</p>` : ''}
        <p style="margin:0 0 8px;font-size:14px;">${escapeHtml(data.aiSummary)}</p>
        ${data.aiNextAction ? `<p style="margin:0;font-size:14px;"><strong>Siguiente accion:</strong> ${escapeHtml(data.aiNextAction)}</p>` : ''}
        ${typeof data.matchedScore === 'number' ? `<p style="margin:8px 0 0;font-size:12px;color:#78716C;">Coincidencia DB: ${Math.round(data.matchedScore * 100)}%</p>` : ''}
      </div>
    ` : ''}
    <p style="font-size:14px;color:#57534E;">Revise el archivo desde Admin &gt; Clientes &gt; ficha del cliente.</p>
  `;
  return baseTemplate('Nueva Documentacion de Cliente', body, data.firmName);
}

export function newsletterEmail(data: {
  post: {
    title: string;
    content: string;
    excerpt?: string | null;
    coverImageUrl?: string | null;
    imageUrls?: string[];
    linkUrls?: string[];
    embedUrls?: string[];
  };
  firmName: string;
  postUrl: string;
  unsubscribeUrl: string;
}): string {
  const { post, firmName, postUrl, unsubscribeUrl } = data;
  const coverImage = post.coverImageUrl
    ? `<img src="${post.coverImageUrl}" alt="${escapeHtml(post.title)}" style="width:100%;border-radius:10px;margin:16px 0;" />`
    : '';
  const extraImages = (post.imageUrls || []).slice(0, 3);
  const imagesBlock = extraImages.length
    ? `<div style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap;">${extraImages
        .map(
          (url) =>
            `<img src="${url}" alt="${escapeHtml(post.title)}" style="width:180px;max-width:100%;border-radius:10px;" />`
        )
        .join('')}</div>`
    : '';
  const linksBlock = (post.linkUrls || []).length
    ? `<div style="margin:12px 0;"><strong>Links relacionados:</strong><ul style="padding-left:18px;margin:8px 0;">${(post.linkUrls || [])
        .map((url) => `<li><a href="${url}" style="color:#0F766E;">${url}</a></li>`)
        .join('')}</ul></div>`
    : '';
  const embedsBlock = (post.embedUrls || []).length
    ? `<div style="margin:12px 0;"><strong>Videos/recursos:</strong><ul style="padding-left:18px;margin:8px 0;">${(post.embedUrls || [])
        .map((url) => `<li><a href="${url}" style="color:#0F766E;">${url}</a></li>`)
        .join('')}</ul></div>`
    : '';

  const body = `
    <p>Hola,</p>
    <p>Hemos publicado una nueva entrada en el blog:</p>
    <h2 style="margin:12px 0 4px;font-size:20px;">${escapeHtml(post.title)}</h2>
    ${post.excerpt ? `<p style="color:#57534E;font-size:14px;">${escapeHtml(post.excerpt)}</p>` : ''}
    ${coverImage}
    <div style="margin:16px 0;font-size:15px;line-height:1.7;color:#1C1917;">${formatNewsletterContent(post.content)}</div>
    ${imagesBlock}
    ${linksBlock}
    ${embedsBlock}
    <p style="margin-top:16px;"><a href="${postUrl}" style="color:#0F766E;font-weight:600;">Leer en la web</a></p>
    <p style="margin-top:20px;font-size:12px;color:#78716C;">Si no deseas recibir estas noticias, puedes <a href="${unsubscribeUrl}" style="color:#0F766E;">darte de baja aqui</a>.</p>
  `;

  return baseTemplate('Nueva Publicacion', body, firmName);
}

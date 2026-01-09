// Configuración de EmailJS para envío de facturas por email
//
// INSTRUCCIONES PARA CONFIGURAR:
// 1. Crea una cuenta gratuita en https://www.emailjs.com/
// 2. Ve a "Email Services" y conecta tu cuenta de email (Gmail, Outlook, etc.)
// 3. Ve a "Email Templates" y crea una plantilla con este contenido:
//
//    Subject: Factura {{invoice_number}} - {{from_name}}
//
//    Body:
//    Estimado/a {{client_name}},
//
//    Adjunto encontrará la factura {{invoice_number}} por un importe total de {{total_amount}}.
//
//    Atentamente,
//    {{from_name}}
//
//    Attachment: {{pdf_name}} (usar la variable {{pdf_content}} como contenido base64)
//
// 4. Copia tus credenciales aquí:

export const EMAIL_CONFIG = {
  SERVICE_ID: 'TU_SERVICE_ID',      // Ej: 'service_abc123'
  TEMPLATE_ID: 'TU_TEMPLATE_ID',    // Ej: 'template_xyz789'
  PUBLIC_KEY: 'TU_PUBLIC_KEY',      // Ej: 'user_XYZ123ABC456'
};

// Variables disponibles en la plantilla:
// - to_email: Email del destinatario
// - from_name: Nombre del emisor
// - from_email: Email del emisor
// - invoice_number: Número de factura
// - client_name: Nombre del cliente
// - total_amount: Importe total formateado
// - pdf_content: Contenido del PDF en base64
// - pdf_name: Nombre del archivo PDF

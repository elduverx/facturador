# 📧 Instrucciones para Enviar Facturas por Email y WhatsApp

## ✅ Funcionalidades Implementadas

Tu aplicación ahora tiene **3 formas de compartir facturas**:

1. **📥 Descargar PDF** - Descarga el PDF en tu equipo (funcionalidad original)
2. **📧 Enviar por Email** - Envía automáticamente el PDF por correo electrónico
3. **📱 Enviar por WhatsApp** - Descarga el PDF y abre WhatsApp con el mensaje pre-rellenado

---

## 📧 Configuración del Envío por Email

### Paso 1: Crear cuenta en EmailJS (GRATIS)

1. Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Crea una cuenta gratuita
3. El plan gratuito incluye **200 emails/mes** (más que suficiente para empezar)

### Paso 2: Conectar tu servicio de email

1. En el dashboard de EmailJS, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona tu proveedor de email:
   - **Gmail** (recomendado)
   - Outlook/Hotmail
   - Yahoo
   - Otro servidor SMTP
4. Conecta tu cuenta siguiendo las instrucciones
5. **Copia el SERVICE_ID** que aparece (ej: `service_abc123`)

### Paso 3: Crear plantilla de email

1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Configura la plantilla así:

**Subject (Asunto):**
```
Factura {{invoice_number}} - {{from_name}}
```

**Content (Contenido):**
```
Estimado/a {{client_name}},

Adjunto encontrará la factura {{invoice_number}} por un importe total de {{total_amount}}.

Cualquier duda, no dudes en contactarme.

Atentamente,
{{from_name}}
{{from_email}}
```

**From Name:**
```
{{from_name}}
```

**From Email:**
```
{{from_email}}
```

**To Email:**
```
{{to_email}}
```

**Adjuntar PDF:**
- En "Attachments", añade un adjunto
- Nombre: `{{pdf_name}}`
- Contenido (base64): `{{pdf_content}}`

4. Guarda la plantilla y **copia el TEMPLATE_ID** (ej: `template_xyz789`)

### Paso 4: Obtener tu Public Key

1. Ve a **"Account"** → **"General"**
2. Copia tu **Public Key** (ej: `user_XYZ123ABC456`)

### Paso 5: Configurar en la aplicación

1. Abre el archivo: `src/config/email.config.ts`
2. Reemplaza los valores:

```typescript
export const EMAIL_CONFIG = {
  SERVICE_ID: 'service_abc123',      // Tu Service ID
  TEMPLATE_ID: 'template_xyz789',    // Tu Template ID
  PUBLIC_KEY: 'user_XYZ123ABC456',   // Tu Public Key
};
```

3. Guarda el archivo

### ✅ ¡Listo! Ahora puedes enviar emails con PDF adjunto

---

## 📱 Envío por WhatsApp

**No requiere configuración adicional**, funciona así:

1. Haz clic en el botón **"WhatsApp"**
2. Introduce el número del cliente (con código de país, ej: `34600123456`)
3. El PDF se descargará automáticamente
4. Se abrirá WhatsApp Web con el mensaje pre-rellenado
5. Adjunta el PDF manualmente usando el botón de adjuntar (📎)
6. Envía el mensaje

### Mejora opcional: WhatsApp Business API

Si quieres envío automático completo por WhatsApp, necesitas:
- Cuenta de WhatsApp Business API (de pago)
- Backend para gestionar envíos
- Esto es más complejo y requiere configuración adicional

---

## 🎯 Cómo Usar

### Enviar por Email:
1. En el formulario del cliente, **introduce su email** en el campo "Email"
2. Rellena el resto de datos de la factura
3. Haz clic en el botón **"Email"**
4. ¡El email se enviará automáticamente con el PDF adjunto!

**Nota:** Si no introduces el email del cliente, te pedirá que lo hagas antes de enviar.

### Enviar por WhatsApp:
1. Opcionalmente, introduce el **teléfono/WhatsApp** del cliente en el formulario (ej: `34600123456`)
2. Rellena todos los datos de la factura
3. Haz clic en el botón **"WhatsApp"**
4. Se abrirá WhatsApp Web con el mensaje pre-rellenado:
   - Si guardaste el teléfono → abre el chat directo con ese contacto
   - Si NO guardaste el teléfono → abre WhatsApp general para que elijas el contacto

**Ventaja:** Puedes guardar el teléfono del cliente y la próxima vez irá directo a su chat.

---

## ❓ Solución de Problemas

### "⚠️ Configuración requerida"
- No has configurado las credenciales de EmailJS
- Sigue los pasos 1-5 de la sección "Configuración del Envío por Email"

### "❌ Error al enviar el email"
- Verifica que las credenciales en `email.config.ts` sean correctas
- Comprueba que tu servicio de EmailJS esté activo
- Revisa la consola del navegador para más detalles

### El email no llega
- Verifica la carpeta de SPAM
- Comprueba que el email del destinatario sea correcto
- Revisa los límites de tu plan en EmailJS (200 emails/mes en plan gratuito)

### WhatsApp no abre
- Verifica que el número esté bien escrito (con código de país)
- Asegúrate de tener WhatsApp Web accesible
- Prueba con otro navegador

---

## 📦 Archivos Modificados

- `src/app/page.tsx` - Lógica de envío por email y WhatsApp
- `src/config/email.config.ts` - Configuración de EmailJS
- `package.json` - Añadida dependencia `@emailjs/browser`

---

## 🚀 Siguientes Pasos (Opcional)

Si quieres funcionalidades más avanzadas:

1. **Guardar emails de clientes** en localStorage
2. **Historial de facturas enviadas**
3. **Backend propio** con Node.js + Nodemailer
4. **WhatsApp Business API** para envíos automáticos
5. **Confirmación de lectura** de emails

---

## 📞 Soporte

Si necesitas ayuda, revisa:
- Documentación de EmailJS: https://www.emailjs.com/docs/
- Consola del navegador (F12) para ver errores

¡Disfruta enviando tus facturas! 🎉

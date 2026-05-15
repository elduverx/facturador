# PRD — Consultorio de Extranjeria

## 1. Vision del Producto

**Consultorio de Extranjeria** es una plataforma web integral para un despacho de abogadas especializado en derecho de extranjeria e inmigracion en Espana. El sistema combina una landing page comercial orientada a captar clientes con un sistema de gestion de citas, blog informativo y modulo de facturacion.

### Objetivo Principal
Digitalizar y automatizar la captacion de clientes y gestion de citas del despacho, ofreciendo una experiencia profesional y accesible que transmita confianza y cercania.

---

## 2. Usuarios Objetivo

| Perfil | Descripcion | Necesidades |
|--------|-------------|-------------|
| **Cliente potencial** | Persona inmigrante que necesita asesoramiento legal | Ver servicios, reservar cita, consultar precios, leer blog |
| **Cliente existente** | Persona con cita agendada | Consultar citas, recibir recordatorios, ver estado |
| **Abogada/Admin** | Profesional del despacho | Gestionar citas, publicar blog, emitir facturas, ver metricas |

---

## 3. Arquitectura del Sistema

### Stack Tecnologico
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (via Prisma ORM)
- **Estilos**: Tailwind CSS 4
- **Fuentes**: DM Sans (UI), Instrument Serif (display)
- **Email**: Nodemailer
- **PDF**: jsPDF + html2canvas
- **PWA**: Service Worker + manifest.json

### Estructura de Rutas

```
/                   → HomeShell (sistema de reservas interno)
/frontend           → LandingPage (pagina comercial publica)
/blog               → Lista de articulos
/blog/[slug]        → Articulo individual
/admin/login        → Acceso administracion
/admin              → Dashboard de administracion
/facturador         → Modulo de facturacion
```

---

## 4. Funcionalidades

### 4.1 Landing Page (`/frontend`)

**Estado**: Implementado

Pagina comercial premium con las siguientes secciones:

| Seccion | Descripcion |
|---------|-------------|
| Hero | Pantalla completa con gradiente oscuro, titulo animado, CTAs, tarjetas flotantes con estadisticas |
| Marquee | Scroll infinito con servicios ofrecidos |
| Servicios | Bento grid con 6 servicios (Arraigo, NIE, Renovaciones, Nacionalidad, Reagrupacion, Asilo) |
| Estadisticas | Contadores animados: 500+ casos, 10+ anos, 98% exito, 2000+ clientes |
| Por que elegirnos | 4 diferenciadores: especializacion, trato, comunicacion, resultados |
| Sobre nosotras | Historia del despacho, valores, credenciales |
| Proceso | 3 pasos: Reserva → Consulta → Gestion |
| Testimonios | Layout asimetrico con 1 destacado + 2 secundarios |
| FAQ | Acordeon con 6 preguntas frecuentes |
| CTA | Llamada a la accion final |
| Reserva | Wizard de booking integrado |
| Footer | Contacto, servicios, enlaces, redes sociales |

**Caracteristicas visuales**:
- Animaciones de scroll reveal
- Glass morphism en tarjetas
- Gradientes cinematicos
- Floating elements decorativos
- Texto con gradiente
- Stagger animations

### 4.2 Sistema de Reservas (`/`)

**Estado**: Implementado

| Componente | Funcion |
|------------|---------|
| BookingWizard | Flujo de 4 pasos para reservar cita |
| ServiceSelector | Seleccion de servicio con iconos y duracion |
| DateTimePicker | Calendario interactivo + slots disponibles |
| ClientForm | Formulario de datos del cliente |
| BookingConfirmation | Pantalla de exito con resumen |
| AppointmentLookup | Consulta de citas existentes por email+telefono |

**Validaciones**:
- Email formato valido
- Telefono espanol (9 digitos, empieza 6-9)
- NIE formato X1234567A
- Duplicados de NIE bloqueados
- Respeta horarios de oficina y almuerzo
- Respeta fechas bloqueadas

### 4.3 Panel de Administracion (`/admin`)

**Estado**: Implementado

| Modulo | Funcionalidades |
|--------|----------------|
| Dashboard | Vista de citas del dia, semana, mes |
| Citas | CRUD completo, cambio de estado, notas |
| Servicios | Crear/editar servicios, precios, duracion |
| Blog | Editor de articulos, imagenes, embeds |
| Configuracion | Horarios, dias laborables, max citas |
| Fechas bloqueadas | Cerrar dias especificos |
| Notas de cliente | Seguimiento interno por email |

**Autenticacion**: PIN hash (bcryptjs)

### 4.4 Blog (`/blog`)

**Estado**: Implementado

- Lista de articulos publicados
- Articulo individual con imagenes, videos embebidos, enlaces
- Estados: DRAFT / PUBLISHED
- Fecha de publicacion

### 4.5 Facturador (`/facturador`)

**Estado**: Implementado

| Funcion | Descripcion |
|---------|-------------|
| Emision de facturas | Datos emisor, cliente, conceptos |
| Calculo automatico | Base, IVA, IRPF, total |
| Vista previa | Formato profesional |
| Exportar PDF | Generacion via html2canvas + jsPDF |
| Imprimir | Estilos optimizados para impresion |
| Clientes recientes | Autocompletado |
| Guardado local | SessionData en DB |

---

## 5. Modelo de Datos

### Entidades Principales

```prisma
model Service {
  id           String   @id @default(cuid())
  name         String
  description  String?
  durationMin  Int      @default(30)
  price        Float?
  active       Boolean  @default(true)
  sortOrder    Int      @default(0)
  appointments Appointment[]
}

model Appointment {
  id          String   @id @default(cuid())
  serviceId   String
  service     Service  @relation(...)
  clientName  String
  clientEmail String
  clientPhone String
  clientNie   String?
  date        DateTime
  startTime   String
  endTime     String
  status      AppointmentStatus @default(PENDING)
  notes       String?
  adminNotes  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model OfficeSettings {
  id                    String @id @default("main")
  firmName              String @default("Consultorio de Extranjeria")
  firmEmail             String?
  firmPhone             String?
  firmAddress           String?
  startHour             Int    @default(9)
  endHour               Int    @default(18)
  slotDurationMin       Int    @default(30)
  lunchStartHour        Int    @default(14)
  lunchEndHour          Int    @default(15)
  workDays              Json   @default("[1,2,3,4,5]")
  maxAppointmentsPerDay Int    @default(16)
  adminPinHash          String?
}

model BlogPost {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  excerpt       String?
  content       String
  coverImageUrl String?
  imageUrls     String[]
  linkUrls      String[]
  embedUrls     String[]
  status        BlogStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Enums

```prisma
enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum BlogStatus {
  DRAFT
  PUBLISHED
}
```

---

## 6. APIs

### Publicas
| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/services` | GET | Lista servicios activos |
| `/api/appointments` | POST | Crear cita |
| `/api/appointments/lookup` | GET | Buscar cita por email+telefono |
| `/api/available-slots` | GET | Slots disponibles por fecha |
| `/api/blog` | GET | Articulos publicados |
| `/api/blog/[slug]` | GET | Articulo individual |

### Protegidas (Admin)
| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/admin/login` | POST | Autenticacion |
| `/api/admin/settings` | GET/PUT | Configuracion oficina |
| `/api/appointments` | GET | Listar todas las citas |
| `/api/appointments/[id]` | PATCH | Actualizar cita |
| `/api/appointments/[id]/reminder` | POST | Enviar recordatorio |
| `/api/admin/blog` | GET/POST | Gestionar articulos |
| `/api/admin/blocked-dates` | GET/POST | Fechas bloqueadas |
| `/api/admin/day-schedules` | GET/POST | Horarios especiales |
| `/api/admin/client-notes` | GET/POST | Notas internas |

---

## 7. Emails

### Plantillas
1. **Confirmacion de cita** — Enviado al crear reserva
2. **Recordatorio** — Enviado manualmente por admin
3. **Cancelacion** — Enviado al cancelar cita

### Contenido
- Datos del servicio
- Fecha y hora
- Direccion del despacho
- Instrucciones previas
- Enlace para consultar/cancelar

---

## 8. PWA

- **Installable**: Manifest con iconos 192/512
- **Offline**: Service worker con cache basico
- **Theme**: Color primario teal (#0D9488)
- **Idioma**: Espanol (es)

---

## 9. Roadmap Futuro

### Fase 2 — Mejoras UX
- [ ] Notificaciones push de recordatorio
- [ ] Cancelacion online desde email
- [ ] Reagendar cita existente
- [ ] Multi-idioma (EN, FR, AR, ZH)

### Fase 3 — Pagos
- [ ] Integracion Stripe/PayPal
- [ ] Pago anticipado de consulta
- [ ] Facturacion automatica post-cita

### Fase 4 — CRM
- [ ] Historial completo por cliente
- [ ] Documentos adjuntos por caso
- [ ] Timeline de tramite
- [ ] Alertas de vencimiento

### Fase 5 — Marketing
- [ ] SEO optimizado
- [ ] Google Analytics
- [ ] Pixel de conversion
- [ ] A/B testing landing

---

## 10. Metricas de Exito

| KPI | Objetivo |
|-----|----------|
| Tasa de conversion (visita → cita) | > 5% |
| Citas completadas vs agendadas | > 85% |
| Tiempo medio de reserva | < 3 min |
| Satisfaccion cliente (NPS) | > 70 |
| Trafico organico mensual | +20% MoM |

---

## 11. Consideraciones Tecnicas

### Seguridad
- Passwords hasheados con bcrypt
- Sanitizacion de inputs
- Rate limiting en APIs
- HTTPS obligatorio
- Cookies httpOnly para sesion

### Performance
- ISR para paginas estaticas
- Lazy loading de imagenes
- Code splitting automatico
- Fonts optimizadas (display: swap)

### Accesibilidad
- Labels en formularios
- Contraste WCAG AA
- Navegacion por teclado
- aria-labels en iconos

---

## 12. Equipo y Contacto

**Producto**: Consultorio de Extranjeria
**Version**: 1.0
**Ultima actualizacion**: Febrero 2026
**Repositorio**: Local (c:\Users\cvael\Desktop\facturador)

---

*Este documento es un producto vivo que se actualiza conforme evoluciona el proyecto.*

2

# Especificación y Análisis de Brechas: Software de Gestión Legal (PV Abogadas)

## 1. Visión General
El objetivo de este proyecto es construir un sistema de gestión de despacho de abogados (Legal Practice Management Software) especializado en extranjería, que ofrezca una experiencia premium tanto para el cliente final como para el equipo legal, apalancado en Inteligencia Artificial y automatización.

---

## 2. Estado Actual del Sistema (Lo que YA tenemos)

La aplicación cuenta con una base arquitectónica sólida (Next.js, Prisma, Tailwind) y un diseño visual premium (Neo-Clásico Neomórfico). Las funciones actuales cubren el ciclo básico de captación y atención:

### 2.1. Frontend y Captación
*   **Landing Page Profesional:** Diseño de alta conversión con servicios detallados, proceso, FAQs y prueba social.
*   **Motor de Reservas (Booking Wizard):** Sistema paso a paso para agendar consultas, seleccionando servicio, fecha y hora.
*   **Blog y Newsletter:** Herramientas de marketing de contenidos integradas.

### 2.2. Portal del Cliente (Área Privada)
*   **Acceso Seguro:** Acceso mediante credenciales (email/teléfono) para proteger la privacidad.
*   **Gestión de Citas:** Visualización de citas programadas.
*   **Intercambio de Documentos:** Capacidad de subir documentación requerida por el equipo legal y descargar archivos provistos por el despacho de forma segura.

### 2.3. Panel de Administración (CRM Base)
*   **Dashboard (Resumen):** Métricas clave de rendimiento (citas, clientes, ingresos estimados).
*   **Gestión de Clientes (CRM Base):** Directorio de clientes con sus datos de contacto y notas básicas.
*   **Calendario:** Gestión de citas y bloqueo de fechas.
*   **Inteligencia Artificial (Oraculum):** Chatbot interno para análisis de documentos legales, redacción de borradores y consultas de jurisprudencia.
*   **Facturador Base:** Vista de pre-visualización de facturas (InvoicePreview) e integración base con pasarela de pago (Redsys).

---

## 3. Análisis de Brechas (Lo que FALTA para ser 100% Profesional)

Para elevar el software de un "CRM de servicios con reservas" a un **Software de Gestión de Despacho (Legal Practice Management) de nivel Enterprise**, es imperativo desarrollar las siguientes áreas:

### 3.1. Gestión de Expedientes (Matter Management) [ALTA PRIORIDAD]
*   **Brecha:** Actualmente el sistema se centra en el "Cliente". En derecho, un cliente puede tener múltiples "Expedientes" o casos a lo largo del tiempo (ej. Arraigo en 2024, Nacionalidad en 2026).
*   **Requisito:** Crear la entidad `Expediente`. Cada expediente debe tener:
    *   Estado (Fase inicial, En trámite, Resuelto, Archivado).
    *   Tipo de trámite asociado.
    *   Documentos específicos del caso (separados de los documentos generales del cliente).
    *   Historial de actuaciones (Timeline del caso).

### 3.2. Control de Plazos Legales y Alertas (Deadline Tracking) [ALTA PRIORIDAD]
*   **Brecha:** En extranjería, los plazos de caducidad, requerimientos y recursos son críticos. Un plazo vencido es un caso perdido.
*   **Requisito:** 
    *   Sistema de tareas y plazos vinculados a expedientes.
    *   Alertas automáticas al dashboard y por email (ej. "Vence el plazo para presentar recurso en 3 días").
    *   Calculadora de plazos hábiles/naturales.

### 3.3. Facturación Avanzada y Control de Pagos (Billing & Trust Accounting) [MEDIA PRIORIDAD]
*   **Brecha:** Se necesita control financiero estricto adaptado a despachos españoles.
*   **Requisito:**
    *   Generación de Facturas formales (con series, numeración, IVA, retención IRPF si aplica).
    *   Gestión de Provisiones de Fondos / Suplidos (dinero adelantado por el cliente para tasas).
    *   Integración de presupuestos/hojas de encargo firmables digitalmente.
    *   Control de pagos a plazos (muy común en extranjería).

### 3.4. Generación Documental Automatizada [ALTA PRIORIDAD]
*   **Brecha:** El equipo invierte mucho tiempo rellenando los mismos formularios de extranjería (EX-00, EX-11, etc.).
*   **Requisito:**
    *   Plantillas inteligentes. Usar la IA o mapeo de variables para auto-rellenar PDFs oficiales de extranjería y escritos estándar con los datos del cliente/expediente de la base de datos con un solo clic.

### 3.5. Sistema de Roles y Permisos (RBAC) [MEDIA PRIORIDAD]
*   **Brecha:** El acceso actual es binario (Admin o Cliente).
*   **Requisito:** A medida que el despacho crece, se necesitan roles:
    *   *Abogado Principal / Socio:* Acceso total y financiero.
    *   *Paralegal / Administrativo:* Acceso a subir documentos, gestionar citas, pero sin acceso a facturación o borrado de expedientes.

### 3.6. Trazabilidad y Comunicaciones (Comms Log) [BAJA PRIORIDAD]
*   **Brecha:** Saber qué se le dijo al cliente y cuándo.
*   **Requisito:** Registro de emails enviados desde el sistema (plantillas de requerimiento de documentos, avisos de citas) en el timeline del cliente.

---

## 4. Próximos Pasos (Roadmap Sugerido)

Para avanzar ordenadamente hacia la profesionalización total, sugiero el siguiente plan de acción en fases (Sprints):

1.  **Sprint 1 (Estructura Legal):** Implementar la arquitectura de **Expedientes (Matters)** y migrar la lógica centrada en "Clientes" hacia una lógica centrada en "Expedientes de Clientes".
2.  **Sprint 2 (Plazos y Alertas):** Desarrollar el sistema de **Tareas y Plazos Legales** con notificaciones para evitar caducidades.
3.  **Sprint 3 (Automatización):** Implementar la **Auto-generación de Documentos/Formularios** utilizando los datos del cliente.
4.  **Sprint 4 (Finanzas):** Robustecer el módulo del **Facturador**, añadiendo control de provisiones de fondos y hojas de encargo.
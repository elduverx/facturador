'use client';

import { useState } from 'react';
import { HomeNavbar } from '@/components/public/HomeNavbar';
import { HomeFooter } from '@/components/public/HomeFooter';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';
import Link from 'next/link';
import {
  Globe, Briefcase, Heart, ArrowRight, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, FileText, Clock, RotateCcw,
  BookOpen, AlertTriangle
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type OptionDef = {
  label: string;
  desc?: string;
  next: string; // step id  or  'result:XXX'
};

type StepDef = {
  id: string;
  question: string;
  subtitle?: string;
  options: OptionDef[];
};

type ResultDef = {
  id: string;
  tramite: string;
  area: 'Extranjería' | 'Laboral' | 'Familia';
  tagline: string;
  description: string;
  requirements: string[];
  timeframe: string;
  links: { label: string; url: string; desc: string }[];
  note?: string;
};

type HistoryItem = { stepId: string; choiceLabel: string };

// ─── STEPS ────────────────────────────────────────────────────────────────────

const STEPS: Record<string, StepDef> = {
  start: {
    id: 'start',
    question: '¿Cuál es tu situación principal?',
    subtitle: 'Selecciona el área que mejor describe tu problema o necesidad.',
    options: [
      {
        label: 'Tengo un problema con mi situación en España',
        desc: 'Extranjería, inmigración, permisos, nacionalidad',
        next: 'ext-situacion',
      },
      {
        label: 'Tengo un problema con mi trabajo',
        desc: 'Despido, salarios, contratos, condiciones laborales',
        next: 'lab-situacion',
      },
      {
        label: 'Tengo un asunto de familia',
        desc: 'Divorcio, hijos, custodia, protección de familiares',
        next: 'fam-situacion',
      },
    ],
  },

  'ext-situacion': {
    id: 'ext-situacion',
    question: '¿Cuál es tu situación actual en España?',
    options: [
      { label: 'Estoy en España sin permiso de residencia', desc: 'No tengo documentación regular', next: 'ext-tiempo' },
      { label: 'Ya tengo un permiso y quiero renovarlo o cambiarlo', next: 'result:renovacion' },
      { label: 'Quiero traer a mi familia a España', next: 'result:reagrupacion-familiar' },
      { label: 'Quiero obtener la nacionalidad española', next: 'ext-nac-tipo' },
      { label: 'Quiero venir o ya estoy en España a estudiar', next: 'result:visado-estudios' },
      { label: 'Soy familiar de ciudadano de la UE / EEE', next: 'result:tarjeta-familiar-ue' },
      { label: 'Estoy en peligro en mi país de origen', desc: 'Persecución, guerra, violencia', next: 'result:asilo' },
    ],
  },

  'ext-tiempo': {
    id: 'ext-tiempo',
    question: '¿Cuánto tiempo llevas viviendo en España de forma continuada?',
    subtitle: 'El tiempo de residencia determina el tipo de arraigo al que puedes optar.',
    options: [
      { label: 'Menos de 2 años', next: 'result:asesoria' },
      { label: 'Entre 2 y 3 años', next: 'ext-trabajo' },
      { label: 'Más de 3 años', next: 'result:arraigo-social' },
    ],
  },

  'ext-trabajo': {
    id: 'ext-trabajo',
    question: '¿Tienes pruebas de haber trabajado de forma irregular en España durante al menos 2 años?',
    subtitle: 'Contratos, nóminas, Seguridad Social, testigos o cualquier evidencia documentada.',
    options: [
      { label: 'Sí, puedo acreditar al menos 2 años de trabajo irregular', next: 'result:arraigo-laboral' },
      { label: 'No tengo pruebas de trabajo, pero estoy matriculado en formación', next: 'result:arraigo-formacion' },
      { label: 'No, ninguna de las anteriores', next: 'result:asesoria' },
    ],
  },

  'ext-nac-tipo': {
    id: 'ext-nac-tipo',
    question: '¿Por qué vía quieres acceder a la nacionalidad española?',
    options: [
      {
        label: 'Llevo años con residencia legal en España',
        desc: 'Residencia continuada (1, 2 o 10 años según origen)',
        next: 'result:nacionalidad-residencia',
      },
      {
        label: 'Tengo abuelos o bisabuelos españoles',
        desc: 'Ley de Memoria Democrática / nietos de exiliados',
        next: 'result:nacionalidad-mdd',
      },
      {
        label: 'Circunstancias especiales (deportistas, servicios al Estado…)',
        next: 'result:asesoria',
      },
    ],
  },

  'lab-situacion': {
    id: 'lab-situacion',
    question: '¿Qué ha ocurrido en tu relación laboral?',
    options: [
      { label: 'Me han despedido o van a despedirme', next: 'result:despido' },
      { label: 'No me pagan el salario, pagas extra o finiquito', next: 'result:reclamacion-salarios' },
      {
        label: 'Han cambiado mis condiciones de trabajo sin mi acuerdo',
        desc: 'Horario, salario, puesto, lugar de trabajo',
        next: 'result:modificacion-condiciones',
      },
      { label: 'No me conceden vacaciones, reducción de jornada o excedencia', next: 'result:permisos-vacaciones' },
      { label: 'He sufrido un accidente de trabajo o enfermedad profesional', next: 'result:accidente-trabajo' },
    ],
  },

  'fam-situacion': {
    id: 'fam-situacion',
    question: '¿De qué trata tu asunto familiar?',
    options: [
      { label: 'Quiero divorciarme o separarme', next: 'result:divorcio' },
      {
        label: 'Hay un conflicto sobre los hijos',
        desc: 'Guarda, custodia, visitas, pensión de alimentos',
        next: 'result:guarda-custodia',
      },
      {
        label: 'Mi pareja y yo queremos regular nuestra separación de mutuo acuerdo',
        next: 'result:convenio-regulador',
      },
      {
        label: 'Necesito proteger a un familiar que no puede valerse por sí mismo',
        next: 'result:incapacitacion',
      },
    ],
  },
};

// ─── RESULTS ──────────────────────────────────────────────────────────────────

const RESULTS: Record<string, ResultDef> = {
  /* ── EXTRANJERÍA ─────────────────────────────────────────────────────────── */

  'arraigo-social': {
    id: 'arraigo-social',
    tramite: 'Arraigo Social',
    area: 'Extranjería',
    tagline: 'La vía más habitual para regularizarse tras 3 años en España',
    description:
      'El arraigo social permite obtener una autorización de residencia temporal de 2 años a quienes acrediten al menos 3 años de permanencia continuada en España, junto con vínculos familiares con residentes legales o un informe de integración social favorable del ayuntamiento, y un contrato de trabajo.',
    requirements: [
      'Haber permanecido 3 años continuados en España (con pruebas documentales: padrón, facturas, etc.)',
      'No tener antecedentes penales en España ni en países de residencia anteriores',
      'Contrato de trabajo de al menos 30 horas/semana, o vínculos familiares con residentes legales en España',
      'Informe de integración social del ayuntamiento de residencia (cuando no hay contrato)',
      'Pasaporte o documento de identidad en vigor',
      'Fotografías recientes en fondo blanco',
      'Modelo EX-10 cumplimentado',
    ],
    timeframe: '3 a 6 meses (depende de la Oficina de Extranjería)',
    links: [
      {
        label: 'Arraigo Social — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja056/index.html',
        desc: 'Ministerio de Inclusión, Seguridad Social y Migraciones',
      },
      {
        label: 'Ley Orgánica 4/2000 de Extranjería (LOEx)',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544',
        desc: 'Texto completo en el BOE — normativa base de extranjería',
      },
      {
        label: 'Reglamento de Extranjería (RD 557/2011) — Art. 124',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9529',
        desc: 'Requisitos y procedimiento del arraigo social',
      },
      {
        label: 'Sede Electrónica — Extranjería',
        url: 'https://sede.inclusion.gob.es/',
        desc: 'Presentación de solicitudes online',
      },
    ],
    note:
      'Si no tienes contrato de trabajo, el informe de integración del ayuntamiento es clave. Algunos ayuntamientos tardan meses en emitirlo; es importante solicitarlo cuanto antes.',
  },

  'arraigo-laboral': {
    id: 'arraigo-laboral',
    tramite: 'Arraigo Laboral',
    area: 'Extranjería',
    tagline: 'Para quienes han trabajado irregularmente en España durante al menos 2 años',
    description:
      'El arraigo laboral permite regularizar la situación de personas que han trabajado sin permiso en España. Se debe acreditar la relación laboral mediante acta de la Inspección de Trabajo, sentencia judicial o acuerdo de conciliación que reconozca la relación laboral por al menos 6 meses.',
    requirements: [
      'Permanencia de al menos 2 años en España de forma continuada',
      'Acreditación de al menos 6 meses de trabajo (acta de Inspección de Trabajo, sentencia o acuerdo de conciliación)',
      'No tener antecedentes penales en España ni en países de residencia anteriores',
      'Pasaporte en vigor',
      'Modelo EX-10 cumplimentado',
    ],
    timeframe: '3 a 8 meses (incluida la tramitación ante la Inspección de Trabajo)',
    links: [
      {
        label: 'Arraigo Laboral — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja057/index.html',
        desc: 'Ministerio de Inclusión',
      },
      {
        label: 'Reglamento de Extranjería — Art. 123',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9529',
        desc: 'Requisitos y procedimiento del arraigo laboral',
      },
      {
        label: 'Ley Orgánica 4/2000 (LOEx)',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544',
        desc: 'Normativa base de extranjería',
      },
      {
        label: 'Inspección de Trabajo y Seguridad Social',
        url: 'https://www.mites.gob.es/es/itss/web/index.html',
        desc: 'Denuncia y acreditación de relación laboral irregular',
      },
    ],
    note:
      'El paso previo imprescindible es obtener el acta de la Inspección de Trabajo. Nosotras te acompañamos en todo el proceso de denuncia e instrucción.',
  },

  'arraigo-formacion': {
    id: 'arraigo-formacion',
    tramite: 'Arraigo para la Formación',
    area: 'Extranjería',
    tagline: 'Regularízate mientras inviertes en tu formación profesional',
    description:
      'El arraigo para la formación otorga una autorización de residencia de 1 año (prorrogable) a personas que llevan al menos 2 años en España y se han matriculado en formación profesional, educación secundaria u otras enseñanzas del sistema educativo español. Incluye autorización para trabajar.',
    requirements: [
      'Permanencia de al menos 2 años en España de forma continuada',
      'Matrícula en un programa de formación oficial (FP, ESO, Bachillerato, Universidad, formación para el empleo…)',
      'No tener antecedentes penales',
      'No tener prohibición de entrada ni orden de expulsión en vigor',
      'Pasaporte en vigor',
      'Modelo EX-10 cumplimentado',
    ],
    timeframe: '2 a 5 meses',
    links: [
      {
        label: 'Arraigo para la Formación — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja058/index.html',
        desc: 'Ministerio de Inclusión',
      },
      {
        label: 'Reglamento de Extranjería — Art. 124 bis',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9529',
        desc: 'Arraigo para la formación: requisitos y procedimiento',
      },
      {
        label: 'Sede Electrónica — Solicitud online',
        url: 'https://sede.inclusion.gob.es/',
        desc: 'Presentación de solicitudes',
      },
    ],
    note:
      'Este arraigo también permite trabajar (autorización incluida) si la formación ocupa menos de 30 horas semanales. Es compatible con prácticas remuneradas.',
  },

  'renovacion': {
    id: 'renovacion',
    tramite: 'Renovación o Modificación de Permiso',
    area: 'Extranjería',
    tagline: 'No pierdas tus derechos: renueva a tiempo o cambia de categoría',
    description:
      'La renovación de permisos de residencia o trabajo debe gestionarse antes de que caduque el permiso actual (o dentro de los 90 días posteriores). También es posible modificar el tipo de permiso: de cuenta ajena a autónomo, de estudiante a trabajador, etc.',
    requirements: [
      'Documentación que acredite el cumplimiento de los requisitos del permiso actual',
      'Contrato de trabajo en vigor o, en autónomos, alta en el RETA y justificación de actividad',
      'Informe de vida laboral de la Seguridad Social',
      'Pasaporte en vigor',
      'Padrón municipal actualizado',
      'Modelo EX-17 (residencia temporal) o EX-03 (trabajo por cuenta ajena) según el caso',
      'Fotografías recientes en fondo blanco',
    ],
    timeframe: '1 a 4 meses',
    links: [
      {
        label: 'Portal de Extranjería — Renovaciones',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/',
        desc: 'Ministerio de Inclusión — todos los procedimientos',
      },
      {
        label: 'Sede Electrónica — Solicitud online',
        url: 'https://sede.inclusion.gob.es/',
        desc: 'Presentación y seguimiento de renovaciones online',
      },
      {
        label: 'Reglamento de Extranjería (RD 557/2011)',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9529',
        desc: 'Requisitos y plazos de renovación según tipo de permiso',
      },
    ],
    note:
      'Puedes solicitar la renovación desde 60 días antes del vencimiento. Si presentas la solicitud a tiempo, puedes seguir trabajando legalmente mientras se resuelve (prórroga automática).',
  },

  'reagrupacion-familiar': {
    id: 'reagrupacion-familiar',
    tramite: 'Reagrupación Familiar',
    area: 'Extranjería',
    tagline: 'Reúnete con tus seres queridos en España de forma legal',
    description:
      'La reagrupación familiar permite a los residentes en España (con permiso de más de 1 año renovable) traer a su cónyuge, hijos menores o mayores dependientes, y en ciertos casos a los ascendientes. El reagrupante debe acreditar medios económicos suficientes y vivienda adecuada.',
    requirements: [
      'Permiso de residencia de al menos 1 año vigente y renovable por otro año más',
      'Medios económicos suficientes: aprox. 150% del IPREM por el primer familiar + 50% por cada adicional',
      'Vivienda adecuada (certificado de habitabilidad o informe de la Comunidad Autónoma)',
      'Vínculo familiar acreditado: certificado de matrimonio apostillado, libro de familia, etc.',
      'Pasaporte del familiar a reagrupar en vigor (con al menos 4 meses de validez)',
      'Antecedentes penales del familiar a reagrupar (del país de origen y del de residencia los últimos 5 años)',
    ],
    timeframe: '3 a 6 meses',
    links: [
      {
        label: 'Reagrupación Familiar — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja004/index.html',
        desc: 'Ministerio de Inclusión',
      },
      {
        label: 'Ley Orgánica 4/2000 — Art. 16 al 18',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544',
        desc: 'Derecho a la reagrupación familiar',
      },
      {
        label: 'Reglamento de Extranjería — Art. 52 al 70',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-9529',
        desc: 'Procedimiento y requisitos detallados',
      },
      {
        label: 'Sede Electrónica — Solicitud online',
        url: 'https://sede.inclusion.gob.es/',
        desc: 'Presentación de la solicitud de reagrupación',
      },
    ],
  },

  'tarjeta-familiar-ue': {
    id: 'tarjeta-familiar-ue',
    tramite: 'Tarjeta de Residencia de Familiar de Ciudadano UE',
    area: 'Extranjería',
    tagline: 'Residencia en España por ser familiar de un ciudadano europeo',
    description:
      'Los familiares no comunitarios de ciudadanos de la UE o del Espacio Económico Europeo pueden obtener una tarjeta de residencia especial con trámites más ágiles y derechos más amplios que los permisos ordinarios de extranjería. No se exigen medios económicos propios al solicitante.',
    requirements: [
      'Ser familiar directo del ciudadano UE/EEE: cónyuge, pareja de hecho registrada, hijo menor de 21 años o dependiente, ascendiente a cargo',
      'El ciudadano UE debe residir efectivamente en España (con certificado de empadronamiento)',
      'Pasaporte en vigor del familiar extracomunitario',
      'Documentación del vínculo: certificado de matrimonio apostillado, libro de familia, inscripción de pareja de hecho, etc.',
      'Fotografías en fondo blanco',
      'Modelo EX-19 cumplimentado',
    ],
    timeframe: '1 a 3 meses',
    links: [
      {
        label: 'Ciudadanos comunitarios y sus familias — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanoscomunitarios/',
        desc: 'Ministerio de Inclusión',
      },
      {
        label: 'Real Decreto 240/2007',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2007-5473',
        desc: 'Régimen de entrada, libre circulación y residencia de ciudadanos UE y sus familias',
      },
      {
        label: 'Directiva 2004/38/CE del Parlamento Europeo',
        url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32004L0038',
        desc: 'Directiva europea sobre libre circulación de ciudadanos UE',
      },
    ],
  },

  'nacionalidad-residencia': {
    id: 'nacionalidad-residencia',
    tramite: 'Nacionalidad Española por Residencia',
    area: 'Extranjería',
    tagline: 'El paso final tras años construyendo tu vida en España',
    description:
      'La nacionalidad por residencia se concede a quienes acreditan haber residido legalmente en España durante el periodo exigido: 10 años (general), 5 años (refugiados), 2 años (nacionales de países iberoamericanos, Filipinas, Guinea Ecuatorial, Andorra, Portugal y sefardíes) o 1 año (en casos especiales). Requiere superar las pruebas CCSE y DELE A2.',
    requirements: [
      'Residencia legal y continuada en España durante el periodo exigido (1, 2, 5 o 10 años según origen)',
      'Buena conducta cívica: sin antecedentes penales en España ni en el extranjero',
      'Prueba DELE A2 de español (salvo hablantes nativos o con titulación española)',
      'Prueba CCSE del Instituto Cervantes (conocimientos constitucionales y socioculturales)',
      'Renuncia a la nacionalidad anterior (salvo excepciones: iberoamericanos, andorranos, filipinos, ecuatoguineanos, portugueses y sefardíes)',
      'Jura o promesa ante el Registro Civil o notario una vez concedida',
    ],
    timeframe: '1 a 3 años (incluida la instrucción completa del expediente)',
    links: [
      {
        label: 'Ministerio de Justicia — Nacionalidad por Residencia',
        url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-residencia',
        desc: 'Información oficial, requisitos y formularios',
      },
      {
        label: 'CANAR — Solicitud online de nacionalidad',
        url: 'https://canar.mjusticia.gob.es/',
        desc: 'Plataforma oficial para presentar la solicitud',
      },
      {
        label: 'Código Civil — Art. 21 y 22',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Requisitos legales de la nacionalidad por residencia',
      },
      {
        label: 'Pruebas CCSE — Instituto Cervantes',
        url: 'https://cervantes.es/lengua_y_ensenanza/ccse/default.htm',
        desc: 'Información, temario y registro para las pruebas de conocimientos constitucionales',
      },
      {
        label: 'Prueba DELE A2 — Instituto Cervantes',
        url: 'https://cervantes.es/lengua_y_ensenanza/dele/default.htm',
        desc: 'Diplomas de Español como Lengua Extranjera',
      },
    ],
  },

  'nacionalidad-mdd': {
    id: 'nacionalidad-mdd',
    tramite: 'Nacionalidad — Ley de Memoria Democrática',
    area: 'Extranjería',
    tagline: 'Recupera la nacionalidad española si tienes ascendencia del exilio',
    description:
      'La Ley 20/2022 de Memoria Democrática amplía el derecho a la nacionalidad española a hijos y nietos de personas exiliadas o represaliadas por el régimen franquista que perdieron o no pudieron adquirir la nacionalidad española. También aplica a los descendientes de los combatientes de las Brigadas Internacionales.',
    requirements: [
      'Ser hijo o nieto de padre/madre que fue español/a de origen y perdió la nacionalidad por exilio o represión',
      'Certificado de nacimiento del padre/madre o abuelo/abuela español apostillado',
      'Certificado de defunción del progenitor o abuelo español (si aplica)',
      'Documentación que acredite la pérdida de nacionalidad por exilio o represión (pasaportes históricos, documentos del exilio, etc.)',
      'Certificado de nacimiento del solicitante',
      'No tener antecedentes penales',
    ],
    timeframe: '1 a 2 años',
    links: [
      {
        label: 'Ley 20/2022 de Memoria Democrática — Disposición adicional 8ª',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-15793',
        desc: 'Texto completo en el BOE',
      },
      {
        label: 'Ministerio de Justicia — Nacionalidad por Memoria Democrática',
        url: 'https://www.mjusticia.gob.es/es/ciudadania/tramites/nacionalidad-ley-memoria-democratica',
        desc: 'Tramitación, requisitos y formularios',
      },
      {
        label: 'Código Civil — Art. 20.1.b',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Base legal del derecho de opción a la nacionalidad',
      },
    ],
    note:
      'El plazo para solicitar la nacionalidad al amparo de esta ley es limitado. Si crees que puedes tener derecho, consúltanos cuanto antes para no perder la oportunidad.',
  },

  'visado-estudios': {
    id: 'visado-estudios',
    tramite: 'Visado o Estancia por Estudios',
    area: 'Extranjería',
    tagline: 'Estudia en España con toda la seguridad jurídica',
    description:
      'El visado de estudios permite a ciudadanos no comunitarios residir en España durante su formación. Si ya estás en España, la estancia por estudios permite regularizarte con matrícula en un centro autorizado. También es posible solicitar autorización para trabajar simultáneamente si la formación lo permite.',
    requirements: [
      'Carta de admisión o matrícula en un centro educativo autorizado por el Ministerio de Educación',
      'Pasaporte en vigor con al menos 1 año de validez',
      'Medios económicos suficientes para el período de estancia',
      'Seguro médico público o privado con cobertura completa en España',
      'No tener antecedentes penales',
      'Tasa de solicitud abonada',
      'Alojamiento acreditado (contrato de alquiler, carta de familia de acogida, etc.)',
    ],
    timeframe: '1 a 3 meses',
    links: [
      {
        label: 'Estancia y Residencia por Estudios — Información oficial',
        url: 'https://extranjeros.inclusion.gob.es/es/InformacionInteres/InformacionProcedimientos/Ciudadanosnocomunitarios/hoja024/index.html',
        desc: 'Ministerio de Inclusión',
      },
      {
        label: 'Ley Orgánica 4/2000 — Art. 33 y 34',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-544',
        desc: 'Estancia y residencia por estudios',
      },
      {
        label: 'Consulados de España en el Exterior',
        url: 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Consulados.aspx',
        desc: 'Para solicitar el visado desde el país de origen',
      },
    ],
  },

  'asilo': {
    id: 'asilo',
    tramite: 'Solicitud de Asilo y Protección Internacional',
    area: 'Extranjería',
    tagline: 'Tu seguridad y protección son nuestra prioridad',
    description:
      'La protección internacional (asilo político o protección subsidiaria) ampara a personas que no pueden volver a su país por fundado temor de persecución por motivos de raza, religión, nacionalidad, opinión política o pertenencia a un grupo social determinado. La solicitud debe presentarse lo antes posible tras llegar a España.',
    requirements: [
      'Presentar la solicitud en el plazo establecido (en frontera: inmediatamente; en territorio: dentro del mes siguiente a la llegada)',
      'Exponer de forma detallada los motivos de persecución o riesgo grave en el país de origen',
      'Pasaporte u otro documento de viaje (si se dispone de él)',
      'Cualquier prueba o documentación que apoye el relato (noticias, resoluciones, cartas de amenaza, informes de organizaciones...)',
    ],
    timeframe: '6 meses a varios años (el proceso puede ser prolongado)',
    links: [
      {
        label: 'Ministerio del Interior — Solicitud de Asilo',
        url: 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/solicitud-de-asilo/',
        desc: 'Información oficial, centros de solicitud y procedimiento',
      },
      {
        label: 'Ley 12/2009 — Derecho de Asilo y Protección Subsidiaria',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2009-17242',
        desc: 'Ley reguladora del derecho de asilo en España',
      },
      {
        label: 'ACNUR España',
        url: 'https://www.acnur.org/es/espana',
        desc: 'Alto Comisionado de Naciones Unidas para los Refugiados',
      },
      {
        label: 'CEAR — Comisión Española de Ayuda al Refugiado',
        url: 'https://www.cear.es/',
        desc: 'Organización de apoyo a solicitantes de asilo en España',
      },
    ],
    note:
      'Presentar la solicitud fuera de plazo puede llevar a la inadmisión. Si has llegado recientemente a España y estás en peligro, contáctanos cuanto antes.',
  },

  /* ── LABORAL ─────────────────────────────────────────────────────────────── */

  'despido': {
    id: 'despido',
    tramite: 'Impugnación de Despido',
    area: 'Laboral',
    tagline: 'Defiende tus derechos frente a un despido injusto',
    description:
      'Si te han despedido sin causa justificada o vulnerando derechos fundamentales, puedes impugnar el despido ante el Juzgado de lo Social. El plazo es de 20 días hábiles desde la comunicación. Un despido improcedente conlleva readmisión o indemnización; uno nulo, readmisión obligatoria y abono de los salarios de tramitación.',
    requirements: [
      'Carta de despido (o comunicación verbal documentada) — consérvala siempre',
      'Nóminas de los últimos meses trabajados',
      'Contrato de trabajo',
      'Informe de vida laboral de la Seguridad Social',
      'PLAZO FATAL: 20 días hábiles desde la comunicación del despido para presentar papeleta de conciliación en el SMAC',
    ],
    timeframe: '2 a 8 meses (conciliación previa + juicio si no hay acuerdo)',
    links: [
      {
        label: 'Estatuto de los Trabajadores — Art. 49 al 57',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Extinción del contrato y tipos de despido',
      },
      {
        label: 'Ley Reguladora de la Jurisdicción Social (LRJS)',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-15936',
        desc: 'Procedimiento judicial laboral de impugnación',
      },
      {
        label: 'SMAC — Servicio de Mediación, Arbitraje y Conciliación',
        url: 'https://www.mites.gob.es/',
        desc: 'Conciliación laboral previa al juicio (trámite obligatorio)',
      },
      {
        label: 'SEPE — Prestación por Desempleo',
        url: 'https://www.sepe.es/',
        desc: 'Solicitud del paro tras el despido',
      },
    ],
    note:
      '⚠ El plazo de 20 días hábiles es fatal e improrrogable: si lo pierdes, no podrás reclamar por despido. Actúa de inmediato.',
  },

  'reclamacion-salarios': {
    id: 'reclamacion-salarios',
    tramite: 'Reclamación de Salarios e Impagos',
    area: 'Laboral',
    tagline: 'Cobra lo que te deben: salarios, pagas extras y finiquito',
    description:
      'Si tu empresa no te paga el salario, las pagas extraordinarias, horas extra o el finiquito, puedes reclamar ante el Juzgado de lo Social o denunciar a la Inspección de Trabajo. El plazo para reclamar salarios es de 1 año desde que la deuda era exigible.',
    requirements: [
      'Nóminas del período reclamado (o justificante de que no se han entregado)',
      'Extractos bancarios que acrediten la falta de ingreso del salario',
      'Contrato de trabajo y convenio colectivo aplicable',
      'Finiquito (si se ha entregado — firmarlo "no conforme" si hay discrepancias)',
      'Cualquier comunicación escrita con la empresa sobre los impagos',
    ],
    timeframe: '1 a 6 meses',
    links: [
      {
        label: 'Estatuto de los Trabajadores — Art. 29 y 59',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Liquidación del salario y prescripción de acciones',
      },
      {
        label: 'Inspección de Trabajo y Seguridad Social',
        url: 'https://www.mites.gob.es/es/itss/web/index.html',
        desc: 'Denuncia por impago de salarios',
      },
      {
        label: 'FOGASA — Fondo de Garantía Salarial',
        url: 'https://www.mites.gob.es/es/Guia/texto/guia_6/contenidos/guia_6_28_2.htm',
        desc: 'Cobertura de salarios en caso de insolvencia o concurso empresarial',
      },
      {
        label: 'Ley Reguladora de la Jurisdicción Social',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-15936',
        desc: 'Procedimiento de reclamación de cantidad ante el juzgado',
      },
    ],
    note:
      'Si la empresa está en concurso de acreedores o es insolvente, el FOGASA puede cubrir hasta ciertos límites de los salarios adeudados. No esperes a que sea tarde.',
  },

  'modificacion-condiciones': {
    id: 'modificacion-condiciones',
    tramite: 'Modificación Sustancial de Condiciones de Trabajo',
    area: 'Laboral',
    tagline: 'Tu empresa no puede cambiar tus condiciones sin justificación legal',
    description:
      'La empresa puede modificar condiciones laborales por razones objetivas, pero debe seguir un procedimiento estricto. Si la modificación es sustancial (jornada, horario, turno, remuneración, funciones, lugar de trabajo…) y carece de justificación suficiente, puedes impugnarla o extinguir el contrato con indemnización de 20 días por año.',
    requirements: [
      'Comunicación escrita de la empresa con la modificación y sus motivos justificados',
      'Contrato de trabajo original',
      'Convenio colectivo aplicable',
      'PLAZO: 20 días hábiles desde la notificación para impugnar ante el juzgado, o 15 días para ejercer el derecho a la extinción indemnizada',
    ],
    timeframe: '2 a 6 meses',
    links: [
      {
        label: 'Estatuto de los Trabajadores — Art. 41',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Modificación sustancial de condiciones de trabajo',
      },
      {
        label: 'Ley Reguladora de la Jurisdicción Social',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-15936',
        desc: 'Procedimiento de impugnación de modificaciones sustanciales',
      },
      {
        label: 'Inspección de Trabajo y Seguridad Social',
        url: 'https://www.mites.gob.es/es/itss/web/index.html',
        desc: 'Denuncia por modificación ilegal de condiciones',
      },
    ],
    note:
      'Tienes derecho a elegir: impugnar la modificación (para que la dejen sin efecto) o aceptarla y extinguir el contrato con una indemnización de 20 días por año trabajado (máx. 9 meses).',
  },

  'permisos-vacaciones': {
    id: 'permisos-vacaciones',
    tramite: 'Vacaciones, Permisos y Excedencias',
    area: 'Laboral',
    tagline: 'Haz valer tu derecho a la conciliación familiar y laboral',
    description:
      'La ley garantiza al menos 30 días naturales de vacaciones al año, además de los permisos retribuidos (nacimiento, fallecimiento, matrimonio…) y el derecho a solicitar reducciones de jornada, excedencias por cuidado de hijos o familiares, y adaptación de jornada. Negarlos o dificultarlos injustificadamente es ilegal.',
    requirements: [
      'Solicitud de vacaciones, permiso o reducción de jornada por escrito (guarda siempre copia)',
      'Denegación o respuesta de la empresa (escrita o documentada)',
      'Justificante del motivo del permiso (libro de familia, certificado médico, certificado de matrimonio...)',
      'Convenio colectivo aplicable',
      'Contrato de trabajo',
    ],
    timeframe: '1 a 4 meses',
    links: [
      {
        label: 'Estatuto de los Trabajadores — Art. 37 y 38',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Vacaciones anuales y permisos retribuidos',
      },
      {
        label: 'Estatuto de los Trabajadores — Art. 46',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Excedencias voluntarias y forzosas',
      },
      {
        label: 'Ley de Conciliación Familiar — Ley 39/1999',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-21568',
        desc: 'Conciliación de la vida familiar y laboral',
      },
      {
        label: 'RD-Ley 6/2019 — Igualdad de trato en el empleo',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3244',
        desc: 'Medidas urgentes para igualdad real de hombres y mujeres en el trabajo',
      },
    ],
  },

  'accidente-trabajo': {
    id: 'accidente-trabajo',
    tramite: 'Accidente de Trabajo y Enfermedad Profesional',
    area: 'Laboral',
    tagline: 'Protege tu salud y tus derechos tras un accidente laboral',
    description:
      'Un accidente de trabajo o enfermedad profesional genera derechos específicos: incapacidad temporal con base reguladora más alta, asistencia sanitaria completa y posible reclamación de daños y perjuicios por falta de medidas de seguridad. El recargo de prestaciones puede añadir un 30-50% adicional si existe infracción de normas de seguridad.',
    requirements: [
      'Parte de accidente de trabajo (debe emitirlo la empresa el mismo día)',
      'Informe médico del accidente o enfermedad profesional',
      'Documentación de la relación laboral (contrato, nóminas)',
      'Evaluación de riesgos y plan de prevención de la empresa (si lo tienes)',
      'Denuncia ante la Inspección de Trabajo si hay falta de medidas de seguridad',
    ],
    timeframe: '3 meses a 2 años según gravedad y tipo de reclamación',
    links: [
      {
        label: 'Ley de Prevención de Riesgos Laborales — Ley 31/1995',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292',
        desc: 'Obligaciones empresariales en materia de seguridad e higiene',
      },
      {
        label: 'INSS — Incapacidad Temporal por accidente de trabajo',
        url: 'https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesContributivas/10952',
        desc: 'Prestaciones económicas por incapacidad temporal y permanente',
      },
      {
        label: 'Inspección de Trabajo — Seguridad y Salud Laboral',
        url: 'https://www.mites.gob.es/es/itss/web/index.html',
        desc: 'Denuncia por incumplimiento de medidas de seguridad',
      },
      {
        label: 'Estatuto de los Trabajadores — Art. 19',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
        desc: 'Seguridad e higiene en el trabajo — derechos del trabajador',
      },
    ],
    note:
      'Documenta todo desde el primer momento: fotos, testigos, partes médicos. No firmes documentos de la empresa sin asesoramiento previo.',
  },

  /* ── FAMILIA ─────────────────────────────────────────────────────────────── */

  'divorcio': {
    id: 'divorcio',
    tramite: 'Divorcio y Separación Matrimonial',
    area: 'Familia',
    tagline: 'Cerramos una etapa protegiendo lo que más importa',
    description:
      'El divorcio puede tramitarse de mutuo acuerdo (más rápido y económico, incluso ante notario si no hay hijos menores) o de forma contenciosa cuando no hay acuerdo. Desde la Ley 15/2005 no se exige causa ni período previo de separación. Gestionamos la disolución del régimen económico matrimonial, uso de la vivienda, pensiones y todo lo que se derive.',
    requirements: [
      'Libro de familia o certificado literal de matrimonio',
      'DNI o pasaporte de ambos cónyuges',
      'Documentación de bienes comunes: escrituras de inmuebles, cuentas bancarias, vehículos',
      'Si hay hijos: partidas de nacimiento, situación económica de ambos progenitores, gastos del menor',
      'Convenio regulador si es de mutuo acuerdo (lo redactamos nosotras)',
    ],
    timeframe: '2 a 4 meses (mutuo acuerdo) / 6 meses a 2 años (contencioso)',
    links: [
      {
        label: 'Código Civil — Art. 81 al 107',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Separación y divorcio: causas, efectos y procedimiento',
      },
      {
        label: 'Ley 15/2005 — Reforma del divorcio',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2005-11864',
        desc: 'Divorcio sin causa ni período previo de separación',
      },
      {
        label: 'Ley de Jurisdicción Voluntaria — Art. 82 CC',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-7391',
        desc: 'Divorcio notarial de mutuo acuerdo (sin hijos menores)',
      },
      {
        label: 'Ley de Enjuiciamiento Civil — Procesos matrimoniales',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-323',
        desc: 'Procedimiento judicial del divorcio contencioso',
      },
    ],
    note:
      'Si ambas partes están de acuerdo, el proceso es significativamente más rápido y económico. Si no hay hijos menores, incluso puede tramitarse ante notario sin acudir al juzgado.',
  },

  'guarda-custodia': {
    id: 'guarda-custodia',
    tramite: 'Guarda, Custodia y Pensión de Alimentos',
    area: 'Familia',
    tagline: 'Siempre, el interés superior del menor como prioridad',
    description:
      'El régimen de guarda y custodia (exclusiva o compartida), el régimen de visitas del progenitor no custodio y la pensión de alimentos se fijan en el convenio regulador o por sentencia judicial. Pueden modificarse posteriormente si cambian las circunstancias de los progenitores o del menor.',
    requirements: [
      'Partidas de nacimiento de los hijos menores',
      'Acreditación de ingresos de ambos progenitores (nóminas, declaración de la renta, vida laboral)',
      'Documentación de gastos del menor: colegio, actividades, sanidad, etc.',
      'Domicilios habituales y situación de ambos progenitores',
      'Resoluciones judiciales previas si ya existe un procedimiento abierto',
    ],
    timeframe: '3 meses a 1 año',
    links: [
      {
        label: 'Código Civil — Art. 92 al 96',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Guarda, custodia y alimentos de los hijos tras la separación',
      },
      {
        label: 'Ley Orgánica 8/2015 — Protección a la Infancia',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-8470',
        desc: 'Interés superior del menor y sistema de protección',
      },
      {
        label: 'Ley de Enjuiciamiento Civil — Procesos de familia',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-323',
        desc: 'Procedimientos judiciales sobre medidas paterno-filiales',
      },
    ],
    note:
      'La pensión de alimentos no es negociable: es un derecho del menor que no puede renunciarse. Su cuantía depende de los ingresos de los progenitores y las necesidades del hijo.',
  },

  'convenio-regulador': {
    id: 'convenio-regulador',
    tramite: 'Convenio Regulador',
    area: 'Familia',
    tagline: 'Un acuerdo justo y equilibrado que proteja a ambas partes',
    description:
      'El convenio regulador es el documento que regula las condiciones de la separación o divorcio de mutuo acuerdo: uso de la vivienda familiar, pensión compensatoria entre cónyuges, régimen de visitas, guarda de los hijos, pensión de alimentos, liquidación de gananciales, etc. Una vez aprobado judicialmente o ante notario, tiene plena eficacia legal.',
    requirements: [
      'Acuerdo entre ambas partes sobre todos los puntos esenciales (o mediación familiar previa)',
      'Libro de familia o certificado de matrimonio',
      'Documentación sobre bienes comunes: escrituras, cuentas, vehículos',
      'Información económica de ambos cónyuges: nóminas, declaraciones de renta',
      'Partidas de nacimiento de los hijos (si los hay)',
    ],
    timeframe: '1 a 3 meses tras la firma del convenio',
    links: [
      {
        label: 'Código Civil — Art. 90 al 91',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Contenido mínimo y eficacia del convenio regulador',
      },
      {
        label: 'Ley de Jurisdicción Voluntaria',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-7391',
        desc: 'Convenio ante notario cuando no hay hijos menores',
      },
      {
        label: 'Ley de Enjuiciamiento Civil — Art. 770',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2000-323',
        desc: 'Procedimiento de mutuo acuerdo con hijos menores',
      },
    ],
    note:
      'Nosotras redactamos el convenio regulador con todo el detalle necesario y cuidando que proteja tus intereses ahora y en el futuro. Un convenio mal redactado puede causarte problemas años después.',
  },

  'incapacitacion': {
    id: 'incapacitacion',
    tramite: 'Medidas de Apoyo y Curatela',
    area: 'Familia',
    tagline: 'Protección jurídica para quien más lo necesita',
    description:
      'Desde la Ley 8/2021, el antiguo sistema de tutela e incapacitación fue reformado: ahora el objetivo es apoyar a la persona con discapacidad en el ejercicio de su capacidad jurídica, respetando su voluntad. La curatela representativa requiere resolución judicial cuando las medidas voluntarias (poderes preventivos, autocuratela) son insuficientes.',
    requirements: [
      'Informe médico o psicológico actualizado que acredite la necesidad de apoyo',
      'DNI de la persona que necesita medidas de apoyo',
      'DNI y documentación del solicitante (parentesco, interés legítimo)',
      'Documentación patrimonial: bienes, ingresos, deudas',
      'Propuesta razonada de las medidas de apoyo más adecuadas y proporcionales',
      'Inventario de bienes de la persona (si se solicita la curatela patrimonial)',
    ],
    timeframe: '6 meses a 1 año (procedimiento judicial de jurisdicción voluntaria)',
    links: [
      {
        label: 'Ley 8/2021 — Reforma del sistema de tutela y curatela',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-9233',
        desc: 'Nueva regulación de medidas de apoyo a personas con discapacidad',
      },
      {
        label: 'Código Civil — Art. 249 y siguientes',
        url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
        desc: 'Medidas de apoyo a personas con discapacidad en el ejercicio de su capacidad',
      },
      {
        label: 'Convención de la ONU sobre los Derechos de las Personas con Discapacidad',
        url: 'https://www.un.org/esa/socdev/enable/documents/tccconvs.pdf',
        desc: 'Marco internacional que fundamenta la reforma española',
      },
      {
        label: 'CERMI — Comité Español de Representantes de Personas con Discapacidad',
        url: 'https://www.cermi.es/',
        desc: 'Recursos e información sobre derechos de personas con discapacidad',
      },
    ],
    note:
      'Cada situación es única. Las medidas de apoyo deben ser proporcionales y adaptadas a las necesidades reales de la persona, respetando siempre su voluntad y autonomía.',
  },

  /* ── GENERAL ─────────────────────────────────────────────────────────────── */

  'asesoria': {
    id: 'asesoria',
    tramite: 'Asesoría Personalizada',
    area: 'Extranjería',
    tagline: 'Tu caso necesita un análisis individualizado',
    description:
      'Basándonos en tus respuestas, tu situación no encaja directamente en un trámite estándar o existen varias opciones posibles que dependen de detalles específicos de tu caso. Una asesoría inicial con nosotras es el primer paso para encontrar el camino correcto, sin perder tiempo ni oportunidades legales.',
    requirements: [],
    timeframe: 'La primera asesoría nos permite orientarte con precisión',
    links: [
      {
        label: 'Portal de Extranjería — Información General',
        url: 'https://extranjeros.inclusion.gob.es/',
        desc: 'Ministerio de Inclusión, Seguridad Social y Migraciones',
      },
      {
        label: 'Sede Electrónica — Extranjería',
        url: 'https://sede.inclusion.gob.es/',
        desc: 'Tramitaciones y consultas online',
      },
    ],
    note:
      'No te desanimes si tu situación parece complicada. Siempre existe una vía legal: la encontramos juntas.',
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAreaIcon(area: ResultDef['area']) {
  if (area === 'Laboral') return Briefcase;
  if (area === 'Familia') return Heart;
  return Globe;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  const [currentStep, setCurrentStep] = useState<string>('start');
  const [result, setResult] = useState<ResultDef | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const step = STEPS[currentStep];

  const handleOption = (next: string, choiceLabel: string) => {
    setHistory(prev => [...prev, { stepId: currentStep, choiceLabel }]);
    if (next.startsWith('result:')) {
      const resultId = next.replace('result:', '');
      setResult(RESULTS[resultId] ?? null);
      setCurrentStep('done');
    } else {
      setCurrentStep(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prev = [...history];
    const last = prev.pop()!;
    setHistory(prev);
    setCurrentStep(last.stepId);
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setCurrentStep('start');
    setResult(null);
    setHistory([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col">
      {/* Header */}
      <header className="fixed w-full z-50 bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--glass-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center shadow-lg border-2 border-white overflow-hidden shrink-0">
              <img src="/logopv.jpeg" alt="PV Abogadas" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-roman text-lg sm:text-xl font-bold tracking-tight text-[var(--pv-navy)] uppercase">PV Abogadas</div>
              <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-[var(--pv-gold)] font-bold">
                expertas en Extranjeria | Laboral | Familia
              </p>
            </div>
          </Link>
          <HomeNavbar />
        </div>
      </header>

      <main className="flex-1 pt-[72px]">
        {/* Hero */}
        <section className="relative bg-[var(--pv-navy)] py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('/loginm.png')] bg-cover bg-center mix-blend-overlay" />
          <div className="absolute -left-40 top-0 w-96 h-96 bg-[var(--pv-gold)]/20 rounded-full blur-[120px]" />
          <div className="absolute -right-40 bottom-0 w-96 h-96 bg-[var(--pv-gold)]/10 rounded-full blur-[120px]" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--pv-gold)]/40 text-[var(--pv-gold)] text-[10px] font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-md bg-white/5">
              <BookOpen size={14} /> Guía Interactiva de Trámites Legales
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white font-roman uppercase tracking-tight mb-4 drop-shadow-xl">
              ¿Qué trámite<br />
              <span className="text-[var(--pv-gold)]">necesitas?</span>
            </h1>
            <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Responde unas preguntas sencillas y te diremos exactamente qué gestión legal necesitas: requisitos, tiempos y fuentes oficiales incluidos.
            </p>
          </div>
        </section>

        {/* Wizard */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

          {/* Progress breadcrumb */}
          {history.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-8 text-[10px] text-[var(--pv-navy)]/40 font-bold uppercase tracking-widest">
              <span
                onClick={handleReset}
                className="cursor-pointer hover:text-[var(--pv-gold)] transition-colors"
              >
                Inicio
              </span>
              {history.map((h, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="text-[var(--pv-navy)]/20">›</span>
                  <span className="max-w-[200px] truncate text-[var(--pv-navy)]/50">{h.choiceLabel}</span>
                </span>
              ))}
            </div>
          )}

          {/* Question */}
          {!result && step && (
            <div>
              <div className="mb-8 sm:mb-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pv-gold)] mb-3">
                  Paso {history.length + 1} de {history.length + 1}
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold font-roman text-[var(--pv-navy)] uppercase tracking-tight mb-2">
                  {step.question}
                </h2>
                {step.subtitle && (
                  <p className="text-sm text-[var(--pv-navy)]/60 mt-2 leading-relaxed max-w-2xl">
                    {step.subtitle}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {step.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOption(opt.next, opt.label)}
                    className="w-full text-left group flex items-start gap-4 p-5 sm:p-6 bg-white border border-[var(--pv-navy)]/10 rounded-2xl hover:border-[var(--pv-gold)] hover:shadow-xl transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--pv-navy)]/5 group-hover:bg-[var(--pv-gold)] flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-300">
                      <ArrowRight size={14} className="text-[var(--pv-navy)]/40 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--pv-navy)] group-hover:text-[var(--pv-gold)] transition-colors duration-300 leading-snug">
                        {opt.label}
                      </p>
                      {opt.desc && (
                        <p className="text-xs text-[var(--pv-navy)]/50 mt-1">{opt.desc}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {history.length > 0 && (
                <button
                  onClick={handleBack}
                  className="mt-8 flex items-center gap-2 text-xs text-[var(--pv-navy)]/50 hover:text-[var(--pv-navy)] font-bold uppercase tracking-widest transition-colors"
                >
                  <ChevronLeft size={14} /> Volver a la pregunta anterior
                </button>
              )}
            </div>
          )}

          {/* Result */}
          {result && (() => {
            const AreaIcon = getAreaIcon(result.area);
            return (
              <div>
                {/* Result Header Card */}
                <div className="bg-[var(--pv-navy)] rounded-3xl p-8 sm:p-12 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-[0.04] pointer-events-none translate-x-1/3 -translate-y-1/4">
                    <AreaIcon size={350} />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--pv-gold)]/20 text-[var(--pv-gold)] text-[10px] font-bold uppercase tracking-[0.2em] border border-[var(--pv-gold)]/30 mb-4">
                      {result.area}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-bold font-roman text-white uppercase tracking-tight mb-3 leading-tight">
                      {result.tramite}
                    </h2>
                    <p className="text-[var(--pv-gold)] font-bold text-sm uppercase tracking-widest mb-5">
                      {result.tagline}
                    </p>
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-2xl">
                      {result.description}
                    </p>
                    <div className="flex items-center gap-2 mt-6 text-white/50 text-xs font-bold uppercase tracking-widest">
                      <Clock size={13} />
                      Tiempo estimado: {result.timeframe}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {result.requirements.length > 0 && (
                  <div className="bg-white border border-[var(--pv-navy)]/10 rounded-2xl p-6 sm:p-8 mb-6">
                    <h3 className="font-black uppercase tracking-[0.15em] text-[var(--pv-navy)] text-[10px] mb-6 flex items-center gap-2">
                      <FileText size={14} className="text-[var(--pv-gold)]" />
                      Documentación necesaria
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[var(--pv-navy)]/80 leading-snug">
                          <CheckCircle2 size={15} className="text-[var(--pv-gold)] shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Note */}
                {result.note && (
                  <div className="bg-[var(--pv-gold)]/10 border border-[var(--pv-gold)]/30 rounded-2xl p-5 sm:p-6 mb-6 flex items-start gap-4">
                    <AlertTriangle size={18} className="text-[var(--pv-gold)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--pv-navy)] leading-relaxed">{result.note}</p>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-[var(--pv-navy)] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                  <div>
                    <p className="text-white font-bold text-lg sm:text-xl font-roman uppercase">
                      ¿Es este tu trámite?
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      Agenda una asesoría inicial y lo gestionamos juntas, paso a paso.
                    </p>
                  </div>
                  <Link
                    href="/reservar"
                    className="btn-roman flex items-center gap-3 whitespace-nowrap shrink-0 text-sm px-8 py-3.5"
                  >
                    Reservar asesoría <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Navigation actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <button
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 text-xs text-[var(--pv-navy)]/60 hover:text-[var(--pv-navy)] font-bold uppercase tracking-widest transition-colors px-5 py-3 border border-[var(--pv-navy)]/10 rounded-xl hover:bg-white hover:border-[var(--pv-navy)]/20"
                  >
                    <ChevronLeft size={14} /> Volver a la pregunta anterior
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 text-xs text-[var(--pv-navy)]/60 hover:text-[var(--pv-navy)] font-bold uppercase tracking-widest transition-colors px-5 py-3 border border-[var(--pv-navy)]/10 rounded-xl hover:bg-white hover:border-[var(--pv-navy)]/20"
                  >
                    <RotateCcw size={14} /> Empezar de nuevo
                  </button>
                </div>

                {/* Fuentes oficiales — al final, como referencia */}
                <details className="group bg-white border border-[var(--pv-navy)]/10 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-black uppercase tracking-[0.15em] text-[var(--pv-navy)]/50 hover:text-[var(--pv-navy)] text-[10px] transition-colors">
                    <span className="flex items-center gap-2">
                      <ExternalLink size={13} className="text-[var(--pv-gold)]" />
                      Fuentes oficiales y normativa
                    </span>
                    <ChevronRight size={14} className="transition-transform duration-300 group-open:rotate-90 shrink-0" />
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-[var(--pv-navy)]/5">
                    <ul className="space-y-4">
                      {result.links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link flex items-start gap-3"
                          >
                            <ExternalLink
                              size={13}
                              className="text-[var(--pv-navy)]/25 group-hover/link:text-[var(--pv-gold)] shrink-0 mt-1 transition-colors"
                            />
                            <div>
                              <p className="text-sm font-bold text-[var(--pv-navy)] group-hover/link:text-[var(--pv-gold)] transition-colors leading-snug">
                                {link.label}
                              </p>
                              <p className="text-[10px] text-[var(--pv-navy)]/45 mt-0.5 leading-snug">
                                {link.desc}
                              </p>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
            );
          })()}
        </section>
      </main>

      <HomeFooter />
      <WhatsAppButton />
    </div>
  );
}

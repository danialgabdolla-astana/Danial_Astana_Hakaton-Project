import { formatDate } from "../dates";
import { formatUsd } from "../money";
import type { Messages, Vars } from "./en";

const usd = (n: unknown) => formatUsd(Number(n) || 0);
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const KIND: Record<string, string> = {
  anesthesia: "anestesia",
  "assistant surgeon": "cirujano asistente",
  radiology: "radiología",
  "pathology/lab": "patología/laboratorio",
};
const kind = (k: unknown) => KIND[String(k)] ?? String(k ?? "");

/** Spanish (US). Informal “tú”, the usual register for US consumer apps. */
export const es: Messages = {
  langName: "Español",
  common: {
    language: "Idioma",
    loading: "Cargando…",
    checkABill: "Revisar una factura",
    myDisputes: "Mis disputas",
  },
  footer: {
    github: "Código fuente en GitHub",
    disclaimerStrong: "BillCheck no es un bufete de abogados ni un proveedor médico. No es asesoría legal ni médica.",
    disclaimerRest: "Te ayudamos a leer tus documentos y a hacer las preguntas correctas.",
    knowRights: "Conoce tus derechos:",
    cmsRights: "CMS — derechos sobre facturas médicas",
    nsa: "Ley No Surprises",
    project: "Proyecto de Business Cup 2.0. Los documentos de ejemplo son ficticios.",
  },
  landing: {
    launchBadge: (pct: number) => `Precio de lanzamiento −${pct}%`,
    previewLabel: "Resultado de ejemplo",
    previewSub: "Factura $1,840 · El EOB dice que debes $1,195",
    ctaFree: "Revisar mi factura gratis",
    ctaFamily: "Empezar con una revisión gratis",
    vsChatShort: "Chatbot",
    badge: "Para adultos con seguro que tienen una factura médica que no entienden",
    h1: "Tu factura médica podría estar mal. Compárala con tu EOB en 2 minutos.",
    lede: "Sube tu factura y la Explicación de Beneficios (EOB) de tu aseguradora. BillCheck compara cada línea, te muestra qué puedes disputar y te da una carta lista para enviar, un guion para llamar y los plazos.",
    ctaCheck: "Revisar mi factura",
    ctaSample: "Probar con una factura de ejemplo",
    orTry: "O prueba una",
    anesthesiaLink: "factura sorpresa de anestesia",
    anesthesiaNote: "(caso de la Ley No Surprises).",
    trust: "Revisión gratis · Sin registro · Sin acceso a tu seguro ni a tu banco · Nunca guardamos tus archivos",
    stats: [
      { n: "43%", t: "de los adultos en EE. UU. dice haber recibido una factura médica o dental que creía que tenía un error.", s: "Encuesta de KFF sobre deudas médicas" },
      { n: "45%", t: "de los adultos asegurados en edad laboral recibió una factura por algo que creía que el seguro debía cubrir.", s: "Commonwealth Fund, 2024" },
      { n: "38%", t: "de quienes disputaron un error de facturación lograron reducir o anular la factura.", s: "Commonwealth Fund, 2024" },
    ],
    deductibleNote:
      "El seguro no evita las facturas: el deducible promedio de los planes de empleador es de $1,886, y el 34% de los trabajadores asegurados tiene uno de $2,000 o más (KFF 2025). Hasta cubrirlo, pagas casi todo tú, así que una factura inflada infla tu parte.",
    howTitle: "Cómo funciona",
    steps: [
      ["Sube dos documentos", "Tu factura detallada y tu EOB: PDF, foto o texto pegado. Ocultamos nombres e identificaciones."],
      [
        "Mira qué no coincide",
        "Emparejamos cada línea de la factura con tu EOB y aplicamos 8 reglas de facturación: duplicados, cargos que el seguro nunca vio, facturas por encima del EOB, facturas sorpresa fuera de la red y más.",
      ],
      ["Dispútala paso a paso", "Recibe una carta, un guion para llamar y los plazos. Registra cada llamada hasta resolverlo."],
    ],
    aiTitle: "La IA lee. Las reglas deciden.",
    aiBody:
      "La IA solo transcribe tus documentos a datos. Cada problema y cada monto en dólares salen de reglas de facturación fijas y probadas, así que la misma factura siempre da la misma respuesta y cada hallazgo muestra exactamente de dónde viene.",
    vsTitle: "¿Por qué no preguntarle a ChatGPT?",
    vsLede: "Un chatbot puede explicar qué significa un código CPT. Recuperar tu dinero exige una revisión comparada, un rastro en papel y seguimiento.",
    vsChat: "Chatbot de IA general",
    vsUs: "BillCheck",
    vsRows: [
      ["Lee tu factura y tu EOB juntos", "Normalmente un documento a la vez", "Empareja cada línea de la factura con una línea del EOB"],
      ["De dónde salen los números", "La mejor suposición del modelo; puede cambiar en cada intento", "8 reglas de facturación fijas y probadas: misma factura, misma respuesta"],
      ["Muestra cómo llegó al resultado", "Rara vez", "Cada problema cita las líneas exactas y la regla"],
      ["Conoce tus derechos", "Solo si haces la pregunta correcta", "Ley No Surprises, facturas detalladas y plazos de apelación incluidos"],
      ["Después de la respuesta", "Te quedas solo", "Carta, guion para llamar, plazos, seguimiento y recordatorios en el calendario"],
      ["Tus documentos", "Guardados en tu historial de chat", "Nombres ocultos, archivos nunca guardados"],
    ],
    pricingTitle: "Precios simples. Sin comisión sobre tus ahorros.",
    plans: {
      free: { name: "Revisión gratis", price: "$0", regular: "", note: "", items: ["Factura vs. EOB, línea por línea", "Cada problema con su nivel de confianza y su fuente", "Cuánto puedes disputar"] },
      single: {
        name: "Arreglar esta factura",
        price: "$20",
        regular: "$25",
        note: "pago único",
        items: ["Carta de disputa para la oficina de facturación", "Solicitud de revisión a tu aseguradora, si hace falta", "Guion para llamar con frases para escalar", "Plazos + seguimiento de la disputa"],
      },
      family: { name: "Plan familiar", price: "$60", regular: "$120", note: "al año", items: ["Todas las facturas de tu hogar", "Todos los paquetes de disputa incluidos", "Seguimiento + recordatorios"] },
    },
    compareTitle: "Cómo se compara BillCheck",
    compareCols: ["Opción", "El inconveniente", "Precio"],
    compareRows: [
      ["Chatbots de IA gratuitos", "Leen un documento, pueden inventar códigos, sin seguimiento", "Gratis"],
      ["Apps que se conectan a tu seguro", "Necesitan el acceso a tu cuenta del seguro", "Gratis–$60/mes"],
      ["Gestores de facturas", "Se quedan con el 10–25% de lo ahorrado, a menudo solo facturas de más de $5,000", "% del ahorro"],
      ["Servicios de revisión por documento", "Revisión humana, más lenta", "~$69–$129"],
    ],
    compareUs: ["BillCheck", "Comparación línea por línea con el EOB, reglas en vez de suposiciones, seguimiento de la disputa. Dos archivos, sin contraseñas.", "$20 por factura"],
    faqTitle: "Preguntas",
    faq: [
      {
        q: "¿Qué es un EOB y dónde lo encuentro?",
        a: "La Explicación de Beneficios (EOB) es el documento que tu aseguradora envía después de procesar un reclamo. Dice “This is not a bill” (esto no es una factura) y muestra cuánto cobró el proveedor, cuánto permitió y pagó tu plan y cuánto debes tú. Está en la app o el sitio web de tu aseguradora, o te llega por correo.",
      },
      {
        q: "¿Por qué no pegar mi factura en ChatGPT?",
        a: "Un chatbot lee un documento y adivina. BillCheck empareja cada línea de la factura con tu EOB, aplica reglas de facturación fijas (siempre las mismas), muestra la fuente de cada hallazgo, nunca inventa códigos y luego da seguimiento a tu disputa con plazos y recordatorios. Es un proceso, no un prompt.",
      },
      {
        q: "¿Qué pasa con mis documentos?",
        a: "Los archivos se procesan en memoria para leer las líneas y nunca se guardan en nuestros servidores. Ocultamos nombres, números de afiliado y números de cuenta. Tus resultados y tu seguimiento se guardan solo en tu navegador. Nunca guardamos tus archivos, así que no hay nada que se pueda filtrar.",
      },
      { q: "¿Tengo que conectar mi seguro o mi cuenta bancaria?", a: "No. Solo necesitamos dos documentos: sin contraseñas ni cuentas conectadas." },
      {
        q: "¿Y si BillCheck se equivoca?",
        a: "Cada hallazgo muestra un nivel de confianza y la línea o regla exacta de donde salió. La carta le pide a la oficina de facturación que explique o corrija; no acusa a nadie. Tú decides qué envías.",
      },
      { q: "¿Esto es asesoría legal o médica?", a: "No. BillCheck no es un bufete de abogados ni un proveedor médico. Te ayudamos a leer tus documentos y a hacer las preguntas correctas." },
      {
        q: "¿En qué idiomas está disponible?",
        a: "El sitio está en inglés, español y francés. Tu carta de disputa y el guion para llamar se quedan en inglés, porque van a una oficina de facturación de EE. UU.",
      },
      {
        q: "No tengo seguro. ¿Me pueden ayudar?",
        a: "Todavía no: sin un EOB no hay con qué comparar. Pronto tendremos ayuda con precios en efectivo y asistencia financiera.",
      },
    ],
    ctaBottom: "Verlo con una factura de ejemplo",
  },
  check: {
    title: "Compara tu factura con tu EOB",
    lede: "Agrega los dos documentos. Leemos cada línea, comparamos la factura con lo que procesó tu aseguradora y te mostramos exactamente qué cuestionar, gratis. Sin registro.",
  },
  uploader: {
    itemizedLink: "¿Solo tienes un resumen? Cómo pedir una factura detallada",
    itemizedIntro: "Envía esto a la oficina de facturación (correo, mensaje en el portal o carta). Está en inglés porque va a una oficina de EE. UU.:",
    itemizedCopy: "Copiar solicitud",
    itemizedCopied: "Copiado ✓",
    sampleLive: "O ejecuta el ejemplo de urgencias en vivo con la IA (~20 s).",
    steps: ["Leyendo tu factura…", "Leyendo tu EOB…", "Emparejando las líneas con tu EOB…", "Aplicando 8 reglas de facturación…", "Sumando lo que puedes disputar…"],
    wait: "Suele tardar entre 20 y 60 segundos. Tus archivos se procesan en memoria y nunca se guardan.",
    billTitle: "1. Tu factura detallada",
    billHint: "Del hospital o del consultorio. Si solo tienes un resumen, pide la versión detallada con códigos.",
    eobTitle: "2. Tu EOB",
    eobHint: "La Explicación de Beneficios de tu aseguradora, normalmente en su app o por correo. Dice “This is not a bill”.",
    planToggle: (open: boolean) => `${open ? "− Ocultar" : "+ Agregar"} datos de tu plan (opcional: hace los montos más precisos)`,
    deductible: "Deducible ($)",
    met: "Cubierto hasta ahora ($)",
    coinsurance: "Coseguro (%)",
    inNetwork: "¿Proveedor dentro de la red?",
    notSure: "No sé",
    yes: "Sí",
    no: "No",
    submit: "Revisar mi factura gratis",
    sampleEr: "Probar ejemplo: factura de urgencias",
    sampleAnesthesia: "Ejemplo: factura sorpresa de anestesia",
    samplesPre: "Los ejemplos son PDF ficticios (",
    samplesEr: "factura de urgencias",
    samplesEob: "su EOB",
    samplesAn: "factura de anestesia",
    samplesPost: ") y pasan por el mismo proceso de IA + reglas que los tuyos.",
    privacy: "🔒 Los archivos se procesan en memoria y nunca se guardan. Ocultamos nombres, números de afiliado y de cuenta. ¿No tienes seguro? Pronto te ayudaremos con precios en efectivo.",
    upload: "Subir PDF / foto",
    paste: "Pegar texto",
    chooseFiles: "Elegir archivos",
    dragHint: "o arrástralos aquí · PDF, JPG, PNG · hasta 3 archivos",
    removeFile: (name: string) => `Quitar ${name}`,
    pasteLabel: "Pega el texto del documento",
    pastePlaceholder: "Copia el texto del PDF o del sitio de tu aseguradora y pégalo aquí…",
    needBill: "Agrega tu factura detallada: un PDF, una foto o texto pegado.",
    needEob: "Agrega tu EOB (Explicación de Beneficios) de tu aseguradora.",
  },
  results: {
    holdTip: "Primer paso: pide a la oficina de facturación que ponga tu cuenta en espera mientras dure la disputa, para que no pase a cobranza.",
    breakdown: (parts: string[], total: string) => `${parts.join(" + ")} = ${total} que puedes disputar`,
    breakdownClaim: (total: string, reason: string) => `${total} que puedes disputar: ${reason}`,
    reasons: {
      DUPLICATE_CHARGE: "cobrado dos veces",
      BILL_EXCEEDS_EOB: "tu factura supera lo que tu EOB dice que debes",
      LINE_NOT_ON_EOB: "no está en tu EOB",
      NO_INSURANCE_APPLIED: "el seguro no se aplicó a la factura",
      BALANCE_BILLING_IN_NETWORK: "el descuento de la red cobrado a ti",
      POSSIBLE_SURPRISE_BILL: "por encima de tu costo compartido dentro de la red",
      NOT_ITEMIZED: "factura sin detalle",
      POSSIBLE_UNBUNDLING: "posiblemente agrupado",
    },
    notFoundTitle: "No encontramos esa revisión",
    notFoundBody: "Los resultados se guardan solo en el navegador donde hiciste la revisión. Si guardaste un enlace privado del caso, ábrelo aquí.",
    overcharged: "Posible cobro de más:",
    nothingClear: "Nada claramente cobrado de más, pero vale la pena preguntar por algunas cosas",
    allGood: "Tu factura coincide con tu EOB 🎉",
    summary: (v: { bill: number; eob: number; issues: number; counted: number }) =>
      `La factura pide ${usd(v.bill)}. El EOB de tu aseguradora dice que debes ${usd(v.eob)}. Encontramos ${v.issues} ${plural(v.issues, "problema", "problemas")}` +
      (v.counted ? `; ${v.counted} ${plural(v.counted, "cuenta", "cuentan")} para el monto disputable (cada dólar se cuenta una vez)` : "") +
      ".",
    found: "Lo que encontramos",
    noIssues: "No encontramos problemas.",
    howWorksPre: "Cómo funciona: la IA solo lee tus documentos. Cada problema y cada monto de arriba salen de reglas de facturación fijas que puedes leer en ",
    howWorksLink: "nuestro código abierto",
    howWorksPost: ".",
    lineByLine: "Línea por línea",
    legend: (acct: string) => `Rojo = confianza alta · Ámbar = media · Azul = vale la pena preguntar. Los nombres e identificaciones están ocultos (${acct}).`,
    confirming: "Confirmando tu pago con Stripe…",
    canceled: "Se canceló el pago; no se te cobró nada.",
    paidFamily: "Pago confirmado: plan familiar activo. 🎉",
    paidSingle: "Pago confirmado: esta factura está desbloqueada. 🎉",
  },
  flag: {
    actionStart: /^(Pide|Pregunta|Llama|Solicita)\b/,
    included: "Ya incluido arriba",
    notAdded: "No se suma al total",
    conf: { high: "Confianza alta", medium: "Confianza media", low: "Vale la pena preguntar" },
    source: (s: string) => `Fuente: ${s}`,
  },
  sbs: {
    chargesListed: "Cargos en la factura",
    paidAdjustments: "Pagos del seguro y ajustes",
    otherBalance: "Otros cargos o saldo anterior",
    short: {
      DUPLICATE_CHARGE: "Duplicado",
      BILL_EXCEEDS_EOB: "Más que el EOB",
      LINE_NOT_ON_EOB: "No está en el EOB",
      NO_INSURANCE_APPLIED: "Sin seguro aplicado",
      BALANCE_BILLING_IN_NETWORK: "Cobro de saldo",
      POSSIBLE_UNBUNDLING: "Preguntar si va agrupado",
      POSSIBLE_SURPRISE_BILL: "¿Factura sorpresa?",
      NOT_ITEMIZED: "Sin detalle",
    },
    yourBill: "Tu factura",
    yourEob: "Tu EOB",
    noLines: "Esta factura no tiene líneas. Pide una factura detallada.",
    noDate: "sin fecha",
    noCode: "sin código",
    noMatch: "No hay una línea igual en tu EOB",
    notOnBill: "No está en tu factura",
    billAsks: "La factura te pide",
    eobSays: "El EOB dice que debes",
    yourResp: "Tu parte",
    billed: "facturado",
    allowed: "permitido",
    network: { in: "dentro de la red", out: "fuera de la red", unknown: "red desconocida" },
  },
  paywall: {
    title: (amount: string | null) => `Obtén tu paquete de disputa${amount ? ` y reclama ${amount}` : ""}`,
    items: [
      "Una carta lista para enviar a la oficina de facturación",
      "Una solicitud de revisión del reclamo a tu aseguradora, si hace falta",
      "Un guion para llamar con lo que debes pedir y frases para escalar",
      "Plazos + seguimiento con un recordatorio a los 30 días",
    ],
    single: "Arreglar esta factura — $20",
    singleSub: "Precio de lanzamiento: $25 → $20 (−20%). Pago único, sin % de tus ahorros.",
    family: "Plan familiar — $60/año",
    familySub: "Precio de lanzamiento: $120 → $60 (−50%). Todas las facturas de tu hogar durante todo el año.",
    opening: "Abriendo el pago…",
    demoStrong: "Modo demo:",
    demoPre: "los pagos funcionan en modo de prueba de Stripe. Usa la tarjeta",
    demoPost: ", cualquier fecha futura, cualquier CVC y cualquier código postal. No se cobra dinero real.",
  },
  pack: {
    sampleUnlocked: "Ejemplo — desbloqueado para la demo",
    sampleNote: "Las facturas reales se desbloquean por $20 (modo de prueba de Stripe en esta demo).",
    unlocked: "✓ Desbloqueado",
    readyTitle: "Tu paquete de disputa está listo para redactarse",
    readyBody: "Escribiremos una carta y un guion para llamar usando solo los problemas encontrados arriba, sin reclamos nuevos.",
    writing: "Escribiendo tu carta… (unos 30 segundos)",
    write: "Escribir mi carta y mi guion",
    englishNote: "La carta y el guion están en inglés porque van a una oficina de facturación de EE. UU.",
    tabs: { letter: "Carta a facturación", insurer: "Solicitud a la aseguradora", script: "Guion para llamar", deadlines: "Plazos" },
    today: "Hoy",
    inDays: (n: number) => `En ${n} ${plural(n, "día", "días")}`,
    detailsTitle: "Tus datos",
    detailsCount: (filled: number, total: number) => `— ${filled} de ${total} completados. Se quedan en este navegador; nunca se envían a nuestro servidor.`,
    hide: "Ocultar",
    fillIn: "Completar",
    hintOnBill: (last4: string | null) => (last4 ? `en tu factura, termina en ${last4}` : "en tu factura"),
    hintOnEob: (last4: string | null) => (last4 ? `en tu EOB, termina en ${last4}` : "en tu EOB"),
    fieldNames: {
      Date: "Fecha",
      "Your name": "Tu nombre",
      "Your address": "Tu dirección",
      Phone: "Teléfono",
      Email: "Correo electrónico",
      "Patient name": "Nombre del paciente",
      "Account number": "Número de cuenta",
      "Claim number": "Número de reclamo",
      "Provider billing address": "Dirección de facturación del proveedor",
      "Insurer address": "Dirección de la aseguradora",
      "Member ID": "Número de afiliado",
    },
    copy: "Copiar",
    copied: "Copiado ✓",
    download: "Descargar .txt",
    print: "Imprimir / Guardar como PDF",
    footer: (allFilled: boolean) => `${allFilled ? "Envíala y " : "Completa tus datos arriba, envíala y "}da seguimiento a la disputa hasta resolverla.`,
    sent: "Envié la carta → darle seguimiento",
    openTracker: "Abrir seguimiento",
    script: { opening: "Para empezar", asks: "Pide", pushBack: "Si se niegan", escalation: "Para escalar", writeDown: "Anota" },
    failed: "No pudimos escribir la carta.",
  },
  deadlines: {
    callBilling: {
      title: "Llama a la oficina de facturación",
      detail: "Pide que pongan la cuenta en espera mientras dure la revisión, para que no pase a cobranza.",
    },
    sendLetter: { title: "Envía la carta de disputa por correo o en línea", detail: "Guarda una copia y anota la fecha de envío." },
    followUp: { title: "Haz seguimiento si no te han respondido", detail: "Vuelve a llamar y menciona tu primera llamada y tu carta." },
    dueDate: { title: (date: string) => `Fecha de vencimiento en el estado de cuenta: ${formatDate(date, "es")}`, detail: "Pide que extiendan la fecha mientras revisan la factura." },
    appeal: {
      title: "Plazo para apelar ante la aseguradora",
      detail: "En la mayoría de los planes de empleador puedes presentar una apelación interna dentro de los 180 días posteriores al EOB o al aviso de rechazo.",
    },
    nsa: { title: "Ayuda de la Ley No Surprises", detail: "Preguntas o quejas: cms.gov/nosurprises o 1-800-985-3059." },
  },
  tracker: {
    sampleBadge: "Ejemplo",
    loadSample: "Cargar una disputa de ejemplo",
    title: "Mis disputas",
    lede: "Las disputas de facturación suelen tomar varias llamadas durante semanas. Guarda cada llamada, número de referencia y fecha de seguimiento en un solo lugar.",
    saved: "Has ahorrado",
    open: "Disputas abiertas",
    inDispute: "En disputa",
    export: "Descargar copia de seguridad",
    import: "Restaurar copia de seguridad",
    storageNote: "Tu seguimiento vive solo en este navegador. Usa un enlace privado del caso para abrirlo en otro lugar, o exporta todo como respaldo.",
    imported: (n: number) => `Se ${plural(n, "importó", "importaron")} ${n} ${plural(n, "disputa", "disputas")}.`,
    badImport: "Ese archivo no es una exportación de BillCheck.",
    empty: "Aún no hay disputas. Revisa una factura y desbloquea el paquete de disputa para empezar a darle seguimiento.",
    status: { "Not started": "Sin empezar", "Letter sent": "Carta enviada", Called: "Llamé", Waiting: "En espera", Resolved: "Resuelta" },
    statusLabel: "Estado",
    meta: (v: { bill: string; disputing: string; started: string }) => `Factura ${v.bill} · disputando ${v.disputing} · iniciada el ${v.started}`,
    openResults: "Ver resultados",
    remove: "Quitar",
    removeAria: (provider: string) => `Quitar ${provider}`,
    removeConfirm: "¿Quitar esta disputa de tu seguimiento?",
    otherDevice: "Abre este caso en otro dispositivo:",
    followUp: "Fecha de seguimiento",
    addCalendar: "📅 Agregar recordatorio al calendario",
    amountSaved: "Monto ahorrado ($)",
    markResolved: "Márcala como Resuelta para registrar lo que ahorraste.",
    callLog: "Registro de llamadas",
    logCall: "+ Registrar una llamada",
    cancel: "Cancelar",
    callDate: "Fecha de la llamada",
    who: "Con quién hablaste",
    ref: "N.º de referencia",
    refAria: "Número de referencia",
    saveCall: "Guardar llamada",
    notes: "Qué te dijeron o prometieron",
    notesAria: "Notas",
    noCalls: "Aún no hay llamadas. Anota siempre el nombre de quien te atendió y un número de referencia.",
    unknownRep: "Representante desconocido",
    refShort: "ref.",
    icsTitle: (provider: string) => `Seguimiento: disputa de la factura de ${provider}`,
    icsBody: (v: { provider: string; amount: string; sent: string | null }) =>
      `Llama a facturación de ${v.provider}. Disputando ${v.amount}. Menciona tu carta${v.sent ? ` enviada el ${v.sent}` : ""} y las llamadas anteriores. — BillCheck`,
  },
  caseLink: {
    title: "Guarda tu caso, sin crear una cuenta",
    body: "Tu caso vive en este navegador. Un enlace privado lo abre en cualquier dispositivo. Los datos del caso van dentro del enlace, nunca en nuestro servidor.",
    copy: "Copiar enlace privado",
    copied: "Enlace copiado ✓",
    email: "Enviármelo por correo",
    error: "No se pudo crear el enlace en este navegador.",
    mailSubject: (provider: string) => `Mi caso de BillCheck: ${provider}`,
    mailBody: (url: string) =>
      `Abre mi caso de BillCheck (resultados, carta y seguimiento) en cualquier dispositivo:\n\n${url}\n\nMantén este enlace en privado: cualquiera que lo tenga puede ver este caso. BillCheck no lo guarda.`,
  },
  open: {
    opening: "Abriendo tu caso…",
    failTitle: "No pudimos abrir ese caso",
    damaged: "Este enlace está incompleto o dañado. Intenta copiarlo de nuevo.",
    notCase: "Este enlace no es un enlace de caso de BillCheck.",
  },
  errors: {
    notBill: (v: Vars) =>
      "Esto no parece una factura médica detallada. Asegúrate de que incluya servicios, fechas y cargos." +
      (v.photo ? " Si es una foto, prueba con una más clara o pega el texto." : ""),
    notEob: (v: Vars) =>
      "Esto no parece un EOB. Normalmente dice “This is not a bill” en la parte de arriba." + (v.photo ? " Si es una foto, prueba con una más clara o pega el texto." : ""),
    notBoth: () =>
      "Ninguno de los dos documentos parece correcto. La factura debe incluir servicios, fechas y cargos; el EOB suele decir “This is not a bill” arriba.",
    generic: "Algo salió mal. Inténtalo de nuevo.",
    invalidRequest: "Solicitud no válida.",
    tooManyFiles: (v: Vars) => `Sube como máximo ${v.max} archivos para ${v.doc === "bill" ? "la factura" : "el EOB"}.`,
    unsupportedFile: (v: Vars) => `“${v.name}” no es un tipo de archivo compatible. Usa PDF, JPG o PNG.`,
    missingBill: "Agrega tu factura detallada (un archivo o texto pegado).",
    missingEob: "Agrega el EOB de tu aseguradora (un archivo o texto pegado).",
    tooLarge: "Los archivos juntos son demasiado grandes (máximo unos 4 MB). Prueba con menos páginas o fotos más pequeñas.",
    rateLimited: (v: Vars) => `Has hecho muchas revisiones en la última hora. Inténtalo de nuevo en ${v.minutes} minutos.`,
    rateLimitedLetter: "Demasiadas cartas en la última hora. Inténtalo más tarde.",
    notPaid: "Este pago aún no se ha completado.",
    unlockFirst: "Primero desbloquea esta factura.",
    aiBusy: "El servicio de IA está ocupado. Inténtalo de nuevo en un minuto.",
    readFailed: "No se pudo leer el documento. Inténtalo de nuevo o pega el texto.",
    letterFailed: "Esta vez no pudimos escribir la carta. Inténtalo de nuevo.",
    checkoutFailed: "No pudimos iniciar el pago. Inténtalo de nuevo.",
    verifyFailed: "No pudimos verificar el pago. Actualiza la página.",
    notConfigured: "",
  },
  rules: {
    DUPLICATE_CHARGE: {
      title: (p: Vars) => `Cobrado dos veces: ${p.desc}`,
      explanation: (p: Vars) => {
        const basis: Record<string, string> = {
          billed: "el monto facturado completo (no encontramos las cifras de la aseguradora)",
          deductible: "el monto permitido por la aseguradora, porque se aplica tu deducible",
          coinsurance: `tu coseguro del ${p.pct}%`,
          eobShare: "tu parte en el EOB por el mismo servicio",
        };
        return (
          `Este servicio aparece ${p.onEob ? "más veces en la factura que en tu EOB" : "dos veces en la factura"}` +
          `${p.date ? ` el ${formatDate(String(p.date), "es")}` : ""}. La aseguradora lo procesó una sola vez, así que la línea extra ` +
          `probablemente no debería estar en tu factura. El monto se basa en ${basis[String(p.basis)] ?? basis.billed}.`
        );
      },
      source: (p: Vars) => (p.eobLine ? `línea ${p.eobLine} del EOB (procesada una vez)` : "Regla: cargo duplicado"),
    },
    BILL_EXCEEDS_EOB: {
      title: () => "Tu factura es mayor de lo que tu EOB dice que debes",
      explanation: (p: Vars) =>
        `La factura pide ${usd(p.balance)}, pero el EOB de tu aseguradora indica que tu parte es ${usd(p.eobTotal)}. ` +
        (p.allOut
          ? "Los proveedores fuera de la red a veces pueden cobrar la diferencia, pero no por atención de emergencia ni por anestesia, radiología, " +
            "laboratorio o cirujanos asistentes en un centro dentro de la red (Ley No Surprises). Pide a la oficina de facturación que explique o corrija la diferencia."
          : "En un reclamo dentro de la red, por lo general no deberías pagar más que el monto del EOB. Pide a la oficina de facturación que explique o corrija la diferencia."),
      source: () => "total del EOB vs. saldo de la factura",
    },
    LINE_NOT_ON_EOB: {
      title: (p: Vars) => `No está en tu EOB: ${p.desc}`,
      explanation: () =>
        "No encontramos este cargo en el EOB de tu aseguradora. Puede que nunca se haya enviado al seguro o que se haya facturado aparte. " +
        "Pide al proveedor que lo envíe a tu aseguradora (o que lo elimine) antes de pagar.",
      source: () => "Regla: ninguna línea igual en el EOB",
    },
    NO_INSURANCE_APPLIED: {
      title: () => "No se ha aplicado el seguro a esta factura",
      explanation: () =>
        "La factura muestra $0 pagados o ajustados por el seguro, pero tu EOB muestra que el reclamo ya se procesó. Puede que el proveedor te haya cobrado " +
        "antes de registrar el pago y el descuento de la aseguradora. Pídele que aplique el EOB y te envíe una factura corregida.",
      source: () => "Factura: seguro pagado/ajustado = $0",
    },
    BALANCE_BILLING_IN_NETWORK: {
      title: () => "Te están cobrando el descuento de la red",
      explanation: (p: Vars) =>
        `Los ${usd(p.gap)} de más coinciden con el “monto no permitido” de tu EOB. Los proveedores dentro de la red aceptan cobrar el monto permitido, ` +
        "así que normalmente no pueden cobrarte esta diferencia.",
      source: (p: Vars) => `líneas ${p.lines} del EOB (facturado − permitido)`,
    },
    POSSIBLE_SURPRISE_BILL: {
      title: (p: Vars) => `Posible factura sorpresa: ${p.emergency ? "atención de emergencia" : kind(p.kind)} fuera de la red`,
      explanation: (p: Vars) =>
        (p.facilityKnown
          ? `Tu EOB marca esto como ${p.emergency ? "atención de emergencia fuera de la red" : `${kind(p.kind)} fuera de la red en un centro dentro de la red`}. Según la ley federal No Surprises, puede que solo debas lo que pagarías dentro de la red. `
          : `Tu EOB marca este servicio de ${kind(p.kind)} como fuera de la red. Si se prestó en un hospital o centro quirúrgico dentro de la red, la ley federal ` +
            "No Surprises dice que solo debes tu costo compartido dentro de la red y el proveedor no puede cobrarte el resto. ") +
        "Más información en cms.gov/nosurprises." +
        (p.estimated ? "" : " No conocemos tu costo compartido dentro de la red, así que mostramos el monto completo."),
      source: (p: Vars) => `línea ${p.eobLine} del EOB (fuera de la red)`,
    },
    NOT_ITEMIZED: {
      title: () => "Esta factura no está detallada",
      explanation: () =>
        "La factura solo muestra totales. Tienes derecho a pedir una factura detallada con códigos CPT/HCPCS para cada servicio: " +
        "es la única forma de revisarla línea por línea. Pídela antes de pagar.",
      source: () => "Regla: se necesita una factura detallada",
    },
    POSSIBLE_UNBUNDLING: {
      title: (p: Vars) => `Vale la pena preguntar: ${p.part}`,
      explanation: (p: Vars) => {
        const notes: Record<string, string> = {
          bmp: "un panel metabólico básico forma parte del panel completo",
          panelTests: "pruebas sueltas que ya están incluidas en el panel metabólico",
          cbc: "componentes de un hemograma completo con diferencial",
          ecg: "partes de un electrocardiograma completo",
          supplies: "suministros que normalmente están incluidos en la consulta o en la tarifa del centro",
          officeEr: "una segunda consulta facturada el mismo día que una visita a urgencias",
        };
        return `Esto se facturó por separado junto a “${p.whole}”. Suelen facturarse como un solo servicio (${notes[String(p.pair)] ?? ""}). Pregunta a la oficina de facturación si debería ir agrupado.`;
      },
      source: (p: Vars) => `Regla: códigos que suelen ir juntos ${p.partCode} + ${p.wholeCode}`,
    },
  },
};

import { formatDate } from "../dates";
import { formatUsd } from "../money";
import type { Messages, Vars } from "./en";

const usd = (n: unknown) => formatUsd(Number(n) || 0);
const plural = (n: number, one: string, many: string) => (n <= 1 ? one : many);
const KIND: Record<string, string> = {
  anesthesia: "anesthésie",
  "assistant surgeon": "chirurgien assistant",
  radiology: "radiologie",
  "pathology/lab": "pathologie/laboratoire",
};
const kind = (k: unknown) => KIND[String(k)] ?? String(k ?? "");

/** French. Formal “vous”. Amounts stay in US dollars, written the US way, as on the documents. */
export const fr: Messages = {
  langName: "Français",
  common: {
    language: "Langue",
    loading: "Chargement…",
    checkABill: "Vérifier une facture",
    myDisputes: "Mes contestations",
  },
  footer: {
    github: "Code source sur GitHub",
    disclaimerStrong: "BillCheck n’est ni un cabinet d’avocats ni un prestataire de soins. Ce n’est pas un conseil juridique ou médical.",
    disclaimerRest: "Nous vous aidons à lire vos documents et à poser les bonnes questions.",
    knowRights: "Vos droits :",
    cmsRights: "CMS — droits sur les factures médicales",
    nsa: "Loi No Surprises",
    project: "Projet Business Cup 2.0. Les documents d’exemple sont fictifs.",
  },
  landing: {
    ctaFree: "Vérifier ma facture gratuitement",
    ctaFamily: "Commencer par une vérification gratuite",
    vsChatShort: "Chatbot",
    badge: "Pour les adultes assurés qui ont une facture médicale incompréhensible",
    h1: "Votre facture médicale est peut-être fausse. Comparez-la à votre EOB en 2 minutes.",
    lede: "Envoyez votre facture et le relevé de prestations (EOB) de votre assureur. BillCheck compare chaque ligne, vous montre ce que vous pouvez contester et vous donne une lettre prête à envoyer, un script d’appel et les délais.",
    ctaCheck: "Vérifier ma facture",
    ctaSample: "Essayer avec une facture d’exemple",
    orTry: "Ou essayez une",
    anesthesiaLink: "facture surprise d’anesthésie",
    anesthesiaNote: "(cas de la loi No Surprises).",
    trust: "Vérification gratuite · Sans inscription · Sans accès à votre assurance ni à votre banque · Fichiers jamais conservés",
    stats: [
      { n: "43 %", t: "des adultes aux États-Unis disent avoir reçu une facture médicale ou dentaire qui, selon eux, contenait une erreur.", s: "Enquête KFF sur les dettes médicales" },
      { n: "45 %", t: "des adultes assurés en âge de travailler ont reçu une facture pour un soin qu’ils pensaient couvert par l’assurance.", s: "Commonwealth Fund, 2024" },
      { n: "38 %", t: "de ceux qui ont contesté une erreur ont obtenu une réduction ou l’annulation de la facture.", s: "Commonwealth Fund, 2024" },
    ],
    deductibleNote:
      "L’assurance n’empêche pas les factures : la franchise moyenne d’une couverture d’employeur est de $1,886, et 34 % des salariés couverts ont une franchise de $2,000 ou plus (KFF 2025). Tant qu’elle n’est pas atteinte, vous payez presque tout : une facture gonflée gonfle votre part.",
    howTitle: "Comment ça marche",
    steps: [
      ["Envoyez deux documents", "Votre facture détaillée et votre EOB : PDF, photo ou texte collé. Les noms et identifiants sont masqués."],
      [
        "Voyez ce qui ne correspond pas",
        "Nous associons chaque ligne de la facture à votre EOB et appliquons 8 règles de facturation : doublons, frais jamais vus par l’assurance, factures supérieures à l’EOB, factures surprises hors réseau, etc.",
      ],
      ["Contestez, étape par étape", "Recevez une lettre, un script d’appel et les délais. Suivez chaque appel jusqu’à la résolution."],
    ],
    aiTitle: "L’IA lit. Les règles décident.",
    aiBody:
      "L’IA ne fait que transcrire vos documents en données. Chaque problème et chaque montant proviennent de règles de facturation fixes et testées : la même facture donne toujours la même réponse, et chaque constat indique exactement d’où il vient.",
    vsTitle: "Pourquoi ne pas simplement demander à ChatGPT ?",
    vsLede: "Un chatbot peut expliquer un code CPT. Récupérer son argent demande une vérification croisée, une trace écrite et un suivi.",
    vsChat: "Chatbot d’IA généraliste",
    vsUs: "BillCheck",
    vsRows: [
      ["Lit votre facture et votre EOB ensemble", "Un document à la fois, en général", "Associe chaque ligne de la facture à une ligne de l’EOB"],
      ["D’où viennent les montants", "La meilleure supposition du modèle, qui peut changer", "8 règles fixes et testées : même facture, même réponse"],
      ["Montre son raisonnement", "Rarement", "Chaque problème cite les lignes exactes et la règle"],
      ["Connaît vos droits", "Seulement si vous posez la bonne question", "Loi No Surprises, factures détaillées, délais d’appel intégrés"],
      ["Après la réponse", "Vous êtes seul", "Lettre, script d’appel, délais, suivi et rappels dans l’agenda"],
      ["Vos documents", "Conservés dans l’historique du chat", "Noms masqués, fichiers jamais conservés"],
    ],
    pricingTitle: "Des prix simples. Aucun pourcentage sur vos économies.",
    plans: {
      free: { name: "Vérification gratuite", price: "$0", note: "", items: ["Facture vs EOB, ligne par ligne", "Chaque problème avec son niveau de confiance et sa source", "Le montant que vous pouvez contester"] },
      single: {
        name: "Régler cette facture",
        price: "$19",
        note: "paiement unique",
        items: ["Lettre de contestation au service de facturation", "Demande de révision à l’assureur si nécessaire", "Script d’appel avec phrases d’escalade", "Délais + suivi de la contestation"],
      },
      family: { name: "Forfait famille", price: "$59", note: "par an", items: ["Toutes les factures du foyer", "Tous les dossiers de contestation inclus", "Suivi + rappels"] },
    },
    compareTitle: "BillCheck face aux alternatives",
    compareCols: ["Option", "Le hic", "Prix"],
    compareRows: [
      ["Chatbots d’IA gratuits", "Lisent un document, peuvent inventer des codes, aucun suivi", "Gratuit"],
      ["Applis reliées à votre assurance", "Exigent vos identifiants d’assurance", "Gratuit–$60/mois"],
      ["Négociateurs de factures", "Prennent 10–25 % des économies, souvent seulement au-delà de $5,000", "% des économies"],
      ["Services de révision par document", "Révision humaine, plus lente", "~$69–$129"],
    ],
    compareUs: ["BillCheck", "Comparaison ligne par ligne avec l’EOB, des règles plutôt que des suppositions, suivi de la contestation. Deux fichiers, aucun identifiant.", "$19 par facture"],
    faqTitle: "Questions",
    faq: [
      {
        q: "Qu’est-ce qu’un EOB et où le trouver ?",
        a: "L’Explanation of Benefits (EOB, relevé de prestations) est le document que votre assureur envoie après avoir traité une demande. Il porte la mention « This is not a bill » (ceci n’est pas une facture) et indique ce que le prestataire a facturé, ce que votre contrat a accepté et payé, et ce que vous devez. Il se trouve dans l’appli ou sur le site de votre assureur, ou arrive par courrier.",
      },
      {
        q: "Pourquoi ne pas coller ma facture dans ChatGPT ?",
        a: "Un chatbot lit un document et devine. BillCheck associe chaque ligne de la facture à votre EOB, applique des règles de facturation fixes (toujours les mêmes), indique la source de chaque constat, n’invente jamais de codes, puis suit votre contestation avec délais et relances. C’est un processus, pas un prompt.",
      },
      {
        q: "Que deviennent mes documents ?",
        a: "Les fichiers sont traités en mémoire pour lire les lignes et ne sont jamais conservés sur nos serveurs. Nous masquons les noms, numéros d’adhérent et numéros de compte. Vos résultats et votre suivi sont enregistrés uniquement dans votre navigateur. Nous ne conservons jamais vos fichiers : il n’y a donc rien à divulguer.",
      },
      { q: "Dois-je connecter mon assurance ou mon compte bancaire ?", a: "Non. Deux documents suffisent : aucun identifiant, aucun compte à relier." },
      {
        q: "Et si BillCheck se trompe ?",
        a: "Chaque constat indique un niveau de confiance et la ligne ou la règle exacte dont il provient. La lettre demande au service de facturation d’expliquer ou de corriger ; elle n’accuse personne. Vous gardez la main sur ce que vous envoyez.",
      },
      { q: "Est-ce un conseil juridique ou médical ?", a: "Non. BillCheck n’est ni un cabinet d’avocats ni un prestataire de soins. Nous vous aidons à lire vos documents et à poser les bonnes questions." },
      {
        q: "Quelles langues proposez-vous ?",
        a: "Le site est disponible en anglais, en espagnol et en français. Votre lettre de contestation et votre script d’appel restent en anglais, car ils s’adressent à un service de facturation américain.",
      },
      {
        q: "Je n’ai pas d’assurance. Pouvez-vous m’aider ?",
        a: "Pas encore : sans EOB, il n’y a rien à comparer. L’aide sur les prix au comptant et l’assistance financière arrive bientôt.",
      },
    ],
    ctaBottom: "Voir sur une facture d’exemple",
  },
  check: {
    title: "Comparez votre facture à votre EOB",
    lede: "Ajoutez les deux documents. Nous lisons chaque ligne, comparons la facture à ce que votre assureur a traité et vous montrons exactement quoi contester, gratuitement. Sans inscription.",
  },
  uploader: {
    sampleLive: "Ou lancez l’exemple des urgences en direct avec l’IA (~20 s).",
    steps: ["Lecture de votre facture…", "Lecture de votre EOB…", "Association des lignes avec votre EOB…", "Application des 8 règles de facturation…", "Calcul du montant contestable…"],
    wait: "Cela prend généralement 20 à 60 secondes. Vos fichiers sont traités en mémoire et jamais conservés.",
    billTitle: "1. Votre facture détaillée",
    billHint: "De l’hôpital ou du cabinet médical. Si vous n’avez qu’un résumé, demandez la version détaillée avec les codes.",
    eobTitle: "2. Votre EOB",
    eobHint: "Le relevé de prestations de votre assureur, en général dans son appli ou envoyé par courrier. Il porte la mention « This is not a bill ».",
    planToggle: (open: boolean) => `${open ? "− Masquer" : "+ Ajouter"} les détails de votre contrat (facultatif : rend les montants plus précis)`,
    deductible: "Franchise ($)",
    met: "Déjà atteinte ($)",
    coinsurance: "Coassurance (%)",
    inNetwork: "Prestataire dans le réseau ?",
    notSure: "Je ne sais pas",
    yes: "Oui",
    no: "Non",
    submit: "Vérifier ma facture gratuitement",
    sampleEr: "Essayer un exemple : facture des urgences",
    sampleAnesthesia: "Exemple : facture surprise d’anesthésie",
    samplesPre: "Les exemples sont des PDF fictifs (",
    samplesEr: "facture des urgences",
    samplesEob: "son EOB",
    samplesAn: "facture d’anesthésie",
    samplesPost: ") et passent par le même traitement IA + règles que les vôtres.",
    privacy: "🔒 Les fichiers sont traités en mémoire et jamais conservés. Nous masquons les noms, numéros d’adhérent et de compte. Pas d’assurance ? L’aide sur les prix au comptant arrive bientôt.",
    upload: "Envoyer un PDF / une photo",
    paste: "Coller du texte",
    chooseFiles: "Choisir des fichiers",
    dragHint: "ou glissez-les ici · PDF, JPG, PNG · jusqu’à 3 fichiers",
    removeFile: (name: string) => `Retirer ${name}`,
    pasteLabel: "Collez le texte du document",
    pastePlaceholder: "Copiez le texte du PDF ou du site de votre assureur et collez-le ici…",
    needBill: "Ajoutez votre facture détaillée : un PDF, une photo ou du texte collé.",
    needEob: "Ajoutez l’EOB (relevé de prestations) de votre assureur.",
  },
  results: {
    holdTip: "Première étape : demandez au service de facturation de suspendre votre compte pendant la contestation, pour qu’il ne soit pas transmis au recouvrement.",
    breakdown: (parts: string[], total: string) => `${parts.join(" + ")} = ${total} contestables`,
    breakdownClaim: (total: string, reason: string) => `${total} contestables : ${reason}`,
    reasons: {
      DUPLICATE_CHARGE: "facturé deux fois",
      BILL_EXCEEDS_EOB: "votre facture dépasse ce que votre EOB indique",
      LINE_NOT_ON_EOB: "absent de votre EOB",
      NO_INSURANCE_APPLIED: "assurance non appliquée à la facture",
      BALANCE_BILLING_IN_NETWORK: "la remise du réseau qu’on vous facture",
      POSSIBLE_SURPRISE_BILL: "au-delà de votre part dans le réseau",
      NOT_ITEMIZED: "facture non détaillée",
      POSSIBLE_UNBUNDLING: "peut-être regroupé",
    },
    notFoundTitle: "Nous n’avons pas trouvé cette vérification",
    notFoundBody: "Les résultats sont enregistrés uniquement dans le navigateur où vous avez fait la vérification. Si vous avez gardé un lien privé du dossier, ouvrez-le ici.",
    overcharged: "On vous facture peut-être trop :",
    nothingClear: "Rien de clairement surfacturé, mais certains points méritent une question",
    allGood: "Votre facture correspond à votre EOB 🎉",
    summary: (v: { bill: number; eob: number; issues: number; counted: number }) =>
      `La facture demande ${usd(v.bill)}. L’EOB de votre assureur indique que vous devez ${usd(v.eob)}. Nous avons trouvé ${v.issues} ${plural(v.issues, "problème", "problèmes")}` +
      (v.counted ? ` ; ${v.counted} ${plural(v.counted, "compte", "comptent")} dans le montant contestable (chaque dollar compté une seule fois)` : "") +
      ".",
    found: "Ce que nous avons trouvé",
    noIssues: "Aucun problème trouvé.",
    howWorksPre: "Comment ça marche : l’IA ne fait que lire vos documents. Chaque problème et chaque montant ci-dessus proviennent de règles de facturation fixes, consultables dans ",
    howWorksLink: "notre code open source",
    howWorksPost: ".",
    lineByLine: "Ligne par ligne",
    legend: (acct: string) => `Rouge = confiance élevée · Orange = moyenne · Bleu = à demander. Les noms et identifiants sont masqués (${acct}).`,
    confirming: "Confirmation de votre paiement auprès de Stripe…",
    canceled: "Le paiement a été annulé : vous n’avez pas été débité.",
    paidFamily: "Paiement confirmé : forfait famille actif. 🎉",
    paidSingle: "Paiement confirmé : cette facture est débloquée. 🎉",
  },
  flag: {
    included: "Déjà compris ci-dessus",
    notAdded: "Non ajouté au total",
    conf: { high: "Confiance élevée", medium: "Confiance moyenne", low: "À demander" },
    source: (s: string) => `Source : ${s}`,
  },
  sbs: {
    chargesListed: "Frais indiqués sur la facture",
    paidAdjustments: "Paiements de l’assurance et ajustements",
    otherBalance: "Autres frais ou solde antérieur",
    short: {
      DUPLICATE_CHARGE: "Doublon",
      BILL_EXCEEDS_EOB: "Au-dessus de l’EOB",
      LINE_NOT_ON_EOB: "Absent de l’EOB",
      NO_INSURANCE_APPLIED: "Assurance non appliquée",
      BALANCE_BILLING_IN_NETWORK: "Facturation du solde",
      POSSIBLE_SURPRISE_BILL: "Facture surprise ?",
      NOT_ITEMIZED: "Non détaillée",
      POSSIBLE_UNBUNDLING: "Regroupement à vérifier",
    },
    yourBill: "Votre facture",
    yourEob: "Votre EOB",
    noLines: "Cette facture ne comporte aucune ligne. Demandez une facture détaillée.",
    noDate: "sans date",
    noCode: "sans code",
    noMatch: "Aucune ligne correspondante sur votre EOB",
    notOnBill: "Absent de votre facture",
    billAsks: "La facture vous demande",
    eobSays: "L’EOB indique que vous devez",
    yourResp: "Votre part",
    billed: "facturé",
    allowed: "accepté",
    network: { in: "dans le réseau", out: "hors réseau", unknown: "réseau inconnu" },
  },
  paywall: {
    title: (amount: string | null) => `Obtenez votre dossier de contestation${amount ? ` et récupérez ${amount}` : ""}`,
    items: [
      "Une lettre prête à envoyer au service de facturation",
      "Une demande de révision à votre assureur si nécessaire",
      "Un script d’appel avec les demandes exactes et les phrases d’escalade",
      "Les délais + un suivi avec rappel à 30 jours",
    ],
    single: "Régler cette facture — $19",
    singleSub: "Paiement unique. Aucun % de vos économies.",
    family: "Forfait famille — $59/an",
    familySub: "Toutes les factures du foyer, toute l’année.",
    opening: "Ouverture du paiement…",
    demoStrong: "Mode démo :",
    demoPre: "les paiements fonctionnent en mode test de Stripe. Utilisez la carte",
    demoPost: ", n’importe quelle date future, n’importe quel CVC et n’importe quel code postal. Aucun argent réel n’est débité.",
  },
  pack: {
    sampleUnlocked: "Exemple — débloqué pour la démo",
    sampleNote: "Les vraies factures se débloquent pour $19 (mode test de Stripe dans cette démo).",
    unlocked: "✓ Débloqué",
    readyTitle: "Votre dossier de contestation est prêt à être rédigé",
    readyBody: "Nous rédigeons une lettre et un script d’appel à partir des seuls problèmes trouvés ci-dessus, sans nouvelle réclamation.",
    writing: "Rédaction de votre lettre… (environ 30 secondes)",
    write: "Rédiger ma lettre et mon script",
    englishNote: "La lettre et le script sont en anglais, car ils s’adressent à un service de facturation américain.",
    tabs: { letter: "Lettre à la facturation", insurer: "Demande à l’assureur", script: "Script d’appel", deadlines: "Délais" },
    today: "Aujourd’hui",
    inDays: (n: number) => `Dans ${n} ${plural(n, "jour", "jours")}`,
    detailsTitle: "Vos coordonnées",
    detailsCount: (filled: number, total: number) => `— ${filled} sur ${total} remplies. Elles restent dans ce navigateur et ne sont jamais envoyées à notre serveur.`,
    hide: "Masquer",
    fillIn: "Remplir",
    hintOnBill: (last4: string | null) => (last4 ? `sur votre facture, se termine par ${last4}` : "sur votre facture"),
    hintOnEob: (last4: string | null) => (last4 ? `sur votre EOB, se termine par ${last4}` : "sur votre EOB"),
    fieldNames: {
      Date: "Date",
      "Your name": "Votre nom",
      "Your address": "Votre adresse",
      Phone: "Téléphone",
      Email: "E-mail",
      "Patient name": "Nom du patient",
      "Account number": "Numéro de compte",
      "Claim number": "Numéro de demande",
      "Provider billing address": "Adresse de facturation du prestataire",
      "Insurer address": "Adresse de l’assureur",
      "Member ID": "Numéro d’adhérent",
    },
    copy: "Copier",
    copied: "Copié ✓",
    download: "Télécharger le .txt",
    print: "Imprimer / Enregistrer en PDF",
    footer: (allFilled: boolean) => `${allFilled ? "Envoyez-la, " : "Remplissez vos coordonnées ci-dessus, envoyez-la, "}puis suivez la contestation jusqu’à sa résolution.`,
    sent: "J’ai envoyé la lettre → la suivre",
    openTracker: "Ouvrir le suivi",
    script: { opening: "Pour commencer", asks: "Demandez", pushBack: "S’ils refusent", escalation: "Pour escalader", writeDown: "Notez" },
    failed: "Impossible de rédiger la lettre.",
  },
  deadlines: {
    callBilling: {
      title: "Appelez le service de facturation",
      detail: "Demandez la suspension du compte pendant la révision, pour qu’il ne soit pas transmis au recouvrement.",
    },
    sendLetter: { title: "Envoyez la lettre de contestation par courrier ou en ligne", detail: "Gardez une copie et notez la date d’envoi." },
    followUp: { title: "Relancez si vous n’avez pas de réponse", detail: "Rappelez en mentionnant votre premier appel et votre lettre." },
    dueDate: { title: (date: string) => `Date d’échéance sur le relevé : ${formatDate(date, "fr")}`, detail: "Demandez un report de l’échéance pendant la révision de la facture." },
    appeal: {
      title: "Délai d’appel auprès de l’assureur",
      detail: "Pour la plupart des contrats d’employeur, vous pouvez déposer un appel interne dans les 180 jours suivant l’EOB ou l’avis de refus.",
    },
    nsa: { title: "Aide de la loi No Surprises", detail: "Questions ou plaintes : cms.gov/nosurprises ou 1-800-985-3059." },
  },
  tracker: {
    sampleBadge: "Exemple",
    loadSample: "Charger une contestation d’exemple",
    title: "Mes contestations",
    lede: "Une contestation de facture demande souvent plusieurs appels sur quelques semaines. Gardez chaque appel, numéro de référence et date de relance au même endroit.",
    saved: "Vous avez économisé",
    open: "Contestations ouvertes",
    inDispute: "En contestation",
    export: "Télécharger une sauvegarde",
    import: "Restaurer une sauvegarde",
    storageNote: "Votre suivi est enregistré uniquement dans ce navigateur. Utilisez un lien privé pour ouvrir un dossier ailleurs, ou exportez tout en sauvegarde.",
    imported: (n: number) => `${n} ${plural(n, "contestation importée", "contestations importées")}.`,
    badImport: "Ce fichier n’est pas un export BillCheck.",
    empty: "Aucune contestation pour l’instant. Vérifiez une facture et débloquez le dossier pour commencer le suivi.",
    status: { "Not started": "Pas commencée", "Letter sent": "Lettre envoyée", Called: "Appel passé", Waiting: "En attente", Resolved: "Résolue" },
    statusLabel: "Statut",
    meta: (v: { bill: string; disputing: string; started: string }) => `Facture ${v.bill} · conteste ${v.disputing} · commencée le ${v.started}`,
    openResults: "Voir les résultats",
    remove: "Supprimer",
    removeAria: (provider: string) => `Supprimer ${provider}`,
    removeConfirm: "Supprimer cette contestation de votre suivi ?",
    otherDevice: "Ouvrir ce dossier sur un autre appareil :",
    followUp: "Date de relance",
    addCalendar: "📅 Ajouter un rappel à l’agenda",
    amountSaved: "Montant économisé ($)",
    markResolved: "Marquez-la comme Résolue pour noter vos économies.",
    callLog: "Journal des appels",
    logCall: "+ Noter un appel",
    cancel: "Annuler",
    callDate: "Date de l’appel",
    who: "Votre interlocuteur",
    ref: "N° de référence",
    refAria: "Numéro de référence",
    saveCall: "Enregistrer l’appel",
    notes: "Ce qu’on vous a dit ou promis",
    notesAria: "Notes",
    noCalls: "Aucun appel noté. Notez toujours le nom de votre interlocuteur et un numéro de référence.",
    unknownRep: "Interlocuteur inconnu",
    refShort: "réf.",
    icsTitle: (provider: string) => `Relance : contestation de la facture ${provider}`,
    icsBody: (v: { provider: string; amount: string; sent: string | null }) =>
      `Appeler le service de facturation de ${v.provider}. Montant contesté : ${v.amount}. Mentionner votre lettre${v.sent ? ` envoyée le ${v.sent}` : ""} et les appels précédents. — BillCheck`,
  },
  caseLink: {
    title: "Gardez votre dossier, sans compte",
    body: "Votre dossier est enregistré dans ce navigateur. Un lien privé l’ouvre sur n’importe quel appareil. Les données du dossier restent dans le lien lui-même, jamais sur notre serveur.",
    copy: "Copier le lien privé",
    copied: "Lien copié ✓",
    email: "Me l’envoyer par e-mail",
    error: "Impossible de créer le lien dans ce navigateur.",
    mailSubject: (provider: string) => `Mon dossier BillCheck : ${provider}`,
    mailBody: (url: string) =>
      `Ouvrir mon dossier BillCheck (résultats, lettre et suivi) sur n’importe quel appareil :\n\n${url}\n\nGardez ce lien privé : toute personne qui l’a peut voir ce dossier. BillCheck ne le conserve pas.`,
  },
  open: {
    opening: "Ouverture de votre dossier…",
    failTitle: "Impossible d’ouvrir ce dossier",
    damaged: "Ce lien est incomplet ou endommagé. Essayez de le copier à nouveau.",
    notCase: "Ce lien n’est pas un lien de dossier BillCheck.",
  },
  errors: {
    notBill: (v: Vars) =>
      "Cela ne ressemble pas à une facture médicale détaillée. Vérifiez qu’elle indique les soins, les dates et les montants." +
      (v.photo ? " S’il s’agit d’une photo, essayez-en une plus nette ou collez le texte." : ""),
    notEob: (v: Vars) =>
      "Cela ne ressemble pas à un EOB. Il porte généralement la mention « This is not a bill » en haut." + (v.photo ? " S’il s’agit d’une photo, essayez-en une plus nette ou collez le texte." : ""),
    notBoth: () =>
      "Aucun des deux documents ne semble correct. La facture doit indiquer les soins, les dates et les montants ; l’EOB porte généralement la mention « This is not a bill » en haut.",
    generic: "Une erreur s’est produite. Veuillez réessayer.",
    invalidRequest: "Requête non valide.",
    tooManyFiles: (v: Vars) => `Envoyez au maximum ${v.max} fichiers pour ${v.doc === "bill" ? "la facture" : "l’EOB"}.`,
    unsupportedFile: (v: Vars) => `« ${v.name} » n’est pas un type de fichier pris en charge. Utilisez PDF, JPG ou PNG.`,
    missingBill: "Ajoutez votre facture détaillée (un fichier ou du texte collé).",
    missingEob: "Ajoutez l’EOB de votre assureur (un fichier ou du texte collé).",
    tooLarge: "Les fichiers sont trop lourds ensemble (environ 4 Mo maximum). Essayez avec moins de pages ou des photos plus légères.",
    rateLimited: (v: Vars) => `Vous avez fait beaucoup de vérifications au cours de la dernière heure. Réessayez dans ${v.minutes} minutes.`,
    rateLimitedLetter: "Trop de lettres au cours de la dernière heure. Réessayez plus tard.",
    notPaid: "Ce paiement n’est pas encore finalisé.",
    unlockFirst: "Débloquez d’abord cette facture.",
    aiBusy: "Le service d’IA est occupé. Réessayez dans une minute.",
    readFailed: "La lecture du document a échoué. Réessayez ou collez le texte.",
    letterFailed: "Nous n’avons pas pu rédiger la lettre cette fois-ci. Veuillez réessayer.",
    checkoutFailed: "Impossible de lancer le paiement. Veuillez réessayer.",
    verifyFailed: "Impossible de vérifier le paiement. Actualisez la page.",
    notConfigured: "",
  },
  rules: {
    DUPLICATE_CHARGE: {
      title: (p: Vars) => `Facturé deux fois : ${p.desc}`,
      explanation: (p: Vars) => {
        const basis: Record<string, string> = {
          billed: "le montant facturé complet (nous n’avons pas trouvé les chiffres de l’assureur)",
          deductible: "le montant accepté par l’assureur, car votre franchise s’applique",
          coinsurance: `votre coassurance de ${p.pct} %`,
          eobShare: "votre part sur l’EOB pour le même soin",
        };
        return (
          `Ce soin apparaît ${p.onEob ? "plus souvent sur la facture que sur votre EOB" : "deux fois sur la facture"}` +
          `${p.date ? ` le ${formatDate(String(p.date), "fr")}` : ""}. L’assureur ne l’a traité qu’une fois : la ligne en trop ` +
          `ne devrait probablement pas figurer sur votre facture. Le montant est calculé sur ${basis[String(p.basis)] ?? basis.billed}.`
        );
      },
      source: (p: Vars) => (p.eobLine ? `ligne ${p.eobLine} de l’EOB (traitée une fois)` : "Règle : frais en double"),
    },
    BILL_EXCEEDS_EOB: {
      title: () => "Votre facture dépasse ce que votre EOB indique que vous devez",
      explanation: (p: Vars) =>
        `La facture demande ${usd(p.balance)}, mais l’EOB de votre assureur indique que votre part est de ${usd(p.eobTotal)}. ` +
        (p.allOut
          ? "Les prestataires hors réseau peuvent parfois facturer la différence, mais pas pour les soins d’urgence ni pour l’anesthésie, la radiologie, " +
            "les analyses ou les chirurgiens assistants dans un établissement du réseau (loi No Surprises). Demandez au service de facturation d’expliquer ou de corriger l’écart."
          : "Pour une demande dans le réseau, vous ne devriez généralement pas payer plus que le montant de l’EOB. Demandez au service de facturation d’expliquer ou de corriger l’écart."),
      source: () => "total de l’EOB vs solde de la facture",
    },
    LINE_NOT_ON_EOB: {
      title: (p: Vars) => `Absent de votre EOB : ${p.desc}`,
      explanation: () =>
        "Nous n’avons pas trouvé ces frais sur l’EOB de votre assureur. Ils n’ont peut-être jamais été transmis à l’assurance, ou ont été facturés à part. " +
        "Demandez au prestataire de les transmettre à votre assureur (ou de les retirer) avant de payer.",
      source: () => "Règle : aucune ligne correspondante sur l’EOB",
    },
    NO_INSURANCE_APPLIED: {
      title: () => "L’assurance n’a pas été appliquée à cette facture",
      explanation: () =>
        "La facture indique $0 payé ou ajusté par l’assurance, mais votre EOB montre que la demande a été traitée. Le prestataire vous a peut-être facturé " +
        "avant d’enregistrer le paiement et la remise de l’assureur. Demandez-lui d’appliquer l’EOB et de vous envoyer une facture corrigée.",
      source: () => "Facture : assurance payée/ajustée = $0",
    },
    BALANCE_BILLING_IN_NETWORK: {
      title: () => "On vous facture la remise du réseau",
      explanation: (p: Vars) =>
        `Les ${usd(p.gap)} en trop correspondent au « montant non accepté » de votre EOB. Les prestataires du réseau s’engagent à accepter le montant accepté, ` +
        "cette différence ne peut donc généralement pas vous être facturée.",
      source: (p: Vars) => `lignes ${p.lines} de l’EOB (facturé − accepté)`,
    },
    POSSIBLE_SURPRISE_BILL: {
      title: (p: Vars) => `Facture surprise possible : ${p.emergency ? "soins d’urgence" : kind(p.kind)} hors réseau`,
      explanation: (p: Vars) =>
        (p.facilityKnown
          ? `Votre EOB indique ${p.emergency ? "des soins d’urgence hors réseau" : `un acte hors réseau (${kind(p.kind)}) dans un établissement du réseau`}. Selon la loi fédérale No Surprises, vous ne devriez payer que ce que vous paieriez dans le réseau. `
          : `Votre EOB indique que cet acte (${kind(p.kind)}) est hors réseau. S’il a été réalisé dans un hôpital ou un centre chirurgical du réseau, la loi fédérale ` +
            "No Surprises prévoit que vous ne devez que votre part dans le réseau, et le prestataire ne peut pas vous facturer le reste. ") +
        "En savoir plus : cms.gov/nosurprises." +
        (p.estimated ? "" : " Nous ne connaissons pas votre part dans le réseau, nous affichons donc le montant total."),
      source: (p: Vars) => `ligne ${p.eobLine} de l’EOB (hors réseau)`,
    },
    NOT_ITEMIZED: {
      title: () => "Cette facture n’est pas détaillée",
      explanation: () =>
        "La facture n’indique que des totaux. Vous avez le droit de demander une facture détaillée avec les codes CPT/HCPCS de chaque soin : " +
        "c’est le seul moyen de la vérifier ligne par ligne. Demandez-la avant de payer.",
      source: () => "Règle : facture détaillée requise",
    },
    POSSIBLE_UNBUNDLING: {
      title: (p: Vars) => `À demander : ${p.part}`,
      explanation: (p: Vars) => {
        const notes: Record<string, string> = {
          bmp: "un bilan métabolique de base fait partie du bilan complet",
          panelTests: "des analyses isolées déjà comprises dans le bilan métabolique",
          cbc: "des composantes d’une numération formule sanguine complète",
          ecg: "des parties d’un ECG complet",
          supplies: "des fournitures habituellement comprises dans la consultation ou les frais d’établissement",
          officeEr: "une seconde consultation facturée le même jour qu’un passage aux urgences",
        };
        return `Ceci a été facturé à part, à côté de « ${p.whole} ». Ces actes sont souvent facturés comme un seul soin (${notes[String(p.pair)] ?? ""}). Demandez au service de facturation s’ils devraient être regroupés.`;
      },
      source: (p: Vars) => `Règle : codes souvent regroupés ${p.partCode} + ${p.wholeCode}`,
    },
  },
};

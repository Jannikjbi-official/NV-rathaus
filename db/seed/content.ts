import type { PostKind } from "@/db/schema";

import type { DepartmentSlug } from "./departments";

const daysAgo = (d: number, hour = 18) => {
  const t = new Date();

  t.setDate(t.getDate() - d);
  t.setHours(hour, 0, 0, 0);

  return t;
};

const inDays = (d: number, hour = 19, minute = 0) => {
  const t = new Date();

  t.setDate(t.getDate() + d);
  t.setHours(hour, minute, 0, 0);

  return t;
};

export const POSTS: {
  slug: string;
  kind: PostKind;
  title: string;
  teaser: string;
  body: string;
  imageUrl?: string;
  gazetteNumber?: string;
  department?: DepartmentSlug;
  isFeatured?: boolean;
  publishedAt: Date;
}[] = [
  {
    slug: "hafenfest-sperrungen",
    kind: "verkehr",
    title: "Hafenfest am Wochenende: Sperrungen rund um die Landungsbrücken",
    teaser: "Von Freitag, 18 Uhr bis Sonntag, 23 Uhr ist die Hafenstraße zwischen Fischmarkt und Baumwall gesperrt. Umleitungen sind ausgeschildert.",
    body: "Anlässlich des Hafenfests wird die Hafenstraße zwischen Fischmarkt und Baumwall von Freitag, 18 Uhr, bis Sonntag, 23 Uhr, für den gesamten Fahrzeugverkehr gesperrt.\n\nDer Verkehr wird über die Reeperbahn und die Ludwig-Erhard-Straße umgeleitet. Anwohnerinnen und Anwohner erreichen ihre Grundstücke über die Davidstraße.\n\nDas Ordnungsamt bittet alle Besucherinnen und Besucher, mit öffentlichen Verkehrsmitteln anzureisen. Am Wochenende sind zusätzliche Kräfte von Polizei und Ordnungsdienst im Einsatz.",
    imageUrl: "/images/hafen-abend.svg",
    department: "ordnungsamt",
    isFeatured: true,
    publishedAt: daysAgo(0, 12),
  },
  {
    slug: "ausweis-abholung-samstags",
    kind: "pressemitteilung",
    title: "Bürgeramt: Ausweis-Abholung jetzt auch samstags",
    teaser: "Fertige Personalausweise und Reisepässe können ab sofort auch samstags von 14 bis 23 Uhr abgeholt werden.",
    body: "Das Bürgeramt erweitert seine Öffnungszeiten. Ab sofort können fertige Personalausweise und Reisepässe auch samstags zwischen 14 und 23 Uhr abgeholt werden.\n\nFür die Abholung ist ein Termin erforderlich. Termine buchen Sie im Bürgerkonto unter „Termine“. Bringen Sie zur Abholung Ihren bisherigen Ausweis mit, sofern vorhanden.",
    imageUrl: "/images/rathausmarkt.svg",
    department: "buergeramt",
    isFeatured: true,
    publishedAt: daysAgo(1),
  },
  {
    slug: "gebuehren-wunschkennzeichen",
    kind: "bekanntmachung",
    title: "Neue Gebühren für Wunschkennzeichen ab 1. Dezember",
    teaser: "Die Reservierung eines Wunschkennzeichens kostet künftig 35 €. Anträge vor dem Stichtag werden zum alten Satz bearbeitet.",
    body: "Aufgrund der Änderung der Gebührenordnung des Straßenverkehrsamts gilt ab dem 1. Dezember 2026 für die Reservierung eines Wunschkennzeichens eine Gebühr von 35 €.\n\nAnträge, die vor dem Stichtag eingehen, werden zum bisherigen Satz von 25 € bearbeitet.\n\nDie vollständige Gebührenordnung liegt im Rathaus, Erdgeschoss, zur Einsicht aus.",
    imageUrl: "/images/strassensperrung.svg",
    gazetteNumber: "Amtsblatt 46/2026",
    department: "strassenverkehrsamt",
    isFeatured: true,
    publishedAt: daysAgo(1, 10),
  },
  {
    slug: "stellen-polizei-feuerwehr-verwaltung",
    kind: "pressemitteilung",
    title: "Sieben offene Stellen bei Polizei, Feuerwehr und Verwaltung",
    teaser: "Die Stadt sucht Verstärkung für den Streifendienst, die Berufsfeuerwehr und das Bürgeramt. Bewerbungen sind bis 30. November möglich.",
    body: "Die Stadt Nordverkehr stellt ein. Gesucht werden Anwärterinnen und Anwärter für den Streifendienst der Polizei, Brandmeisterinnen und Brandmeister für die Berufsfeuerwehr sowie Sachbearbeitung für das Bürgeramt.\n\nAlle Stellen und das Bewerbungsformular finden Sie unter Karriere.",
    imageUrl: "/images/hafen-nacht.svg",
    department: "buergermeisterbuero",
    isFeatured: true,
    publishedAt: daysAgo(2),
  },
  {
    slug: "haushalt-2027",
    kind: "pressemitteilung",
    title: "Bürgermeister stellt Haushalt 2027 vor: Mehr Geld für Polizei und Hafen",
    teaser: "Schwerpunkte sind die Ausstattung der Polizei, die Sanierung der Kaimauern und zwei neue Bürgerbüros.",
    body: "Der Senat hat den Entwurf für den Haushalt 2027 beschlossen. Schwerpunkte sind die Ausstattung der Polizei mit neuen Streifenwagen, die Sanierung der Kaimauern im Hafen und zwei neue Bürgerbüros in Harburg und Wandsbek.\n\nDie Bürgerschaft berät den Entwurf in ihrer nächsten öffentlichen Sitzung.",
    imageUrl: "/images/rathausmarkt.svg",
    department: "buergermeisterbuero",
    publishedAt: daysAgo(3),
  },
  {
    slug: "elbchaussee-sperrung",
    kind: "verkehr",
    title: "Elbchaussee: Vollsperrung wegen Fahrbahnsanierung bis 28. November",
    teaser: "Zwischen Teufelsbrück und Övelgönne wird die Fahrbahn erneuert. Die Umleitung führt über die Osdorfer Landstraße.",
    body: "Die Elbchaussee wird zwischen Teufelsbrück und Övelgönne bis zum 28. November vollständig gesperrt. Die Umleitung ist ausgeschildert.",
    imageUrl: "/images/strassensperrung.svg",
    department: "strassenverkehrsamt",
    publishedAt: daysAgo(4),
  },
  {
    slug: "winterlichter-st-pauli",
    kind: "stadtleben",
    title: "Winterlichter in St. Pauli: Markt öffnet am 20. November",
    teaser: "Auf dem Spielbudenplatz öffnet der Wintermarkt mit 40 Ständen, Eisbahn und Live-Musik.",
    body: "Am 20. November eröffnet der Bürgermeister um 19 Uhr die Winterlichter auf dem Spielbudenplatz. Bis zum Jahresende laden 40 Stände, eine Eisbahn und Live-Musik ein.",
    imageUrl: "/images/hafen-nacht.svg",
    publishedAt: daysAgo(5),
  },
  {
    slug: "allgemeinverfuegung-hafen",
    kind: "bekanntmachung",
    title: "Allgemeinverfügung zu Versammlungen im Hafengebiet",
    teaser: "Versammlungen mit mehr als zehn Personen im Hafengebiet sind spätestens drei Tage vorher anzumelden.",
    body: "Auf Grundlage des Versammlungsgesetzes ergeht folgende Allgemeinverfügung: Versammlungen mit mehr als zehn Teilnehmenden im Hafengebiet sind spätestens drei Tage vor Beginn beim Ordnungsamt anzumelden.\n\nDie Verfügung gilt ab dem Tag nach ihrer Bekanntmachung.",
    gazetteNumber: "Amtsblatt 45/2026",
    department: "ordnungsamt",
    publishedAt: daysAgo(6),
  },
  {
    slug: "bebauungsplan-altona-nord",
    kind: "bekanntmachung",
    title: "Bebauungsplan Altona-Nord 14, öffentliche Auslegung",
    teaser: "Der Entwurf liegt vier Wochen im Bauamt aus. Stellungnahmen sind schriftlich möglich.",
    body: "Der Entwurf des Bebauungsplans Altona-Nord 14 liegt vom 3. bis 30. November im Bauamt, Stadthausbrücke 8, öffentlich aus. Während der Auslegung kann jede Person Stellung nehmen.",
    gazetteNumber: "Amtsblatt 44/2026",
    department: "bauamt",
    publishedAt: daysAgo(10),
  },
];

export const TRAFFIC = [
  { location: "Elbchaussee, Höhe Teufelsbrück", category: "Vollsperrung", severity: "hoch" as const, detail: "bis 28.11., Umleitung über Osdorfer Landstraße" },
  { location: "Hafenstraße, Fischmarkt bis Baumwall", category: "Veranstaltung", severity: "mittel" as const, detail: "Fr 18:00 bis So 23:00" },
  { location: "Stresemannstraße stadteinwärts", category: "Baustelle", severity: "mittel" as const, detail: "eine Spur frei" },
  { location: "Max-Brauer-Allee", category: "Geschwindigkeitskontrolle", severity: "info" as const, detail: "heute" },
];

export const EVENTS = [
  { title: "Hafenfest an den Landungsbrücken", location: "St. Pauli", startsAt: inDays(1, 18) },
  { title: "Bürgerschaft: öffentliche Sitzung", location: "Rathaus, Großer Saal", startsAt: inDays(5, 20) },
  { title: "Eröffnung Winterlichter", location: "Spielbudenplatz", startsAt: inDays(7, 19) },
  { title: "Tag der offenen Wache", location: "Polizeikommissariat 14", startsAt: inDays(9, 16) },
  { title: "Bürgersprechstunde des Bürgermeisters", location: "Rathaus, Kaisersaal", startsAt: inDays(12, 19, 30) },
];

const deadline = (d: number) => {
  const t = new Date();

  t.setDate(t.getDate() + d);

  return t.toISOString().slice(0, 10);
};

export const JOBS = [
  {
    slug: "sachbearbeitung-buergeramt",
    title: "Sachbearbeitung Bürgeramt",
    organization: "Stadtverwaltung",
    department: "buergeramt" as DepartmentSlug,
    employment: "Teilzeit",
    summary: "Bearbeitung von Ausweis-, Pass- und Meldeanträgen im Bürgeramt.",
    description: "Sie sind das Gesicht der Stadt am Schalter. Sie prüfen Anträge, stellen Dokumente aus und beraten Bürgerinnen und Bürger.",
    tasks: ["Anträge im Verwaltungsportal bearbeiten", "Ausweise und Pässe ausstellen", "Beratung am Schalter im Rathaus"],
    requirements: ["Sorgfalt und Freundlichkeit", "Mindestens 6 Stunden pro Woche online", "Führungszeugnis ohne Eintrag"],
    deadline: deadline(17),
  },
  {
    slug: "polizeimeister-anwaerter",
    title: "Polizeimeister-Anwärter/in",
    organization: "Polizei Nordverkehr",
    department: null,
    employment: "Vollzeit",
    summary: "Ausbildung für den Streifendienst der Polizei Nordverkehr.",
    description: "In der Ausbildung lernen Sie Einsatztaktik, Verkehrsrecht und den Umgang mit Bürgerinnen und Bürgern.",
    tasks: ["Streifendienst", "Unfallaufnahme", "Verkehrskontrollen"],
    requirements: ["Gültiger Führerschein Klasse B", "Führungszeugnis ohne Eintrag", "Funkdisziplin"],
    deadline: null,
  },
  {
    slug: "brandmeister",
    title: "Brandmeister/in",
    organization: "Feuerwehr Nordverkehr",
    department: null,
    employment: "Vollzeit",
    summary: "Brandbekämpfung, technische Hilfe und Rettungsdienst.",
    description: "Als Teil der Berufsfeuerwehr rücken Sie zu Bränden, Unfällen und medizinischen Notfällen aus.",
    tasks: ["Brandbekämpfung", "Technische Hilfeleistung", "Rettungsdienst"],
    requirements: ["Führerschein Klasse C oder Bereitschaft zum Erwerb", "Teamfähigkeit"],
    deadline: deadline(7),
  },
  {
    slug: "notfallsanitaeter",
    title: "Notfallsanitäter/in",
    organization: "Rettungsdienst Nordverkehr",
    department: null,
    employment: "Vollzeit",
    summary: "Medizinische Versorgung im Rettungswagen und in der Notaufnahme.",
    description: "Sie versorgen Verletzte am Einsatzort und bringen sie sicher ins Krankenhaus.",
    tasks: ["Notfalleinsätze", "Patiententransport", "Dokumentation"],
    requirements: ["Ruhe in Stresssituationen", "Führerschein Klasse B"],
    deadline: deadline(21),
  },
  {
    slug: "ordnungsdienst",
    title: "Mitarbeiter/in Ordnungsdienst",
    organization: "Stadtverwaltung",
    department: "ordnungsamt" as DepartmentSlug,
    employment: "Teilzeit",
    summary: "Kontrolle von Parkverstößen, Veranstaltungen und Gewerbeauflagen.",
    description: "Sie sind im Stadtgebiet unterwegs und sorgen für die Einhaltung städtischer Vorschriften.",
    tasks: ["Parkraumkontrolle", "Veranstaltungsaufsicht", "Gewerbekontrollen"],
    requirements: ["Durchsetzungsvermögen", "Höflicher Umgangston"],
    deadline: deadline(14),
  },
  {
    slug: "standesbeamter",
    title: "Standesbeamtin/Standesbeamter",
    organization: "Stadtverwaltung",
    department: "standesamt" as DepartmentSlug,
    employment: "Teilzeit",
    summary: "Durchführung von Trauungen und Beurkundungen.",
    description: "Sie führen Trauungen durch und stellen Personenstandsurkunden aus.",
    tasks: ["Trauungen", "Urkunden ausstellen", "Beratung"],
    requirements: ["Sicheres Auftreten", "Gute Ausdrucksweise"],
    deadline: deadline(30),
  },
  {
    slug: "sachbearbeitung-bauamt",
    title: "Sachbearbeitung Bauamt",
    organization: "Stadtverwaltung",
    department: "bauamt" as DepartmentSlug,
    employment: "Teilzeit",
    summary: "Prüfung von Bauanträgen und Führung des Grundstücksregisters.",
    description: "Sie prüfen Bauanträge auf Vollständigkeit und Vereinbarkeit mit dem Baurecht.",
    tasks: ["Bauanträge prüfen", "Grundstücksregister pflegen"],
    requirements: ["Interesse an Immobilien und Bauen"],
    deadline: deadline(30),
  },
];

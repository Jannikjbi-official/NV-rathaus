import type { DocRender, DocSide } from "./types";

import { CARD_H, CARD_MM, CARD_W, IdCardBack, IdCardFront, LicenseBack, LicenseFront, PermitBack, PermitFront } from "./templates/cards";
import { A4_H, A4_MM, A4_W, Certificate, OfficialLetter } from "./templates/paper";
import { PASS_COVER_H, PASS_COVER_MM, PASS_COVER_W, PASS_PAGE_H, PASS_PAGE_MM, PASS_PAGE_W, PassportCover, PassportDataPage } from "./templates/passport";
import { VEH_H, VEH_MM, VEH_W, VehicleRegistration } from "./templates/vehicle";

const card = (id: string, label: string, node: React.ReactNode): DocSide => ({ id, label, width: CARD_W, height: CARD_H, mm: CARD_MM, node });
const a4 = (node: React.ReactNode): DocSide => ({ id: "dokument", label: "Dokument", width: A4_W, height: A4_H, mm: A4_MM, node });

/** Welche Seiten ein Dokument hat und wie sie aussehen. */
export function documentSides(doc: DocRender): DocSide[] {
  switch (doc.type) {
    case "personalausweis":
      return [card("vorderseite", "Vorderseite", <IdCardFront doc={doc} />), card("rueckseite", "Rückseite", <IdCardBack doc={doc} />)];
    case "fuehrerschein":
      return [card("vorderseite", "Vorderseite", <LicenseFront doc={doc} />), card("rueckseite", "Rückseite", <LicenseBack doc={doc} />)];
    case "waffenbesitzkarte":
    case "waffenschein":
    case "jagdschein":
    case "fischereischein":
      return [card("vorderseite", "Vorderseite", <PermitFront doc={doc} />), card("rueckseite", "Rückseite", <PermitBack doc={doc} />)];
    case "reisepass":
      return [
        { id: "einband", label: "Einband", width: PASS_COVER_W, height: PASS_COVER_H, mm: PASS_COVER_MM, node: <PassportCover /> },
        { id: "datenseite", label: "Datenseite", width: PASS_PAGE_W, height: PASS_PAGE_H, mm: PASS_PAGE_MM, node: <PassportDataPage doc={doc} /> },
      ];
    case "fahrzeugschein":
      return [{ id: "fahrzeugschein", label: "Fahrzeugschein", width: VEH_W, height: VEH_H, mm: VEH_MM, node: <VehicleRegistration doc={doc} /> }];
    case "urkunde":
      return [a4(<Certificate doc={doc} />)];
    default:
      return [a4(<OfficialLetter doc={doc} />)];
  }
}

/** Vorschaubild: beim Pass die Datenseite, sonst die erste Seite. */
export function previewSide(doc: DocRender) {
  const sides = documentSides(doc);

  return doc.type === "reisepass" ? sides[1] : sides[0];
}

import {
  Briefcase,
  Car,
  FileText,
  Hammer,
  Hand,
  HeartPulse,
  House,
  Megaphone,
  Persons,
  Receipt,
  ShieldCheck,
} from "@gravity-ui/icons";

const ICONS = { Briefcase, Car, FileText, Hammer, Hand, HeartPulse, House, Megaphone, Persons, Receipt, ShieldCheck };

export type IconName = keyof typeof ICONS;

/** Gravity-Icon per Name (Namen kommen aus der Datenbank). */
export function Icon({ name, className, size = 16 }: { name: string; className?: string; size?: number }) {
  const Cmp = ICONS[name as IconName] ?? FileText;

  return <Cmp className={className} height={size} width={size} />;
}

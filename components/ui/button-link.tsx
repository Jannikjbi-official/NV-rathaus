import NextLink from "next/link";
import { buttonVariants } from "@heroui/styles";

type Props = React.ComponentProps<typeof NextLink> & {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isIconOnly?: boolean;
};

/** Next-Link mit den Original-Klassen des HeroUI-Buttons. */
export function ButtonLink({ variant = "primary", size = "md", fullWidth, isIconOnly, className, ...props }: Props) {
  return (
    <NextLink
      className={buttonVariants({ variant, size, fullWidth, isIconOnly, className })}
      {...props}
    />
  );
}

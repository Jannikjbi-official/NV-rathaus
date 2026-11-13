"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@gravity-ui/icons";
import { Button, Tooltip } from "@heroui/react";
import { useTheme } from "next-themes";

/** Hell/Dunkel umschalten. Vor dem Mounten Platzhalter, damit nichts flackert. */
export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Helles Design" : "Dunkles Design";

  return (
    <Tooltip delay={300}>
      <Button aria-label={label} isIconOnly size={size} variant="tertiary" onPress={() => setTheme(dark ? "light" : "dark")}>
        {mounted ? dark ? <Sun /> : <Moon /> : <span className="size-4" />}
      </Button>
      <Tooltip.Content>
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label, ListBox, Select } from "@heroui/react";

export function DepartmentFilter({ departments, value }: { departments: { slug: string; name: string }[]; value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Select
      className="lg:w-64"
      selectedKey={value || "alle"}
      onSelectionChange={(key) => {
        const sp = new URLSearchParams(params.toString());

        if (key === "alle") sp.delete("amt");
        else sp.set("amt", String(key));
        router.push(`${pathname}?${sp}`);
      }}
    >
      <Label>Amt</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="alle" textValue="Alle meine Ämter">Alle meine Ämter<ListBox.ItemIndicator /></ListBox.Item>
          {departments.map((d) => (
            <ListBox.Item key={d.slug} id={d.slug} textValue={d.name}>
              {d.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

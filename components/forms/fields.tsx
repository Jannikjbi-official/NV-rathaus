"use client";

import { parseDate, type CalendarDate } from "@internationalized/date";
import {
  Calendar,
  Checkbox,
  CheckboxGroup,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { CircleInfo } from "@gravity-ui/icons";

import type { FormField } from "@/lib/forms/types";

/** Datumsauswahl mit Kalender, liefert YYYY-MM-DD im Formular. */
export function DateInput({
  name,
  label,
  description,
  isRequired,
  defaultValue,
  isReadOnly,
}: {
  name: string;
  label: string;
  description?: string;
  isRequired?: boolean;
  defaultValue?: string | null;
  isReadOnly?: boolean;
}) {
  let value: CalendarDate | undefined;

  try {
    value = defaultValue ? parseDate(defaultValue) : undefined;
  } catch {
    value = undefined;
  }

  return (
    <DatePicker className="w-full" defaultValue={value} isReadOnly={isReadOnly} isRequired={isRequired} name={name}>
      <Label>{label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {description ? <Description>{description}</Description> : null}
      <FieldError />
      <DatePicker.Popover>
        <Calendar aria-label={label}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>{({ year }) => <Calendar.YearPickerCell year={year} />}</Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

export function SelectInput({
  name,
  label,
  options,
  description,
  isRequired,
  defaultValue,
  placeholder = "Bitte wählen",
}: {
  name: string;
  label: string;
  options: string[];
  description?: string;
  isRequired?: boolean;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <Select className="w-full" defaultSelectedKey={defaultValue ?? undefined} isRequired={isRequired} name={name} placeholder={placeholder}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {description ? <Description>{description}</Description> : null}
      <FieldError />
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o} id={o} textValue={o}>
              {o}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Rendert ein Formularfeld aus der Definition einer Leistung. */
export function DynamicField({ field }: { field: FormField }) {
  const { id, label, description, required, placeholder } = field;

  switch (field.type) {
    case "heading":
      return <h3 className="pt-2 text-base font-semibold sm:col-span-2">{label}</h3>;

    case "info":
      return (
        <div className="flex gap-3 rounded-2xl bg-default p-4 text-sm sm:col-span-2">
          <CircleInfo className="mt-0.5 size-4 shrink-0 text-muted" />
          <div>
            <p className="font-medium">{label}</p>
            {description ? <p className="text-muted">{description}</p> : null}
          </div>
        </div>
      );

    case "text":
      return (
        <TextField isRequired={required} name={id}>
          <Label>{label}</Label>
          <Input placeholder={placeholder} />
          {description ? <Description>{description}</Description> : null}
          <FieldError />
        </TextField>
      );

    case "textarea":
      return (
        <TextField isRequired={required} name={id}>
          <Label>{label}</Label>
          <TextArea placeholder={placeholder} rows={4} />
          {description ? <Description>{description}</Description> : null}
          <FieldError />
        </TextField>
      );

    case "number":
      return (
        <NumberField
          formatOptions={{ useGrouping: false }}
          isRequired={required}
          maxValue={field.max}
          minValue={field.min}
          name={id}
        >
          <Label>{label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
          {description ? <Description>{description}</Description> : null}
          <FieldError />
        </NumberField>
      );

    case "date":
      return <DateInput description={description} isRequired={required} label={label} name={id} />;

    case "select":
      return <SelectInput description={description} isRequired={required} label={label} name={id} options={field.options ?? []} />;

    case "radio":
      return (
        <RadioGroup isRequired={required} name={id}>
          <Label>{label}</Label>
          {description ? <Description>{description}</Description> : null}
          {(field.options ?? []).map((o) => (
            <Radio key={o} value={o}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                {o}
              </Radio.Content>
            </Radio>
          ))}
          <FieldError />
        </RadioGroup>
      );

    case "checkbox":
      return (
        <Checkbox isRequired={required} name={id} value="ja">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            {label}
          </Checkbox.Content>
          {description ? <Description>{description}</Description> : null}
          <FieldError />
        </Checkbox>
      );

    case "checkboxes":
      return (
        <CheckboxGroup isRequired={required} name={id}>
          <Label>{label}</Label>
          {description ? <Description>{description}</Description> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {(field.options ?? []).map((o) => (
              <Checkbox key={o} value={o}>
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  {o}
                </Checkbox.Content>
              </Checkbox>
            ))}
          </div>
          <FieldError />
        </CheckboxGroup>
      );
  }
}

/** Ordnet die Felder im Raster an; "half" teilt sich eine Zeile. */
export function DynamicFields({ fields }: { fields: FormField[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => (
        <div
          key={f.id}
          className={f.half && !["heading", "info", "radio", "checkboxes", "checkbox", "textarea"].includes(f.type) ? "" : "sm:col-span-2"}
        >
          <DynamicField field={f} />
        </div>
      ))}
    </div>
  );
}

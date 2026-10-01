"use client"

import { Controller, type Control } from "react-hook-form"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { ProjectFormValues } from "@/lib/project-form"
import type { FandomOption } from "@/lib/projects"

export function ProjectFandomField({
  control,
  fandoms,
}: {
  control: Control<ProjectFormValues>
  fandoms: FandomOption[]
}) {
  return (
    <Controller
      control={control}
      name="fandomIds"
      render={({ field, fieldState }) => {
        const selected = fandoms.filter((option) => field.value.includes(option.id))
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Fandoms</FieldLabel>
            <Combobox
              items={fandoms}
              multiple
              onValueChange={(options: FandomOption[]) =>
                field.onChange(options.map((option) => option.id))
              }
              value={selected}
            >
              <ComboboxChips>
                <ComboboxValue>
                  {(options: FandomOption[]) =>
                    options.map((option) => <ComboboxChip key={option.id}>{option.label}</ComboboxChip>)
                  }
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Search fandoms..." />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxEmpty>No enabled fandoms found.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxCollection>
                    {(option: FandomOption) => (
                      <ComboboxItem key={option.id} value={option}>
                        {option.label}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}

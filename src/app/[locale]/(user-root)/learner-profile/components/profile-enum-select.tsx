"use client"

import { useMemo } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LEARNER_PROFILE_SELECT_EMPTY,
  findLearnerProfileOption,
  type LearnerProfileSelectOption,
} from "@/config/learner-profile-dropdowns"

interface ProfileEnumSelectProps {
  name: string
  options: LearnerProfileSelectOption[]
  canEdit: boolean
  viewValue: string
  className?: string
}

function resolveOptionLabel(
  option: LearnerProfileSelectOption,
  t: ReturnType<typeof useTranslations>,
): string {
  if (option.labelKey) {
    return t(option.labelKey as "dropdowns.selectPlaceholder")
  }
  return option.label ?? option.value
}

export function resolveProfileFieldDisplay(
  value: string | undefined | null,
  options: LearnerProfileSelectOption[],
  t: ReturnType<typeof useTranslations>,
): string {
  const trimmed = value?.trim()
  if (!trimmed) return "—"
  const match = findLearnerProfileOption(options, trimmed)
  if (match) return resolveOptionLabel(match, t)
  return trimmed
}

export function ProfileEnumSelect({
  name,
  options,
  canEdit,
  viewValue,
  className,
}: ProfileEnumSelectProps) {
  const t = useTranslations("learnerProfile")
  const { control } = useFormContext()

  const selectOptions = useMemo(() => {
    const list = [...options]
    return list
  }, [options])

  if (!canEdit) {
    return (
      <div className="flex min-h-10 items-center">
        {resolveProfileFieldDisplay(viewValue === "—" ? "" : viewValue, options, t)}
      </div>
    )
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const current = field.value?.trim() ?? ""
        const hasLegacyValue =
          current &&
          !selectOptions.some((o) => o.value === current)

        return (
          <div className={className}>
            <Select
              value={current || LEARNER_PROFILE_SELECT_EMPTY}
              onValueChange={(v) =>
                field.onChange(v === LEARNER_PROFILE_SELECT_EMPTY ? "" : v)
              }
            >
              <SelectTrigger className="min-h-10 w-full">
                <SelectValue placeholder={t("dropdowns.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LEARNER_PROFILE_SELECT_EMPTY}>
                  {t("dropdowns.selectPlaceholder")}
                </SelectItem>
                {hasLegacyValue ? (
                  <SelectItem value={current}>{current}</SelectItem>
                ) : null}
                {selectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {resolveOptionLabel(option, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectOptions.length === 0 ? (
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t("dropdowns.optionsPendingHint")}
              </p>
            ) : null}
          </div>
        )
      }}
    />
  )
}

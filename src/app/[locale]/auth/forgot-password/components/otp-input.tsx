"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  onBlur?: () => void
  className?: string
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  onBlur,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const characters = Array.from({ length }, (_, index) => value[index] ?? "")

  useEffect(() => {
    if (disabled) {
      return
    }
    if (!value || value.length === 0) {
      inputsRef.current[0]?.focus()
    }
  }, [disabled, value])

  const updateValueAt = (index: number, digit: string) => {
    const normalized = digit.replace(/\D/g, "")
    if (normalized.length === 0) {
      const next = value.split("")
      next[index] = ""
      onChange(next.join("").slice(0, length))
      return
    }

    const digits = normalized.split("")
    const next = value.split("")

    let cursor = index
    for (const singleDigit of digits) {
      if (cursor >= length) {
        break
      }
      next[cursor] = singleDigit
      cursor += 1
    }

    onChange(next.join("").slice(0, length))

    if (cursor < length) {
      inputsRef.current[cursor]?.focus()
    } else {
      inputsRef.current[length - 1]?.blur()
      onBlur?.()
    }
  }

  const focusPrevious = (index: number) => {
    if (index <= 0) {
      return
    }
    inputsRef.current[index - 1]?.focus()
  }

  const focusNext = (index: number) => {
    if (index >= length - 1) {
      return
    }
    inputsRef.current[index + 1]?.focus()
  }

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {characters.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node
          }}
          id={index === 0 ? "otp" : `otp-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-md border border-input bg-transparent text-center text-lg font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "md:h-14 md:w-14 md:text-xl",
          )}
          onBlur={index === length - 1 ? onBlur : undefined}
          onChange={(event) => updateValueAt(index, event.target.value)}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault()
              if (value[index]) {
                updateValueAt(index, "")
              } else {
                focusPrevious(index)
              }
              return
            }

            if (event.key === "ArrowLeft") {
              event.preventDefault()
              focusPrevious(index)
              return
            }

            if (event.key === "ArrowRight") {
              event.preventDefault()
              focusNext(index)
            }
          }}
          onPaste={(event) => {
            event.preventDefault()
            const pasteData = event.clipboardData?.getData("Text") ?? ""
            updateValueAt(index, pasteData)
          }}
        />
      ))}
    </div>
  )
}


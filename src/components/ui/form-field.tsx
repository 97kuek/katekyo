"use client"

import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function validationReason(field: FormControl, label: string) {
  const { validity } = field
  if (validity.valueMissing) return `${label}は必須です。入力または選択してください。`
  if (validity.typeMismatch && field instanceof HTMLInputElement && field.type === "email") {
    return `${label}は「name@example.com」の形式で入力してください。全角文字は半角として処理されます。`
  }
  if (validity.typeMismatch && field instanceof HTMLInputElement && field.type === "url") {
    return `${label}は「https://」から始まるURLで入力してください。`
  }
  if (validity.tooShort && field instanceof HTMLInputElement) {
    return `${label}は${field.minLength}文字以上で入力してください（現在${field.value.length}文字）。`
  }
  if (validity.tooLong && field instanceof HTMLInputElement) {
    return `${label}は${field.maxLength}文字以内で入力してください。`
  }
  if (validity.rangeUnderflow && field instanceof HTMLInputElement) return `${label}は${field.min}以上で入力してください。`
  if (validity.rangeOverflow && field instanceof HTMLInputElement) return `${label}は${field.max}以下で入力してください。`
  if (validity.stepMismatch) return `${label}の入力単位を確認してください。`
  if (validity.patternMismatch) return field.title || `${label}の入力形式を確認してください。`
  return field.validationMessage || `${label}の入力内容を確認してください。`
}

export function FormField({
  htmlFor,
  label,
  required = false,
  hint,
  example,
  error,
  children,
  className = "space-y-2",
}: {
  htmlFor: string
  label: string
  required?: boolean
  hint?: string
  example?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  const generatedId = useId().replaceAll(":", "")
  const descriptionId = `field-description-${generatedId}`
  const errorId = `field-error-${generatedId}`
  const touched = useRef(false)
  const [clientError, setClientError] = useState("")
  const visibleError = error || clientError

  useEffect(() => {
    const field = document.getElementById(htmlFor)
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return

    const ids = new Set((field.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean))
    if (hint || example) ids.add(descriptionId)
    if (visibleError) ids.add(errorId)
    else ids.delete(errorId)
    field.setAttribute("aria-describedby", Array.from(ids).join(" "))
    field.setAttribute("aria-invalid", visibleError ? "true" : "false")
  }, [descriptionId, errorId, example, hint, htmlFor, visibleError])

  function fieldFromTarget(target: EventTarget): FormControl | null {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return null
    return target.id === htmlFor ? target : null
  }

  function validate(field: FormControl) {
    setClientError(field.validity.valid ? "" : validationReason(field, label))
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const field = fieldFromTarget(event.target)
    if (!field) return
    touched.current = true
    validate(field)
  }

  function handleInput(event: FormEvent<HTMLDivElement>) {
    const field = fieldFromTarget(event.target)
    if (field && touched.current) validate(field)
  }

  function handleInvalid(event: FormEvent<HTMLDivElement>) {
    const field = fieldFromTarget(event.target)
    if (!field) return
    touched.current = true
    validate(field)
  }

  return (
    <div className={className} onBlurCapture={handleBlur} onInputCapture={handleInput} onInvalidCapture={handleInvalid}>
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        <span className={required
          ? "rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-foreground"
          : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        }>
          {required ? "必須" : "任意"}
        </span>
      </div>
      {children}
      {(hint || example) && (
        <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}{hint && example ? " " : ""}{example && <span>例: {example}</span>}
        </p>
      )}
      {visibleError && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {visibleError}
        </p>
      )}
    </div>
  )
}

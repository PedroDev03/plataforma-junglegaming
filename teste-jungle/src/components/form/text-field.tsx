import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string
  hint?: string
}

/** Campo acessível: `<Label htmlFor>`, `aria-invalid` explícito e erro/dica ligados via `aria-describedby`. */
export function TextField({ label, error, hint, id, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const isInvalid = Boolean(error)
  const describedBy =
    [isInvalid ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && !isInvalid && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {isInvalid && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

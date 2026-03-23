import clsx from 'clsx'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  readOnly?: boolean
  hint?: string
  error?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  readOnly = false,
  hint,
  error,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-200 mb-2">
        {label}
        {required && !readOnly && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required && !readOnly}
        readOnly={readOnly}
        className={clsx(
          'w-full rounded-lg border bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors',
          'focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600',
          error ? 'border-red-600' : 'border-slate-700',
          readOnly && 'cursor-default opacity-80'
        )}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

interface SelectFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  required?: boolean
  hint?: string
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  hint,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-200 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600 transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

interface CheckboxFieldProps {
  label: string
  name: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint?: string
}

export function CheckboxField({
  label,
  name,
  checked,
  onChange,
  hint,
}: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
      />
      <div className="flex-1">
        <label htmlFor={name} className="block text-sm font-medium text-slate-200">
          {label}
        </label>
        {hint && (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        )}
      </div>
    </div>
  )
}

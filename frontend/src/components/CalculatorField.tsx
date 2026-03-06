import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
}

export default function CalculatorField({ label, value, onChange, hint }: Props) {
  const { t } = useTranslation()
  const [totalAmount, setTotalAmount] = useState('')
  const [quantity, setQuantity] = useState('')

  const calculate = () => {
    const total = parseFloat(totalAmount)
    const qty = parseFloat(quantity)
    if (!isNaN(total) && !isNaN(qty) && qty > 0) {
      const result = parseFloat((total / qty).toFixed(2))
      onChange(result)
    }
  }

  return (
    <div className="space-y-2">
      <label className="label-text">{label}</label>

      {/* Direct input */}
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step="0.01"
        min="0"
        className="input-field"
        placeholder="0.00"
      />

      {/* Calculator helper */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-gold-500 hover:text-gold-400 transition-colors list-none flex items-center gap-1">
          <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {t('staff.calculator_hint')}
        </summary>
        <div className="mt-2 p-3 bg-tobacco-800 rounded-lg border border-tobacco-600 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-tobacco-400 mb-1 block">{t('staff.calculator_total')}</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="input-field text-sm py-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-tobacco-400 mb-1 block">{t('staff.calculator_qty')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field text-sm py-2"
                placeholder="1"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={calculate}
            className="w-full py-2 text-sm bg-gold-500 hover:bg-gold-400 text-tobacco-950 font-bold rounded-lg transition-colors"
          >
            = {totalAmount && quantity ? `${(parseFloat(totalAmount) / parseFloat(quantity)).toFixed(2)} ${t('common.aed')}` : t('common.confirm')}
          </button>
        </div>
      </details>
    </div>
  )
}

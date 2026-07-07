const STEPS = [
  { n: 1, label: '団体登録' },
  { n: 2, label: '部署・職種' },
  { n: 3, label: 'ユーザー登録' },
] as const

export function SetupStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-9 flex w-full max-w-md items-start">
      {STEPS.map((step, i) => {
        const done    = step.n < current
        const active  = step.n === current
        return (
          <div key={step.n} className="flex items-start flex-1">
            {/* ステップ本体 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                done    ? 'bg-emerald-500 text-white' :
                active  ? 'bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50' :
                          'bg-slate-100 text-slate-400'
              }`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.n}
              </div>
              <span className={`text-xs leading-tight text-center ${
                active  ? 'font-bold text-indigo-600' :
                done    ? 'text-slate-500' :
                          'text-slate-300'
              }`}>
                {step.label}
              </span>
            </div>
            {/* コネクター線 */}
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mt-4 h-0.5 flex-1 rounded-full transition-colors ${
                step.n < current ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const STEPS = [
  { n: 1, label: '団体登録' },
  { n: 2, label: '部署・職種' },
  { n: 3, label: 'ユーザー登録' },
] as const

export function SetupStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-start w-full max-w-xs mb-10">
      {STEPS.map((step, i) => {
        const done    = step.n < current
        const active  = step.n === current
        const pending = step.n > current
        return (
          <div key={step.n} className="flex items-start flex-1">
            {/* ステップ本体 */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                done    ? 'bg-blue-600 text-white' :
                active  ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                          'bg-gray-100 text-gray-400'
              }`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.n}
              </div>
              <span className={`text-xs leading-tight text-center ${
                active  ? 'text-blue-600 font-medium' :
                done    ? 'text-gray-500' :
                          'text-gray-300'
              }`}>
                {step.label}
              </span>
            </div>
            {/* コネクター線 */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mt-3.5 mx-1 transition-colors ${
                step.n < current ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

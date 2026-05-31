import UnisonPlazaAvailability from '../UnisonPlazaAvailability'

export default function UnisonPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">ユニゾンプラザ空き状況</h1>
        <p className="text-sm text-gray-500 mt-0.5">新潟ユニゾンプラザの施設予約状況</p>
      </div>
      <UnisonPlazaAvailability />
    </div>
  )
}

import SubNav from './SubNav'

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SubNav />
      {children}
    </div>
  )
}

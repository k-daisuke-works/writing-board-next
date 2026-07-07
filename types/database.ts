// -----------------------------------------------
// セッション情報（JWT に格納するユーザー情報）
// -----------------------------------------------
export type UserRole = 'admin' | 'leader' | 'member'

export type UserSession = {
  userKey: number
  userId: string
  userName: string
  organizationKey: number
  organizationId: string
  organizationName: string
  departmentId: number
  departmentName: string
  jobId: number
  jobName: string
  role: UserRole
  adminFlag: boolean   // computed: role === 'admin'
  avatarUrl: string | null
  mustChangePassword: boolean
  realtimeChannel: string   // 推測困難な Realtime broadcast チャンネル名（HMAC由来）
}

// -----------------------------------------------
// DB テーブル型
// -----------------------------------------------
export type Organization = {
  organization_key: number
  organization_id: string
  organization_name: string
  organization_password: string
  created_at: string
}

export type Department = {
  department_id: number
  department_name: string
  organization_key: number
  user_count?: number
}

export type Job = {
  job_id: number
  job_name: string
  organization_key: number
  user_count?: number
}

export type Position = {
  position_id: number
  position_name: string
  organization_key: number
}

export type EmploymentType = {
  employment_type_id: number
  employment_type_name: string
  organization_key: number
}

export type Group = {
  group_id: number
  group_name: string
  organization_key: number
  members?: { user_key: number; user_name: string }[]
}

export type LoginHistoryEntry = {
  id: number
  user_key: number | null
  organization_key: number
  user_name_stamp: string
  logged_at: string
  ip_address: string | null
}

export type PasswordPolicy = {
  organization_key: number
  min_length: number
  expiry_days: number | null
}

export type AuditLogEntry = {
  id: number
  organization_key: number
  actor_user_key: number | null
  actor_name: string
  action: string
  target: string | null
  detail: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export type UserInfo = {
  user_key: number
  user_id: string
  user_name: string
  job_id: number | null
  department_id: number | null
  position_id: number | null
  employment_type_id: number | null
  is_active: boolean
  admin_flag: boolean
  role: UserRole
  organization_key: number
  social_worker_member_id: string | null
  // password（ハッシュ）はこの型に含めない — クライアントに渡る型のため。
  // 検証が必要な Server Action では個別に select する
  password_changed_at: string | null
  created_at: string
  department?: Department
  job?: Job
  position?: Position
  employment_type?: EmploymentType
}

export type ScheduleEvent = {
  event_id: number
  organization_key: number
  created_by: number
  created_by_name: string
  title: string
  description: string | null
  scope: 'all_departments' | 'department'
  target_department_id: number | null
  target_department_name: string | null
  status: 'open' | 'closed'
  created_at: string
}

export type ScheduleDate = {
  date_id: number
  event_id: number
  candidate_dt: string
  sort_order: number
}

export type ScheduleResponse = {
  response_id: number
  event_id: number
  date_id: number
  respondent_type: 'department' | 'user'
  respondent_id: number
  respondent_name: string
  answer: 'ok' | 'maybe' | 'ng'
  answered_by: number
  answered_at: string
}

export type CalendarEvent = {
  id: number
  organization_key: number
  title: string
  event_date: string
  note: string | null
  location: string | null
  scope: 'all' | 'department'
  department_id: number | null
  source_schedule_id: number | null
  created_by: string
  created_at: string
}

export type PostRead = {
  id: number
  post_id: number
  user_key: number
  user_name: string
  organization_key: number
  read_at: string
}

export type PostReaction = {
  id: number
  post_id: number
  user_key: number
  user_name: string
  organization_key: number
  emoji: string
  created_at: string
}

export type PostReply = {
  id: number
  post_id: number
  user_key: number
  user_name_stamp: string
  organization_key: number
  message: string
  created_at: string
}

export type PostAttachment = {
  id: number
  post_id: number
  organization_key: number
  file_type: 'image' | 'video' | 'pdf'
  url: string
  created_at: string
}

export type WritingData = {
  writing_id: number
  user_key: number | null
  job_id: number | null
  department_id: number | null
  organization_key: number
  user_name_stamp: string
  job_name_stamp: string | null
  department_name_stamp: string | null
  pin: string | null
  message: string
  pdf_url: string | null
  image_url: string | null
  video_url: string | null
  post_type: 'board' | 'team' | 'notice'
  writing_time: string
  is_important: boolean
  display_until: string | null
}

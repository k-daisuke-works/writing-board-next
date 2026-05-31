// -----------------------------------------------
// セッション情報（JWT に格納するユーザー情報）
// -----------------------------------------------
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
  adminFlag: boolean
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

export type UserInfo = {
  user_key: number
  user_id: string
  user_name: string
  job_id: number | null
  department_id: number | null
  admin_flag: boolean
  organization_key: number
  password: string
  created_at: string
  department?: Department
  job?: Job
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
}

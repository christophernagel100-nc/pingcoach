export type PlayerType = 'angreifer' | 'allrounder' | 'abwehr' | 'unbekannt'
export type PlayingHand = 'rechts' | 'links'
export type GripStyle = 'shakehand' | 'penholder'
export type PlayerLevel = 'anfaenger' | 'fortgeschritten' | 'vereinsspieler' | 'leistungsspieler'

export type StrokeType =
  | 'vorhand_topspin'
  | 'rueckhand_topspin'
  | 'vorhand_push'
  | 'rueckhand_push'
  | 'vorhand_block'
  | 'rueckhand_block'
  | 'vorhand_flip'
  | 'rueckhand_flip'
  | 'aufschlag'
  | 'sonstiges'

export type AnalysisType = 'einzelschlag' | 'sequenz' | 'match'

export type DrillCategory =
  | 'vorhand'
  | 'rueckhand'
  | 'aufschlag'
  | 'rueckschlag'
  | 'beinarbeit'
  | 'taktik'
  | 'kondition'
  | 'allgemein'

export type DrillDifficulty = 'anfaenger' | 'mittel' | 'fortgeschritten' | 'profi'

export type MatchType = 'liga' | 'turnier' | 'training' | 'freundschaftsspiel'
export type MatchResult = 'sieg' | 'niederlage'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  player_type: PlayerType
  playing_hand: PlayingHand
  grip_style: GripStyle
  level: PlayerLevel
  weaknesses: string[]
  strengths: string[]
  goals: string[]
  weekly_training_hours: number
  ttr_rating: number | null
  club_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  user_id: string
  stroke_type: StrokeType | null
  pose_data: PoseData
  ai_feedback: string
  ai_feedback_structured: StructuredFeedback | null
  overall_score: number | null
  improvement_areas: string[]
  recommended_drill_ids: string[]
  video_duration_seconds: number | null
  analysis_type: AnalysisType
  created_at: string
}

export interface PoseData {
  frames: PoseFrame[]
  fps: number
  duration_seconds: number
}

export interface PoseFrame {
  timestamp: number
  keypoints: Keypoint[]
}

export interface Keypoint {
  name: string
  x: number
  y: number
  z?: number
  visibility: number
}

export interface StructuredFeedback {
  summary: string
  strengths: string[]
  weaknesses: FeedbackItem[]
  drills: DrillRecommendation[]
  score_breakdown: Record<string, number>
}

export interface FeedbackItem {
  area: string
  description: string
  severity: 'leicht' | 'mittel' | 'schwer'
  fix_suggestion: string
}

export interface DrillRecommendation {
  drill_id?: string
  name: string
  reason: string
}

export interface TrainingSession {
  id: string
  user_id: string
  date: string
  duration_minutes: number | null
  focus_areas: string[]
  drills_completed: string[]
  notes: string | null
  rating: number | null
  created_at: string
}

export interface Drill {
  id: string
  name: string
  description: string
  category: DrillCategory
  difficulty: DrillDifficulty
  target_weakness: string[]
  duration_minutes: number
  equipment_needed: string[]
  instructions: DrillInstruction
  tips: string[]
  videos?: VideoReference[]
  created_at: string
}

export interface DrillInstruction {
  steps: string[]
  sets?: number
  reps?: number
  rest_seconds?: number
}

export interface MatchStats {
  id: string
  user_id: string
  date: string
  opponent_name: string | null
  result: MatchResult
  sets_won: number
  sets_lost: number
  match_type: MatchType
  notes: string | null
  analysis_id: string | null
  created_at: string
}

export interface WaitlistEntry {
  email: string
  player_level?: string
  source?: string
}

// Training Guide Types

export interface VideoReference {
  youtube_id: string
  title: string
  channel: string
  duration_seconds: number
  language: 'de' | 'en'
}

export interface QuickWin {
  drill: Drill
  reason: string
  impact: 'hoch' | 'mittel'
  ttr_relevance: string
}

export interface TrainingPlan {
  id: string
  name: string
  level: PlayerLevel
  description: string
  duration_weeks: number
  sessions_per_week: number
  weekly_schedule: WeeklySchedule[]
  progression_notes: string
}

export interface WeeklySchedule {
  day: string
  focus: string
  drill_ids: string[]
  duration_minutes: number
  notes?: string
}

export interface TechniqueGuide {
  id: string
  name: string
  stroke_type: StrokeType
  category: DrillCategory
  description: string
  videos: VideoReference[]
  key_points: KeyPoint[]
  common_mistakes: TechniqueMistake[]
  related_drill_ids: string[]
}

export interface KeyPoint {
  title: string
  description: string
}

export interface TechniqueMistake {
  mistake: string
  correction: string
  severity: 'leicht' | 'mittel' | 'schwer'
}

-- PingCoach DB-Schema
-- Geteilte Supabase-Instanz: alle Tabellen mit pc_ Prefix
-- Region: eu-central-1 (Frankfurt)

-- ============================================================
-- PROFILES (erweitert auth.users)
-- ============================================================
CREATE TABLE pc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  player_type TEXT CHECK (player_type IN ('angreifer', 'allrounder', 'abwehr', 'unbekannt')) DEFAULT 'unbekannt',
  playing_hand TEXT CHECK (playing_hand IN ('rechts', 'links')) DEFAULT 'rechts',
  grip_style TEXT CHECK (grip_style IN ('shakehand', 'penholder')) DEFAULT 'shakehand',
  level TEXT CHECK (level IN ('anfaenger', 'fortgeschritten', 'vereinsspieler', 'leistungsspieler')) DEFAULT 'anfaenger',
  weaknesses TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  weekly_training_hours SMALLINT DEFAULT 2,
  club_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYSES (Video-Analyse-Ergebnisse)
-- ============================================================
CREATE TABLE pc_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stroke_type TEXT CHECK (stroke_type IN ('vorhand_topspin', 'rueckhand_topspin', 'vorhand_push', 'rueckhand_push', 'vorhand_block', 'rueckhand_block', 'vorhand_flip', 'rueckhand_flip', 'aufschlag', 'sonstiges')),
  pose_data JSONB NOT NULL,
  ai_feedback TEXT NOT NULL,
  ai_feedback_structured JSONB,
  overall_score SMALLINT CHECK (overall_score BETWEEN 0 AND 100),
  improvement_areas TEXT[] DEFAULT '{}',
  recommended_drill_ids UUID[] DEFAULT '{}',
  video_duration_seconds SMALLINT,
  analysis_type TEXT CHECK (analysis_type IN ('einzelschlag', 'sequenz', 'match')) DEFAULT 'einzelschlag',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_analyses_user ON pc_analyses(user_id, created_at DESC);

-- ============================================================
-- TRAINING SESSIONS (Trainingslog)
-- ============================================================
CREATE TABLE pc_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes SMALLINT,
  focus_areas TEXT[] DEFAULT '{}',
  drills_completed UUID[] DEFAULT '{}',
  notes TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_sessions_user ON pc_training_sessions(user_id, date DESC);

-- ============================================================
-- DRILLS (Drill-Bibliothek)
-- ============================================================
CREATE TABLE pc_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('vorhand', 'rueckhand', 'aufschlag', 'rueckschlag', 'beinarbeit', 'taktik', 'kondition', 'allgemein')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('anfaenger', 'mittel', 'fortgeschritten', 'profi')) NOT NULL,
  target_weakness TEXT[] DEFAULT '{}',
  duration_minutes SMALLINT DEFAULT 10,
  equipment_needed TEXT[] DEFAULT '{}',
  instructions JSONB NOT NULL,
  tips TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCH STATS (Spielstatistiken)
-- ============================================================
CREATE TABLE pc_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  opponent_name TEXT,
  result TEXT CHECK (result IN ('sieg', 'niederlage')) NOT NULL,
  sets_won SMALLINT DEFAULT 0,
  sets_lost SMALLINT DEFAULT 0,
  match_type TEXT CHECK (match_type IN ('liga', 'turnier', 'training', 'freundschaftsspiel')) DEFAULT 'training',
  notes TEXT,
  analysis_id UUID REFERENCES pc_analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pc_matches_user ON pc_match_stats(user_id, date DESC);

-- ============================================================
-- WAITLIST (Pre-Launch)
-- ============================================================
CREATE TABLE pc_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  player_level TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: User sieht nur eigenes Profil
ALTER TABLE pc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON pc_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON pc_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON pc_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON pc_profiles FOR DELETE
  USING (auth.uid() = id);

-- Analyses: User sieht nur eigene Analysen
ALTER TABLE pc_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON pc_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON pc_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON pc_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Training Sessions: User sieht nur eigene Sessions
ALTER TABLE pc_training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON pc_training_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON pc_training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON pc_training_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON pc_training_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Drills: Alle koennen lesen, nur Admin kann schreiben
ALTER TABLE pc_drills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view drills"
  ON pc_drills FOR SELECT
  USING (true);

-- Match Stats: User sieht nur eigene
ALTER TABLE pc_match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON pc_match_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
  ON pc_match_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
  ON pc_match_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches"
  ON pc_match_stats FOR DELETE
  USING (auth.uid() = user_id);

-- Waitlist: Jeder kann sich eintragen (public)
ALTER TABLE pc_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert waitlist"
  ON pc_waitlist FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_pingcoach_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pc_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_pingcoach_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_pingcoach_user();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.pc_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pc_profiles_updated_at
  BEFORE UPDATE ON pc_profiles
  FOR EACH ROW EXECUTE FUNCTION public.pc_handle_updated_at();

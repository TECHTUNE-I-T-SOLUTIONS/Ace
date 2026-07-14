-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  related_id UUID,
  related_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);

-- Create push_notification_tokens table
CREATE TABLE IF NOT EXISTS public.push_notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, token)
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS push_notification_tokens_user_id_idx ON public.push_notification_tokens(user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT false,
  study_reminders BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for push_notification_tokens
CREATE POLICY "Users can view their own push tokens" ON public.push_notification_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" ON public.push_notification_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" ON public.push_notification_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" ON public.push_notification_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for settings
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_push_notification_tokens_updated_at
  BEFORE UPDATE ON public.push_notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing RPC functions if they exist
DROP FUNCTION IF EXISTS public.upsert_push_token(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.insert_deadline_reminders();

-- RPC function to upsert push token
CREATE FUNCTION public.upsert_push_token(p_user_id UUID, p_token TEXT, p_platform TEXT DEFAULT 'android')
RETURNS UUID AS $$
DECLARE
  v_token_id UUID;
BEGIN
  INSERT INTO public.push_notification_tokens (user_id, token, platform)
  VALUES (p_user_id, p_token, p_platform)
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    platform = p_platform,
    updated_at = timezone('utc'::text, now())
  RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to insert deadline reminders
CREATE OR REPLACE FUNCTION insert_deadline_reminders()
RETURNS JSON AS $$
DECLARE
  v_count INTEGER := 0;
  v_notification_id UUID;
BEGIN
  -- Find assignments due within 24 hours
  FOR v_notification_id IN
    INSERT INTO public.notifications (user_id, title, body, type, category, related_id, related_type)
    SELECT 
      a.user_id,
      'Assignment Deadline Reminder' as title,
      'Your assignment "' || a.title || '" is due on ' || a.deadline_date as body,
      'reminder' as type,
      'assignment' as category,
      a.id as related_id,
      'assignment' as related_type
    FROM public.assignments a
    WHERE a.status = 'pending'
      AND a.deadline_date <= (CURRENT_DATE + INTERVAL '1 day')
      AND a.deadline_date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.related_id = a.id 
          AND n.related_type = 'assignment'
          AND n.created_at >= CURRENT_DATE
      )
    RETURNING id
  LOOP
    v_count := v_count + 1;
  END LOOP;

  -- Find tests due within 24 hours
  FOR v_notification_id IN
    INSERT INTO public.notifications (user_id, title, body, type, category, related_id, related_type)
    SELECT 
      t.user_id,
      'Test Reminder' as title,
      'Your test "' || t.title || '" is scheduled for ' || t.date as body,
      'reminder' as type,
      'test' as category,
      t.id as related_id,
      'test' as related_type
    FROM public.tests t
    WHERE t.date <= (CURRENT_DATE + INTERVAL '1 day')
      AND t.date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.related_id = t.id 
          AND n.related_type = 'test'
          AND n.created_at >= CURRENT_DATE
      )
    RETURNING id
  LOOP
    v_count := v_count + 1;
  END LOOP;

  -- Find exams due within 24 hours
  FOR v_notification_id IN
    INSERT INTO public.notifications (user_id, title, body, type, category, related_id, related_type)
    SELECT 
      e.user_id,
      'Exam Reminder' as title,
      'Your exam "' || e.title || '" is scheduled for ' || e.date as body,
      'reminder' as type,
      'exam' as category,
      e.id as related_id,
      'exam' as related_type
    FROM public.exams e
    WHERE e.date <= (CURRENT_DATE + INTERVAL '1 day')
      AND e.date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.related_id = e.id 
          AND n.related_type = 'exam'
          AND n.created_at >= CURRENT_DATE
      )
    RETURNING id
  LOOP
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-09-2025',
];

@Injectable()
export class AiService {
  constructor(private readonly supabase: SupabaseService) {}

  async threads(userId: string) {
    const { data } = await this.supabase.admin.from('ai_conversations').select('*').eq('user_id', userId).order('last_message_at', { ascending: false, nullsFirst: false });
    return data ?? [];
  }

  async thread(userId: string, threadId: string) {
    const { data } = await this.supabase.admin.from('ai_conversations').select('*').eq('user_id', userId).eq('id', threadId).maybeSingle();
    return data;
  }

  async saveThread(userId: string, threadId: string | null, title: string, messages: any[], summary?: string) {
    const payload = {
      id: threadId ?? undefined,
      user_id: userId,
      title,
      messages: messages.map((message, index) => ({
        ...message,
        timestamp: message.timestamp ?? new Date(Date.now() + index * 1000).toISOString(),
      })),
      summary: summary ?? messages[messages.length - 1]?.content ?? title,
      last_message_at: new Date().toISOString(),
    };
    const { data, error } = await this.supabase.admin.from('ai_conversations').upsert(payload).select().single();
    if (error) throw error;
    return data;
  }

  async archiveThread(userId: string, threadId: string) {
    const { data, error } = await this.supabase.admin.from('ai_conversations').update({ archived: true }).eq('user_id', userId).eq('id', threadId).select().single();
    if (error) throw error;
    return data;
  }

  async deleteThread(userId: string, threadId: string) {
    const { error } = await this.supabase.admin.from('ai_conversations').delete().eq('user_id', userId).eq('id', threadId);
    if (error) throw error;
    return { ok: true };
  }

  async context(userId: string) {
    const [profile, counts, notes, tasks, deadlines] = await Promise.all([
      this.supabase.admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
      this.supabase.admin.from('dashboard_counts').select('*').eq('user_id', userId).maybeSingle(),
      this.supabase.admin.from('notes').select('id,title,content,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      this.supabase.admin.from('tasks').select('id,title,status,priority').eq('user_id', userId).limit(5),
      this.supabase.admin.from('assignments').select('id,title,deadline_date,status').eq('user_id', userId).order('deadline_date', { ascending: true }).limit(5),
    ]);
    return { profile: profile.data, counts: counts.data, notes: notes.data ?? [], tasks: tasks.data ?? [], deadlines: deadlines.data ?? [] };
  }

  async chat(userId: string, message: string) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('Missing Gemini API key');
    const context = await this.context(userId);
    const prompt = `You are ACE, a helpful academic assistant.\nContext: ${JSON.stringify(context)}\nUser: ${message}`;

    for (const model of MODELS) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      });
      if (response.ok) {
        const json: any = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? 'No response';
        return { model, text, context };
      }
    }
    throw new Error('All Gemini fallback models failed');
  }
}

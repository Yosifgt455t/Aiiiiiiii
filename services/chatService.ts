
import { supabase } from './supabase';
import { ChatHistoryEntry, ChatMessage, PDFData } from '../types';

export const chatService = {
  async saveChat(userId: string, chat: ChatHistoryEntry) {
    if (!supabase) return null;

    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .upsert({
        id: chat.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? chat.id : undefined,
        user_id: userId,
        title: chat.title,
        pdf: chat.pdf,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (chatError) {
      console.error('Error saving chat:', chatError);
      return null;
    }

    // Save messages
    const messagesToSave = chat.messages.map(m => ({
      chat_id: chatData.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      image_url: m.imageUrl,
      generated_image_url: m.generatedImageUrl,
      generated_video_url: m.generatedVideoUrl,
      created_at: m.timestamp.toISOString()
    }));

    // Clear old messages and insert new ones (simple sync)
    await supabase.from('messages').delete().eq('chat_id', chatData.id);
    const { error: msgError } = await supabase.from('messages').insert(messagesToSave);

    if (msgError) {
      console.error('Error saving messages:', msgError);
    }

    return chatData.id;
  },

  async loadChats(userId: string): Promise<ChatHistoryEntry[]> {
    if (!supabase) return [];

    const { data: chats, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        messages (*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (chatError) {
      console.error('Error loading chats:', chatError);
      return [];
    }

    return (chats || []).map(c => ({
      id: c.id,
      title: c.title,
      pdf: c.pdf as PDFData | null,
      timestamp: c.updated_at,
      messages: (c.messages || []).sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).map((m: any) => ({
        role: m.role as 'user' | 'model',
        content: m.content,
        timestamp: new Date(m.created_at),
        mode: m.mode,
        imageUrl: m.image_url,
        generatedImageUrl: m.generated_image_url,
        generatedVideoUrl: m.generated_video_url
      }))
    }));
  },

  async deleteChat(chatId: string) {
    if (!supabase) return;
    await supabase.from('chats').delete().eq('id', chatId);
  }
};

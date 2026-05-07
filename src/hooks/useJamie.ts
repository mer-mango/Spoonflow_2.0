import { useCallback, useMemo, useState } from 'react'
import { JAMIE_SYSTEM_PROMPT } from '../lib/jamieSystemPrompt'
import { supabase } from '../lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string; createdAt: string }

export function useJamie(contentItemId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const persistConversation = useCallback(
    async (nextMessages: Message[]) => {
      if (!contentItemId) return
      await supabase.from('jamie_conversations').upsert({
        content_item_id: contentItemId,
        messages: nextMessages.slice(-20),
        updated_at: new Date().toISOString(),
      })
    },
    [contentItemId],
  )

  const sendMessage = useCallback(
    async (input: string, currentDraft: string) => {
      setIsLoading(true)
      try {
        const nextUserMessage: Message = { role: 'user', content: input, createdAt: new Date().toISOString() }
        const nextMessages = [...messages, nextUserMessage].slice(-20)
        setMessages(nextMessages)

        const payload = {
          system: JAMIE_SYSTEM_PROMPT,
          messages: [
            ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
            {
              role: 'user',
              content: `Current draft context:\n${currentDraft || '(empty draft)'}\n\nRespond to my last message.`,
            },
          ],
        }

        const { data, error } = await supabase.functions.invoke('claude-proxy', { body: payload })
        if (error) throw error

        const content = data?.content?.[0]?.text ?? 'No response returned.'
        const assistantMessage: Message = { role: 'assistant', content, createdAt: new Date().toISOString() }
        const finalMessages = [...nextMessages, assistantMessage].slice(-20)
        setMessages(finalMessages)
        await persistConversation(finalMessages)
        return assistantMessage
      } finally {
        setIsLoading(false)
      }
    },
    [messages, persistConversation],
  )

  const clearHistory = useCallback(() => setMessages([]), [])

  return useMemo(() => ({ sendMessage, messages, isLoading, clearHistory }), [sendMessage, messages, isLoading, clearHistory])
}

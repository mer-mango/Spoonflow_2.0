import { JamieWidget } from '../shared/JamieWidget'
import { useJamie } from '../../hooks/useJamie'

export function JamiePanel({
  contentItemId,
  draftText,
}: {
  contentItemId?: string
  draftText: string
}) {
  const { messages, isLoading, sendMessage } = useJamie(contentItemId)

  return (
    <JamieWidget
      messages={messages}
      isLoading={isLoading}
      draftText={draftText}
      onSend={async (text, currentDraft) => {
        await sendMessage(text, currentDraft)
      }}
    />
  )
}

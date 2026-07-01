import { ref } from 'vue'

export function useSSEStream() {
  const events = ref([])
  const isStreaming = ref(false)
  const error = ref(null)
  const summary = ref(null)
  let abortController = null

  function stop() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  async function start(endpoint, body) {
    events.value = []
    summary.value = null
    error.value = null
    isStreaming.value = true
    abortController = new AbortController()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.signal
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'La solicitud falló' }))
        error.value = data.error || 'La solicitud falló'
        isStreaming.value = false
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop()

        for (const part of parts) {
          const line = part.trim()
          if (line.startsWith('data: ')) {
            try {
              const evt = JSON.parse(line.slice(6))
              events.value.push(evt)
              if (evt.type === 'summary') summary.value = evt
              if (evt.type === 'error') error.value = evt.message
            } catch { /* ignore malformed */ }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') error.value = err.message
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  return { events, isStreaming, error, summary, start, stop }
}

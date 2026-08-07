import { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onMessage: (content: string, type: 'text' | 'voice') => void
  loading: boolean
  onModeChange?: (mode: 'text' | 'voice') => void
}

export default function VoiceRecorder({ onMessage, loading, onModeChange }: VoiceRecorderProps) {
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setIsRecording(true)

      let time = 0
      recordingIntervalRef.current = setInterval(() => {
        time += 1
        setRecordingTime(time)
        if (time >= 60) {
          stopRecording()
        }
      }, 1000)
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Please allow microphone access to use voice recording.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              audio: base64Audio
            })
          })

          if (!response.ok) throw new Error('Transcription failed')

          const data = await response.json()
          if (data.text) {
            onMessage(data.text, 'voice')
          }
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Transcription error:', error)
      alert('Failed to process audio. Please try again.')
    }
  }

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !loading) {
      onMessage(textInput.trim(), 'text')
      setTextInput('')
    }
  }

  return (
    <div className="input-area">
      <div className="mode-selector">
        <label htmlFor="input-mode" className="mode-label">Input Mode:</label>
        <select
          id="input-mode"
          value={mode}
          onChange={(e) => {
            const newMode = e.target.value as 'text' | 'voice'
            setMode(newMode)
            onModeChange?.(newMode)
          }}
          disabled={loading || isRecording}
          className="mode-dropdown"
        >
          <option value="text">Text</option>
          <option value="voice">Voice</option>
        </select>
      </div>

      {mode === 'text' ? (
        <form onSubmit={handleSendText} className="text-input-form">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="text-input"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !textInput.trim()}
            className="send-btn"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="voice-controls">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="voice-btn recording"
              title="Stop recording"
            >
              Stop ({recordingTime}s)
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={loading}
              className="voice-btn"
              title="Start voice recording"
            >
              Record Voice
            </button>
          )}
        </div>
      )}
    </div>
  )
}

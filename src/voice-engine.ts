/**
 * Zerfic Live — Audio & Speech Streaming Engine
 */

export interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  audioUrl?: string
  mood?: 'normal' | 'thinking' | 'happy' | 'wink' | 'celebrate'
  gesture?: 'none' | 'chair_sit' | 'waving_arms' | 'jump_and_float' | 'spread'
  timestamp: number
}

export class ZerficVoiceEngine {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null

  public isRecording = false
  public isSpeaking = false

  async startListening(onAudioLevel?: (level: number) => void): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.source = this.audioContext.createMediaStreamSource(this.stream)
      this.source.connect(this.analyser)

      this.audioChunks = []
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' })
      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.audioChunks.push(e.data)
      }
      this.mediaRecorder.start(250)
      this.isRecording = true

      if (onAudioLevel) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        const checkLevel = () => {
          if (!this.isRecording || !this.analyser) return
          this.analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
          const avg = sum / dataArray.length
          onAudioLevel(avg / 255)
          requestAnimationFrame(checkLevel)
        }
        checkLevel()
      }

      return true
    } catch (err) {
      console.error('Failed to start microphone:', err)
      return false
    }
  }

  async stopListening(): Promise<Blob | null> {
    return new Promise(resolve => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanupAudio()
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.cleanupAudio()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  private cleanupAudio() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop())
      this.stream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }

  async playSpeech(audioUrl: string, onEnd?: () => void): Promise<HTMLAudioElement> {
    this.isSpeaking = true
    const audio = new Audio(audioUrl)
    audio.onended = () => {
      this.isSpeaking = false
      if (onEnd) onEnd()
    }
    audio.onerror = () => {
      this.isSpeaking = false
      if (onEnd) onEnd()
    }
    await audio.play()
    return audio
  }
}

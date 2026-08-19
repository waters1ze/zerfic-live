import React, { useState, useRef, useEffect } from 'react'
import { ZerficMascot, ZerfikMood, ZerfikGesture } from './zerfic-mascot'
import { ZerficVoiceEngine, VoiceMessage } from './voice-engine'

export const ZerficLiveWidget: React.FC = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Привет! Я Зерфик. Можешь спросить меня о задачах, планах или просто поболтать!',
      mood: 'happy',
      gesture: 'waving_arms',
      timestamp: Date.now(),
    },
  ])

  const [mood, setMood] = useState<ZerfikMood>('happy')
  const [gesture, setGesture] = useState<ZerfikGesture>('waving_arms')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [selectedVoice, setSelectedVoice] = useState<'zerfik_original' | 'zerfik_intellect' | 'zerfik_coach'>('zerfik_original')
  const [isLoading, setIsLoading] = useState(false)

  const voiceEngineRef = useRef<ZerficVoiceEngine>(new ZerficVoiceEngine())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleStartTalk = async () => {
    if (isListening || isSpeaking || isLoading) return
    const ok = await voiceEngineRef.current.startListening(lvl => setAudioLevel(lvl))
    if (ok) {
      setIsListening(true)
      setMood('thinking')
      setGesture('none')
    }
  }

  const handleStopTalk = async () => {
    if (!isListening) return
    setIsListening(false)
    setIsLoading(true)

    const audioBlob = await voiceEngineRef.current.stopListening()
    if (!audioBlob) {
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'speech.webm')

      const res = await fetch('/api/extensions/zerfic-live/chat', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.error) {
        alert(data.error)
        setIsLoading(false)
        return
      }

      const userMsg: VoiceMessage = {
        id: 'u_' + Date.now(),
        role: 'user',
        text: data.transcript,
        timestamp: Date.now(),
      }

      const botMsg: VoiceMessage = {
        id: 'b_' + Date.now(),
        role: 'assistant',
        text: data.reply,
        mood: data.mood || 'normal',
        gesture: data.gesture || 'none',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, userMsg, botMsg])
      setMood(data.mood || 'normal')
      setGesture(data.gesture || 'none')

      // Synthesize and play voice
      const ttsRes = await fetch('/api/extensions/zerfic-live/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.reply, voiceId: selectedVoice }),
      })

      if (ttsRes.ok) {
        const audioBuf = await ttsRes.arrayBuffer()
        const audioBlobUrl = URL.createObjectURL(new Blob([audioBuf], { type: 'audio/mpeg' }))
        setIsSpeaking(true)
        await voiceEngineRef.current.playSpeech(audioBlobUrl, () => {
          setIsSpeaking(false)
        })
      }
    } catch (err) {
      console.error('Conversation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Zerfic Live</h3>
            <p className="text-xs text-slate-400">Живой разговорный голосовой компаньон</p>
          </div>
        </div>

        {/* Voice Selector */}
        <select
          value={selectedVoice}
          onChange={e => setSelectedVoice(e.target.value as any)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none"
        >
          <option value="zerfik_original">👨 Зерфик (Фирменный)</option>
          <option value="zerfik_intellect">🧠 Зерфик (Интеллект)</option>
          <option value="zerfik_coach">⚡ Зерфик (Драйв / Коуч)</option>
        </select>
      </div>

      {/* Mascot Animated Stage */}
      <div className="py-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/30 to-transparent border-b border-slate-800/40">
        <ZerficMascot
          mood={mood}
          gesture={gesture}
          isSpeaking={isSpeaking}
          isListening={isListening}
          audioLevel={audioLevel}
          size="lg"
          onClick={() => {
            if (gesture === 'chair_sit') setGesture('jump_and_float')
            else if (gesture === 'jump_and_float') setGesture('waving_arms')
            else setGesture('chair_sit')
          }}
        />
      </div>

      {/* Messages Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 animate-pulse">
              Зерфик думает...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Push-to-Talk Controls */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-center bg-slate-900/40">
        <button
          onMouseDown={handleStartTalk}
          onMouseUp={handleStopTalk}
          onTouchStart={handleStartTalk}
          onTouchEnd={handleStopTalk}
          disabled={isLoading || isSpeaking}
          className={`px-8 py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer select-none ${
            isListening
              ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
          }`}
        >
          {isListening ? '🔴 Слушаю вас... (Отпустите)' : '🎙️ Зажмите, чтобы говорить с Зерфиком'}
        </button>
      </div>
    </div>
  )
}

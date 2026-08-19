import React, { useState, useEffect } from 'react'

export type ZerfikMood = 'normal' | 'thinking' | 'happy' | 'wink' | 'celebrate'
export type ZerfikGesture = 'none' | 'chair_sit' | 'waving_arms' | 'jump_and_float' | 'spread'

interface ZerficMascotProps {
  mood?: ZerfikMood
  gesture?: ZerfikGesture
  isSpeaking?: boolean
  isListening?: boolean
  audioLevel?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

export const ZerficMascot: React.FC<ZerficMascotProps> = ({
  mood = 'normal',
  gesture = 'none',
  isSpeaking = false,
  isListening = false,
  audioLevel = 0,
  size = 'md',
  onClick,
}) => {
  const [waveStep, setWaveStep] = useState(0)

  useEffect(() => {
    if (gesture === 'waving_arms') {
      const interval = setInterval(() => setWaveStep(p => (p + 1) % 4), 180)
      return () => clearInterval(interval)
    }
  }, [gesture])

  const dimensions = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-64 h-64',
  }[size]

  return (
    <div
      onClick={onClick}
      className={`relative ${dimensions} flex items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95`}
    >
      {/* Background Aura Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
          isSpeaking
            ? 'bg-amber-500/40 scale-125 animate-pulse'
            : isListening
            ? 'bg-sky-500/40 scale-115 animate-ping'
            : 'bg-primary/20 scale-100'
        }`}
      />

      {/* Main Mascot Container */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-500 ${
          gesture === 'jump_and_float'
            ? 'animate-bounce -translate-y-4'
            : gesture === 'chair_sit'
            ? 'translate-y-2'
            : ''
        }`}
      >
        {/* Chair Element if sitting */}
        {gesture === 'chair_sit' && (
          <div className="absolute -bottom-2 z-0 w-24 h-16 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl flex items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🪑 Zerf Chair</span>
          </div>
        )}

        {/* Mascot Face & Body */}
        <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-amber-500 via-orange-400 to-amber-300 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-2 border-amber-200/60">
          {/* Eyes */}
          <div className="flex items-center gap-3 mb-1.5">
            <div
              className={`w-3.5 h-4 bg-slate-950 rounded-full transition-all duration-200 ${
                mood === 'wink' ? 'scale-y-25' : isListening ? 'scale-125' : ''
              }`}
            />
            <div
              className={`w-3.5 h-4 bg-slate-950 rounded-full transition-all duration-200 ${
                mood === 'happy' ? 'scale-y-50' : ''
              }`}
            />
          </div>

          {/* Mouth (Reactive speaking animation) */}
          <div
            className={`bg-slate-950 rounded-full transition-all duration-150 ${
              isSpeaking
                ? `w-4 h-${Math.max(2, Math.min(5, Math.floor(audioLevel * 10)))} rounded-full`
                : mood === 'happy' || mood === 'celebrate'
                ? 'w-4 h-2 rounded-b-full'
                : 'w-2.5 h-1'
            }`}
          />
        </div>

        {/* Arms with waving animation */}
        <div className="absolute w-28 flex items-center justify-between pointer-events-none">
          <div
            className={`w-4 h-8 bg-amber-400 rounded-full shadow-md transition-transform duration-200 ${
              gesture === 'waving_arms'
                ? waveStep % 2 === 0
                  ? '-rotate-45 -translate-y-3'
                  : '-rotate-12 -translate-y-1'
                : gesture === 'spread'
                ? '-rotate-60 -translate-y-2'
                : 'rotate-0'
            }`}
          />
          <div
            className={`w-4 h-8 bg-amber-400 rounded-full shadow-md transition-transform duration-200 ${
              gesture === 'waving_arms'
                ? waveStep % 2 === 0
                  ? 'rotate-45 -translate-y-3'
                  : 'rotate-12 -translate-y-1'
                : gesture === 'spread'
                ? 'rotate-60 -translate-y-2'
                : 'rotate-0'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

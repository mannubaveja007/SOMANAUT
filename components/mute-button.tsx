"use client"

import { Volume2, VolumeX, VibrateOffIcon as VolumeOff } from "lucide-react"
import { useSoundContext } from "./sound-context"

export function MuteButton() {
  const { isMuted, toggleMute, isAudioReady } = useSoundContext()

  return (
    <button
      onClick={toggleMute}
      className={`z-50 text-white p-2 md:p-3 rounded-full transition-all duration-300 text-sm md:text-base ${
        isAudioReady ? "bg-black/50 hover:bg-black/70" : "bg-gray-600/50 hover:bg-gray-500/70"
      }`}
      title={!isAudioReady ? "Audio loading..." : isMuted ? "Unmute music" : "Mute music"}
    >
      {!isAudioReady ? (
        <VolumeOff size={20} className="md:w-6 md:h-6 opacity-50" />
      ) : isMuted ? (
        <VolumeX size={20} className="md:w-6 md:h-6" />
      ) : (
        <Volume2 size={20} className="md:w-6 md:h-6" />
      )}
    </button>
  )
}

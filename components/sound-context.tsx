"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

interface SoundContextType {
  isMuted: boolean
  toggleMute: () => void
  audio: HTMLAudioElement | null
  isAudioReady: boolean
  initializeAudio: () => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [userHasInteracted, setUserHasInteracted] = useState(false)

  // Función para inicializar el audio después de la interacción del usuario
  const initializeAudio = useCallback(() => {
    if (!userHasInteracted) {
      setUserHasInteracted(true)

      // En móviles, intentamos reproducir inmediatamente después de la interacción
      if (audio && isAudioReady && !isMuted) {
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Error playing audio after interaction:", error)
          })
        }
      }
    }
  }, [userHasInteracted, audio, isAudioReady, isMuted])

  // Crear el elemento de audio una sola vez
  useEffect(() => {
    const audioElement = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Interstellar%20%20Hans%20Zimmer%20%20Partitura%2C%20midi%2C%20mp3-Osj8jhjGoFl4jFiSfR4n8biW3BcbHr.mp3")
    audioElement.loop = true
    audioElement.volume = 0.3
    audioElement.preload = "auto"

    // Eventos para detectar cuando el audio está listo
    const handleCanPlay = () => {
      console.log("Audio ready to play")
      setIsAudioReady(true)

      // Si el usuario ya interactuó, intentamos reproducir
      if (userHasInteracted && !isMuted) {
        const playPromise = audioElement.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Error playing audio after load:", error)
          })
        }
      }
    }

    const handleError = (e: any) => {
      console.warn("Error loading background music:", e)
      setIsAudioReady(false)
    }

    audioElement.addEventListener("canplaythrough", handleCanPlay)
    audioElement.addEventListener("error", handleError)

    setAudio(audioElement)

    // Limpieza
    return () => {
      audioElement.removeEventListener("canplaythrough", handleCanPlay)
      audioElement.removeEventListener("error", handleError)
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
    }
  }, [userHasInteracted, isMuted])

  // Manejar la reproducción/pausa del audio de forma persistente
  useEffect(() => {
    if (!audio) return

    if (isMuted) {
      audio.pause()
    } else if (userHasInteracted && isAudioReady) {
      // Solo intentar reproducir si el usuario ya interactuó y el audio está listo
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Audio playback was prevented:", error)
        })
      }
    }
  }, [audio, isMuted, isAudioReady, userHasInteracted])

  // Detectar la primera interacción del usuario en toda la aplicación
  useEffect(() => {
    if (userHasInteracted) return

    const handleFirstInteraction = () => {
      console.log("First interaction detected")
      setUserHasInteracted(true)
    }

    // Escuchar varios tipos de eventos de interacción
    const events = ["click", "touchstart", "keydown", "touchend"]
    events.forEach((event) => {
      document.addEventListener(event, handleFirstInteraction, { once: true })
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleFirstInteraction)
      })
    }
  }, [userHasInteracted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Si no ha interactuado y está desmutando, marcar como interactuado
    if (!userHasInteracted) {
      setUserHasInteracted(true)
    }
  }

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        audio,
        isAudioReady,
        initializeAudio,
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundContext() {
  const context = useContext(SoundContext)
  if (context === undefined) {
    throw new Error("useSoundContext must be used within a SoundProvider")
  }
  return context
}

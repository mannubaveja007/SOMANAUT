"use client"

import { ChevronLeft, ChevronRight, Rocket } from "lucide-react"

interface MobileControlsProps {
  onMoveLeft: () => void
  onMoveRight: () => void
  onStopMove: () => void
  onLaunch: () => void
  rocketLaunched: boolean
  isVisible: boolean
}

export function MobileControls({
  onMoveLeft,
  onMoveRight,
  onStopMove,
  onLaunch,
  rocketLaunched,
  isVisible,
}: MobileControlsProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-between items-end px-4">
      {/* Movement Controls */}
      <div className="flex gap-4">
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            onMoveLeft()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            onStopMove()
          }}
          className="glass-button text-white p-4 rounded-full text-2xl transition-all duration-200 active:scale-95 select-none"
          style={{ touchAction: "none" }}
        >
          <ChevronLeft size={32} />
        </button>

        <button
          onTouchStart={(e) => {
            e.preventDefault()
            onMoveRight()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            onStopMove()
          }}
          className="glass-button text-white p-4 rounded-full text-2xl transition-all duration-200 active:scale-95 select-none"
          style={{ touchAction: "none" }}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Launch Button */}
      {!rocketLaunched && (
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            onLaunch()
          }}
          className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full text-2xl transition-all duration-200 active:scale-95 animate-pulse select-none"
          style={{ touchAction: "none" }}
        >
          <Rocket size={32} />
        </button>
      )}
    </div>
  )
}

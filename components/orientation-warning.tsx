"use client"

import { RotateCcw } from "lucide-react"

interface OrientationWarningProps {
  isVisible: boolean
}

export function OrientationWarning({ isVisible }: OrientationWarningProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center text-white p-8">
      <div className="text-center space-y-6">
        <div className="animate-bounce">
          <RotateCcw size={80} className="mx-auto text-blue-400" />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Rotate your device!</h2>
          <p className="text-lg text-gray-300">This game works best in landscape mode</p>
          <p className="text-sm text-gray-400">Turn your phone to continue playing</p>
        </div>

        <div className="mt-8 p-4 bg-blue-600/20 rounded-xl border border-blue-400/30">
          <p className="text-sm text-blue-200">📱 Enable auto-rotation on your device</p>
        </div>
      </div>
    </div>
  )
}

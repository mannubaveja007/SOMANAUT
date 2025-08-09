"use client"

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        {/* Inner ring */}
        <div className="absolute top-1 left-1 md:top-2 md:left-2 w-10 h-10 md:w-12 md:h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin animate-reverse"></div>
        {/* Center dot */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
      </div>
      <div className="ml-4 text-white font-space-grotesk">
        <div className="text-base md:text-lg font-semibold">Loading...</div>
        <div className="text-xs md:text-sm text-gray-400">Preparing the space adventure</div>
      </div>
    </div>
  )
}

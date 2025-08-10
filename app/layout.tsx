import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { SoundProvider } from "@/components/sound-context"
import { DynamicWeb3Provider } from "@/components/dynamic-web3-provider"
import { Toaster } from "@/components/ui/toaster"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "somanaut",
  description: "Space game inspired by Argentine astronaut Noe Castro",
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Meta tags para forzar orientación horizontal en móviles */}
        <meta name="screen-orientation" content="landscape" />
        <meta name="orientation" content="landscape" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${spaceGrotesk.variable} font-space-grotesk bg-black`}>
        <DynamicWeb3Provider>
          <SoundProvider>{children}</SoundProvider>
        </DynamicWeb3Provider>
        <Toaster />
      </body>
    </html>
  )
}

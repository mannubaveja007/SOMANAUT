import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { SoundProvider } from "@/components/sound-context"
import { Web3Provider } from "@/components/web3-provider"
import { Toaster } from "@/components/ui/toaster"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "Noe to Space",
  description: "Space game inspired by Argentine astronaut Noe Castro",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.dev'
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
        <Web3Provider>
          <SoundProvider>{children}</SoundProvider>
        </Web3Provider>
        <Toaster />
      </body>
    </html>
  )
}

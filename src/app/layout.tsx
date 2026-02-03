import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ploxel 3D - Draw on Earth',
  description: 'Draw on Earth, Share with the World'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-space-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}

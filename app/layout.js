export const metadata = {
  title: 'Trading Journal',
  description: 'Trading Journal App',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

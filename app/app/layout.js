export const metadata = {
  title: 'Trading Journal',
  description: 'Track your trades',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900">{children}</body>
    </html>
  );
}

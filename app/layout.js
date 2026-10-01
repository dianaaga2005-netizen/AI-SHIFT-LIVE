import './globals.css';

export const metadata = {
  title: 'AI SHIFT LIVE',
  description: 'Интерактивная игра по управлению изменениями в эпоху ИИ'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

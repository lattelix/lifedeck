export function GET() {
  return Response.json(
    {
      name: 'LifeDeck Personal OS',
      short_name: 'LifeDeck',
      description: 'Private Personal OS for Today, Calendar, Capture, Protocols and Review.',
      start_url: '/os',
      scope: '/os',
      display: 'standalone',
      background_color: '#1E1E1E',
      theme_color: '#7C3AED',
      icons: [
        {
          src: '/favicon.ico',
          sizes: '256x256',
          type: 'image/x-icon',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'private, max-age=3600',
      },
    },
  );
}

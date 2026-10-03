import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeDeck Personal OS',
    short_name: 'LifeDeck',
    description: 'Private Personal OS for Today, Calendar, Capture, Protocols and Review.',
    start_url: '/os',
    scope: '/',
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
  };
}

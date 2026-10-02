import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeDeck Personal OS',
    short_name: 'LifeDeck',
    description: 'Private Personal OS for Today, Capture, Protocols and Review.',
    start_url: '/os',
    display: 'standalone',
    background_color: '#1E1E1E',
    theme_color: '#7C3AED',
  };
}

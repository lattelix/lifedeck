import { Profile } from '@/lib/types';

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
      <p className="text-lg text-gray-600 mb-4">{profile.tagline}</p>
      <p className="text-sm text-gray-400">
        Обновлено {new Date(profile.updatedAt).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  );
}

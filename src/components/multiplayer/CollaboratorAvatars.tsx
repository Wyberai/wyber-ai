'use client';
import { useEffect, useState, useRef } from 'react';
import { MultiplayerSession, Collaborator } from '@/lib/multiplayer/presence';

interface Props {
  projectId: string;
  userId: string;
  email: string;
}

function initials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

export function CollaboratorAvatars({ projectId, userId, email }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const sessionRef = useRef<MultiplayerSession | null>(null);

  useEffect(() => {
    if (!projectId || !userId) return;

    const session = new MultiplayerSession({
      projectId,
      userId,
      email,
      colorIndex: Math.floor(Math.random() * 7),
      onPresenceChange: (collabs) => {
        // Exclude self
        setCollaborators(collabs.filter(c => c.userId !== userId));
      },
    });

    session.join();
    sessionRef.current = session;

    return () => { session.leave(); };
  }, [projectId, userId, email]);

  if (collaborators.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {collaborators.slice(0, 5).map((c) => (
        <div
          key={c.userId}
          title={c.email}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: c.color, border: '2px solid var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: 'white',
            cursor: 'default', marginLeft: -6,
            boxShadow: `0 0 0 2px ${c.color}44`,
          }}
        >
          {initials(c.email)}
        </div>
      ))}
      {collaborators.length > 5 && (
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-muted)', marginLeft: -6 }}>
          +{collaborators.length - 5}
        </div>
      )}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
        {collaborators.length} online
      </span>
    </div>
  );
}

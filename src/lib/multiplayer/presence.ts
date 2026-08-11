import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Collaborator {
  userId: string;
  email: string;
  color: string;
  cursor?: { file: string; line: number; column: number };
  activeFile?: string;
  joinedAt: number;
}

const COLORS = ['#7C3AED','#059669','#D97706','#DC2626','#2563EB','#7C3AED','#DB2777'];

export class MultiplayerSession {
  private channel: RealtimeChannel | null = null;
  private supabase = createClient();
  private projectId: string;
  private userId: string;
  private email: string;
  private color: string;
  private _joinedAt = 0;   // stamped once at join(); reused on cursor/file updates
  private _leaving = false; // guards against leave() racing an in-flight join()
  private onPresenceChange: (collaborators: Collaborator[]) => void;

  constructor(opts: {
    projectId: string;
    userId: string;
    email: string;
    colorIndex: number;
    onPresenceChange: (collaborators: Collaborator[]) => void;
  }) {
    this.projectId = opts.projectId;
    this.userId = opts.userId;
    this.email = opts.email;
    this.color = COLORS[opts.colorIndex % COLORS.length];
    this.onPresenceChange = opts.onPresenceChange;
  }

  async join() {
    this._joinedAt = Date.now();
    this.channel = this.supabase.channel(`project:${this.projectId}`, {
      config: { presence: { key: this.userId } },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState<Collaborator>();
        this.onPresenceChange(Object.values(state).flat());
      })
      .on('presence', { event: 'join' }, () => {
        const state = this.channel!.presenceState<Collaborator>();
        this.onPresenceChange(Object.values(state).flat());
      })
      .on('presence', { event: 'leave' }, () => {
        const state = this.channel!.presenceState<Collaborator>();
        this.onPresenceChange(Object.values(state).flat());
      });

    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        if (this._leaving) return; // unmounted while subscribing — leave() handles cleanup
        await this.channel!.track({
          userId: this.userId,
          email: this.email,
          color: this.color,
          joinedAt: this._joinedAt,
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[multiplayer] channel ${status} for project:${this.projectId}`);
      }
    });

    // If leave() was called while we were awaiting subscribe, clean up now.
    if (this._leaving) await this.leave();
  }

  async updateCursor(file: string, line: number, column: number) {
    if (!this.channel) return;
    await this.channel.track({
      userId: this.userId,
      email: this.email,
      color: this.color,
      joinedAt: this._joinedAt,
      cursor: { file, line, column },
      activeFile: file,
    });
  }

  async updateActiveFile(file: string) {
    if (!this.channel) return;
    await this.channel.track({
      userId: this.userId,
      email: this.email,
      color: this.color,
      joinedAt: this._joinedAt,
      activeFile: file,
    });
  }

  async leave() {
    this._leaving = true;
    if (this.channel) {
      await this.channel.untrack();
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

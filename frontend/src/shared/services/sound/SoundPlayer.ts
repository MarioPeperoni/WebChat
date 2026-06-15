import { STORAGE_KEYS } from '@/shared/config';

export type SoundEvent =
  | 'messageReceived'
  | 'messageSent'
  | 'userJoined'
  | 'userLeft'
  | 'connect'
  | 'disconnect';

const SOUND_SOURCES: Record<SoundEvent, string> = {
  messageReceived: '/sounds/messageReceived.ogg',
  messageSent: '/sounds/messageSent.ogg',
  userJoined: '/sounds/userJoined.ogg',
  userLeft: '/sounds/userLeft.ogg',
  connect: '/sounds/connect.ogg',
  disconnect: '/sounds/disconnect.ogg',
};

const UNLOCK_EVENTS: ReadonlyArray<keyof DocumentEventMap> = [
  'pointerdown',
  'keydown',
  'touchstart',
];

class SoundPlayer {
  private readonly audios: Record<SoundEvent, HTMLAudioElement>;
  private unlocked = false;

  constructor() {
    this.audios = Object.fromEntries(
      (Object.entries(SOUND_SOURCES) as [SoundEvent, string][]).map(
        ([event, src]) => {
          const audio = new Audio(src);
          audio.preload = 'auto';
          return [event, audio];
        },
      ),
    ) as Record<SoundEvent, HTMLAudioElement>;

    this.installUnlock();
  }

  play(event: SoundEvent): void {
    if (this.isMuted()) return;
    const audio = this.audios[event];
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }

  isMuted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.soundMuted) === 'true';
  }

  setMuted(muted: boolean): void {
    localStorage.setItem(STORAGE_KEYS.soundMuted, String(muted));
  }

  private installUnlock(): void {
    const handler = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      for (const audio of Object.values(this.audios)) {
        audio.muted = true;
        void audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(() => {
            audio.muted = false;
          });
      }
      for (const evt of UNLOCK_EVENTS) {
        document.removeEventListener(evt, handler);
      }
    };
    for (const evt of UNLOCK_EVENTS) {
      document.addEventListener(evt, handler);
    }
  }
}

export const soundPlayer = new SoundPlayer();

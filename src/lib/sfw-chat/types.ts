export type ChatMode = 'nsfw' | 'sfw';

export interface ChatModeSettings {
  nsfwEnabled: boolean;
  sfwEnabled: boolean;
  defaultMode: ChatMode;
}

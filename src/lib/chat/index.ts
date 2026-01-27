export interface ChatAccess {
  hasAccess: boolean;
  canSendMessage: boolean;
  reason?: string;
  messagesRemaining?: number | null;
  unlockOptions: UnlockOption[];
  accessType: 'guest' | 'subscription' | 'paid_session' | 'free' | 'none';
  isLowMessages?: boolean;
  warningMessage?: string;
}

export interface UnlockOption {
  id: string;
  type: 'login' | 'subscribe' | 'paid_session' | 'extend_messages';
  label: string;
  name?: string;
  price?: number;
  cost?: number;
  costDisplay?: string;
  description?: string;
  messages?: number;
  recommended?: boolean;
}
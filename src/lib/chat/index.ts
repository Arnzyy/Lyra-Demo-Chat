export interface ChatAccess {
  hasAccess: boolean;
  canSendMessage: boolean;
  reason?: string;
  messagesRemaining?: number;
  unlockOptions?: UnlockOption[];
}

export interface UnlockOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  type?: string;
}
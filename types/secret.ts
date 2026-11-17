export interface SecureSecretMetadata {
  id: string;
  title: string;
  username?: string | null;
  sender: { id: string; name: string; email?: string } | null;
  recipient?: { id: string; name: string; email?: string } | null;
  conversation_id?: string | null;
  has_pin: boolean;
  expires_at: string;
  created_at?: string;
  viewed_at?: string | null;
  viewed_by?: { id: string; name: string } | null;
  is_destroyed: boolean;
  is_expired: boolean;
}

export interface RevealedSecretData {
  username?: string | null;
  password: string;
  notes?: string | null;
  is_destroyed: boolean;
}

export interface CreateSecretInput {
  title: string;
  username?: string;
  password: string;
  notes?: string;
  recipient_id?: string;
  conversation_id?: string;
  pin?: string;
  expires_in_hours?: number;
}

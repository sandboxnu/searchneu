export type NotificationType =
  | "seats_opened"
  | "seats_two_remaining"
  | "seats_one_remaining"
  | "waitlist_opened";

export interface Notif {
  id: number;
  term: string;
  sectionCrn: string;
  uid: string;
  method: string;
  count: number;
  limit: number;
  courseSubject: string;
  courseNumber: string;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
}

export interface TypedNotif {
  notif: Notif;
  type: NotificationType;
}

export interface NotificationProvider {
  send(to: string, message: string): Promise<void>;
  readonly method: string;
}

export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string, err?: unknown) => void;
}

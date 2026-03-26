export type NotificationType =
  | "seats_opened" // was 0, now > 0
  | "seats_two_remaining" // was > 2, now == 2
  | "seats_one_remaining" // was > 1, now == 1
  | "waitlist_opened"; // waitlist was 0, now > 0

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

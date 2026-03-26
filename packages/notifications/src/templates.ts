import type { Notif, NotificationType } from "./types";

function courseUrl(n: Notif): string {
  return `https://searchneu.com/catalog/${n.term}/${n.courseSubject}%20${n.courseNumber}`;
}

function courseLabel(n: Notif): string {
  return `${n.courseSubject} ${n.courseNumber} (CRN: ${n.sectionCrn})`;
}

const templates: Record<NotificationType, (n: Notif) => string> = {
  seats_opened: (n) =>
    `A seat opened up in ${courseLabel(n)}. Check it out at ${courseUrl(n)} !`,
  seats_two_remaining: (n) =>
    `Only 2 seats remaining in ${courseLabel(n)}. Check it out at ${courseUrl(n)} !`,
  seats_one_remaining: (n) =>
    `Only 1 seat remaining in ${courseLabel(n)}. Check it out at ${courseUrl(n)} !`,
  waitlist_opened: (n) =>
    `A waitlist seat has opened up in ${courseLabel(n)}. Check it out at ${courseUrl(n)} !`,
};

export function renderMessage(type: NotificationType, notif: Notif): string {
  return templates[type](notif);
}

/**
 * Automatic customer emails.
 *
 * Three daily jobs, all in UK time:
 *   07:00  reminder on the morning of the delivery
 *   09:00  reminder the day before the delivery
 *   10:00  thank-you (with a review request) the day after the hire
 *
 * Each send is claimed with an atomic stamp on the order first, so running two
 * instances — or re-running a job by hand — can never email the same customer
 * twice for the same event.
 */
import cron, { type ScheduledTask } from "node-cron";
import Order from "../modules/Order/order.model";
import {
  sendDeliveryReminderEmail,
  sendThankYouEmail,
} from "../modules/Order/email.service";
import type { IOrderDocument } from "../modules/Order/order.interface";

const TIMEZONE = "Europe/London";
const ACTIVE_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

/** The calendar day in the UK, as yyyy-mm-dd. */
const ukDay = (date: Date | string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

/** The UK calendar day `offset` days from now. */
const ukDayOffset = (offset: number): string => {
  const at = new Date(Date.now() + offset * 86400000);
  return ukDay(at);
};

/**
 * The day the hire starts: the earliest item start date. `estimatedDeliveryDate`
 * is only a fallback — the live checkout never sets it — and the order's own
 * creation date is the last resort.
 */
const deliveryDay = (order: IOrderDocument): string => {
  const starts = (order.items || [])
    .map((item: any) =>
      item?.startDate ? new Date(item.startDate).getTime() : 0,
    )
    .filter((time: number) => time > 0);
  const earliest = starts.length ? new Date(Math.min(...starts)) : null;
  return ukDay(earliest || order.estimatedDeliveryDate || order.createdAt);
};

/** The last day of the hire: the latest item end date. */
const hireEndDay = (order: IOrderDocument): string => {
  const ends = (order.items || [])
    .map((item: any) => (item?.endDate ? new Date(item.endDate).getTime() : 0))
    .filter((time: number) => time > 0);
  const latest = ends.length ? new Date(Math.max(...ends)) : null;
  return ukDay(latest || order.estimatedDeliveryDate || order.createdAt);
};

/**
 * Claim an order for one email: returns the order only if the stamp was not
 * already set, so exactly one caller ever gets it.
 */
const claim = async (
  id: unknown,
  field:
    | "deliveryReminderDayBeforeSentAt"
    | "deliveryReminderMorningSentAt"
    | "thankYouSentAt",
): Promise<IOrderDocument | null> =>
  (await Order.findOneAndUpdate(
    // `null` also matches documents where the field was never set.
    { _id: id, [field]: null } as any,
    { $set: { [field]: new Date() } },
    { new: true },
  )) as IOrderDocument | null;

/** Active orders whose hire starts on `day` (yyyy-mm-dd in the UK). */
const ordersDeliveringOn = async (day: string): Promise<IOrderDocument[]> => {
  const orders = (await Order.find({
    status: { $in: ACTIVE_STATUSES },
  })) as IOrderDocument[];
  return orders.filter((order) => deliveryDay(order) === day);
};

const runReminderFor = async (
  day: string,
  field: "deliveryReminderDayBeforeSentAt" | "deliveryReminderMorningSentAt",
  label: string,
): Promise<number> => {
  const orders = await ordersDeliveringOn(day);
  let sent = 0;
  for (const order of orders) {
    const claimed = await claim(order._id, field);
    if (!claimed) continue;
    await sendDeliveryReminderEmail(claimed);
    sent += 1;
  }
  console.log(`[CustomerEmailJob] ${label}: ${sent} reminder(s) sent`);
  return sent;
};

/** Active orders whose hire finished on `day`. */
const ordersFinishedOn = async (day: string): Promise<IOrderDocument[]> => {
  const orders = (await Order.find({
    status: { $in: ACTIVE_STATUSES },
  })) as IOrderDocument[];
  return orders.filter((order) => hireEndDay(order) === day);
};

export const sendDayBeforeReminders = () =>
  runReminderFor(ukDayOffset(1), "deliveryReminderDayBeforeSentAt", "day before");

export const sendMorningReminders = () =>
  runReminderFor(ukDayOffset(0), "deliveryReminderMorningSentAt", "morning of");

export const sendThankYous = async (): Promise<number> => {
  const orders = await ordersFinishedOn(ukDayOffset(-1));
  let sent = 0;
  for (const order of orders) {
    const claimed = await claim(order._id, "thankYouSentAt");
    if (!claimed) continue;
    await sendThankYouEmail(claimed);
    sent += 1;
  }
  console.log(`[CustomerEmailJob] thank-you: ${sent} sent`);
  return sent;
};

const safely = async (label: string, run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    console.error(`[CustomerEmailJob] ${label} failed:`, error);
  }
};

let started = false;
let tasks: ScheduledTask[] = [];

/** Starts the three daily jobs. Safe to call more than once. */
export const startCustomerEmailJobs = (): void => {
  if (started) return;
  started = true;

  tasks = [
    cron.schedule(
      "0 7 * * *",
      () => void safely("morning reminder", sendMorningReminders),
      { timezone: TIMEZONE },
    ),
    cron.schedule(
      "0 9 * * *",
      () => void safely("day-before reminder", sendDayBeforeReminders),
      { timezone: TIMEZONE },
    ),
    cron.schedule(
      "0 10 * * *",
      () => void safely("thank-you", sendThankYous),
      { timezone: TIMEZONE },
    ),
  ];

  console.log(
    "[CustomerEmailJob] scheduled: 07:00 morning reminder, 09:00 day-before reminder, 10:00 thank-you (Europe/London)",
  );
};

export const stopCustomerEmailJobs = (): void => {
  tasks.forEach((task) => task.stop());
  tasks = [];
  started = false;
};

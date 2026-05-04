import type { Subscription, SubscriptionPlan } from "@prisma/client";

type ActiveSubscription = Subscription & {
  plan: SubscriptionPlan;
};

export type PlanPermissions = {
  canReserveWorkouts: boolean;
  monthlyWorkoutLimit: number | null;
  canRequestTrainer: boolean;
  hasPriorityBooking: boolean;
  label: string;
};

export function getPlanPermissions(plan: Pick<SubscriptionPlan, "name"> | null | undefined): PlanPermissions {
  const name = plan?.name.toLowerCase() ?? "";

  if (name.includes("elite")) {
    return {
      canReserveWorkouts: true,
      monthlyWorkoutLimit: null,
      canRequestTrainer: true,
      hasPriorityBooking: true,
      label: "Neomejeni treningi in rezervacija osebnega trenerja",
    };
  }

  if (name.includes("core")) {
    return {
      canReserveWorkouts: true,
      monthlyWorkoutLimit: 4,
      canRequestTrainer: false,
      hasPriorityBooking: false,
      label: "4 skupinski treningi v obdobju narocnine",
    };
  }

  if (name.includes("starter")) {
    return {
      canReserveWorkouts: false,
      monthlyWorkoutLimit: 0,
      canRequestTrainer: false,
      hasPriorityBooking: false,
      label: "Dostop do fitnesa brez rezervacij treningov",
    };
  }

  return {
    canReserveWorkouts: true,
    monthlyWorkoutLimit: 4,
    canRequestTrainer: false,
    hasPriorityBooking: false,
    label: "Rezervacije glede na izbrani paket",
  };
}

export function isSubscriptionActive(subscription: ActiveSubscription | null | undefined, now = new Date()) {
  return Boolean(
    subscription &&
      subscription.active &&
      subscription.status === "ACTIVE" &&
      subscription.endDate >= now,
  );
}

export function getActiveSubscription<T extends ActiveSubscription>(subscriptions: T[], now = new Date()) {
  return subscriptions.find((subscription) => isSubscriptionActive(subscription, now)) ?? null;
}

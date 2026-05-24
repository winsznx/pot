export const POT_STATUS = ["Active", "Withdrawn", "Refunded", "Cancelled"] as const;
export type PotStatus = (typeof POT_STATUS)[number];

export function potStatusLabel(status: number): PotStatus {
  return POT_STATUS[status] ?? ("Active" as PotStatus);
}

export function potStatusTone(status: number): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case 0:
      return "neutral";
    case 1:
      return "success";
    case 2:
      return "warning";
    case 3:
      return "danger";
    default:
      return "neutral";
  }
}

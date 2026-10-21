/** Flat delivery fee (R$ 8,00). Keep in sync with backend DELIVERY_FEE_CENTS. */
export const DELIVERY_FEE_CENTS = 800;

export function deliveryFeeCents(
  fulfillment: "PICKUP" | "DELIVERY"
): number {
  return fulfillment === "DELIVERY" ? DELIVERY_FEE_CENTS : 0;
}

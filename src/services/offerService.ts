import { money } from "@/src/services/billingService";
import type { Offer } from "@/src/types/offer";

export function offerConfirmation(offer: Offer) {
  return `Simulación completada: elegiste ${offer.name} por ${money(offer.price)}. No se realizó ningún cobro real.`;
}

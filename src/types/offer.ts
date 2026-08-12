export type OfferStatus = "locked" | "available" | "accepted" | "declined";

export type Offer = {
  name: string;
  price: number;
  duration: string;
  reason: string;
};

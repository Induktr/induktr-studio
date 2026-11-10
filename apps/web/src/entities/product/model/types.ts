export type ProductType =
  | 'UI_KIT'
  | 'CHEATSHEET_HIGH_LEVEL'
  | 'CHEATSHEET_LOW_LEVEL'
  | 'CONSULTATION_AUDIT';

export interface ProductItem {
  id: string;
  slug: string;
  title: string;
  type: ProductType;
  priceUsd: number;
  description: string;
}

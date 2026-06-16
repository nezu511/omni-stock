export interface History {
  id: number;
  itemId: number;
  actionType: string;
  amountChange: number;
  timestamp: string;
}

export interface Item {
  id: number;
  name: string;
  englishName: string | null;
  quantity: number;
  barcode: string | null;
  imageUrl: string | null;
  minThreshold: number;
  keywords: string | null;
  orderStatus: string;
  orderUrl: string | null;
  histories?: History[];
}


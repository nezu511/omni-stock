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
  unitPerBox: number;
  histories?: History[];
}

export interface ReagentRequest {
  id: number;
  reagentId: number;
  status: string;
  requestedBy: string | null;
  createdAt: string;
  updatedAt: string;
  reagent?: Reagent;
}

export interface Reagent {
  id: number;
  name: string;
  englishName: string | null;
  site_url: string | null;
  createdAt: string;
  requests: ReagentRequest[];
}


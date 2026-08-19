export interface History {
  id: number;
  itemId: number;
  actionType: string;
  amountChange: number;
  timestamp: string;
}

export interface HistoryWithItem extends History {
  item: { id: number; name: string; englishName: string | null };
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
  createdAt: string;
  histories?: History[];
}

export interface ReagentRequest {
  id: number;
  reagentId: number;
  status: string;
  requestedBy: string | null;
  quantity: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  reagent?: Reagent;
}

export interface Reagent {
  id: number;
  name: string;
  englishName: string | null;
  catalogNumber: string | null;
  site_url: string | null;
  createdAt: string;
  requests: ReagentRequest[];
}

export interface ReagentHistory {
  id: number;
  reagentId: number;
  actionType: string;
  requestedBy: string | null;
  quantity: number | null;
  note: string | null;
  timestamp: string;
}

export interface ReagentHistoryWithReagent extends ReagentHistory {
  reagent: { id: number; name: string; englishName: string | null };
}


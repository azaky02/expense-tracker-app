export type CustodyStatus = 'Open' | 'PartiallyReturned' | 'Closed';

export interface CustodyRecordRecord {
  id: string;
  personId: string;
  personName: string;
  reason: string | null;
  originalAmount: number;
  remainingAmount: number;
  status: CustodyStatus;
  receivedDate: string;
}

export interface CustodySettlementRecord {
  id: string;
  custodyRecordId: string;
  amount: number;
  date: string;
  note: string | null;
}

export interface CustodyRecordInput {
  personId: string;
  reason?: string | null;
  originalAmount: number;
  receivedDate: string;
}

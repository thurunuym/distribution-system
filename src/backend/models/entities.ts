export interface Route {
  id: number;
  name: string;
}

export interface Shop {
  id: number;
  name: string;
  address: string | null;
  route_id: number;
  route_name?: string;
}

export type InvoiceStatus = 'settled' | 'credit';

export interface Invoice {
  id: number;
  number: string;
  shop_id: number;
  date: string;
  total_amount: number;
  paid: number;
  status: InvoiceStatus;
  remarks: string | null;
  updated_at: string;
  due?: number;
}

export type PaymentType = 'cash' | 'cheque';

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  type: PaymentType;
  date: string;
  cheque_id: number | null;
}

export type ChequeStatus = 'pending' | 'paid' | 'returned';

export interface Cheque {
  id: number;
  invoice_id: number;
  cheque_no: string;
  bank: string | null;
  amount: number;
  date_received: string;
  due_date: string | null;
  cleared_date: string | null;
  status: ChequeStatus;
  return_reason: string | null;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  number: string;
  shopId: number;
  date: string;
  totalAmount: number;
  remarks?: string;
  payments: {
    type: PaymentType;
    amount: number;
  }[];
  cheque?: {
    chequeNo: string;
    bank: string;
    amount: number;
    dateReceived: string;
    dueDate: string;
  };
}

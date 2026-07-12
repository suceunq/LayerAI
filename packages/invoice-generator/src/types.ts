export type CompanyLegalStatus = "auto-entrepreneur" | "entreprise-individuelle" | "societe";

export interface CompanyInfo {
  legalStatus: CompanyLegalStatus;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  siret: string;
  /** Only meaningful for legalStatus "societe" - RCS registration city. */
  rcsCity?: string;
  /** Only meaningful for legalStatus "societe". */
  capitalSocial?: string;
  vatApplicable: boolean;
  vatNumber?: string;
  vatRatePercent: number;
  email?: string;
  phone?: string;
  iban?: string;
  paymentTermsDays: number;
  invoicePrefix: string;
}

export interface ClientInfo {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceHt: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  company: CompanyInfo;
  client: ClientInfo;
  lineItems: InvoiceLineItem[];
  notes?: string;
}

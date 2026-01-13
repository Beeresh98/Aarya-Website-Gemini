
export interface Department {
  id: string;
  name: string;
  departmentCode: string;
}

export interface Employee {
  id: string; // Firestore document ID
  employeeCode: string; // User-facing unique ID
  firstName: string;
  lastName: string;
  departmentId: string; // Link to Department ID
  baseSalary: number;
  status: 'Active' | 'Inactive';
}

export interface Holiday {
  id:string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface Payment {
  id: string;
  employeeId: string;
  type: 'Advance' | 'Incentive' | 'Deduction';
  amount: number;
  date: string; // YYYY-MM-DD
  description: string; // Notes
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LEAVE = 'Leave',
  HOLIDAY = 'Holiday',
  WEEKEND = 'Weekend'
}

export type AttendanceRecord = {
  [employeeId: string]: AttendanceStatus;
};

// Production Module Types
export interface FilmType {
  id:string;
  code: string; // e.g., "FT-001"
  name: string; // Auto-generated: e.g. "250MM-25MIC-MILKYWHITE"
  size: string; // e.g., "250 MM"
  micron: number; // e.g., 25
  color: string; // e.g., "Milky White"
  description?: string;
  packagingWeight: number; // in kg
  unitsInBox: number;
}

export interface FilmItem {
  id: string; // Firestore document ID
  uniqueBoxId: string; // Auto-generated, e.g. FT-001/B01
  filmTypeId: string;
  manufacturingDate: string; // YYYY-MM-DD
  boxNumber: string;
  grossWeight: number; // in kg
  netWeight: number; // in kg, calculated (grossWeight - filmType.packagingWeight)
  status: 'In Stock' | 'Allocated' | 'Sold';
}

export interface Client {
  id: string; // Firestore document ID
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  openingBalance?: number;
}

export interface BillItem {
  itemId: string; // ID from FilmItem
  filmTypeId: string;
  uniqueBoxId: string;
  boxNumber: string;
  netWeight: number;
}

export interface Bill {
  id: string; // Firestore document ID
  billNumber: string; // Auto-generated, e.g., BILL-001
  clientId: string;
  date: string; // YYYY-MM-DD
  items?: BillItem[];
  totalWeight?: number;
  rates?: { [filmTypeId: string]: number }; // rate per kg for each film type
  subTotal?: number; // Sum of items (weight * rate)
  freight?: number; // Added charge
  discount?: number; // Deducted amount
  totalAmount: number; // Final payable: subTotal + freight - discount
  status: 'Generated' | 'Dispatched' | 'Paid' | 'Cancelled';
  isManual?: boolean;
  type?: 'System' | 'Manual';
  description?: string;
}

export interface LedgerPayment {
    id: string;
    clientId: string;
    date: string; // YYYY-MM-DD
    amount: number;
    method: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Other';
    notes?: string;
}

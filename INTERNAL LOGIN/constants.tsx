
import React from 'react';
import { UsersIcon, CalendarIcon, CurrencyDollarIcon, CreditCardIcon, GiftIcon, InformationCircleIcon, BriefcaseIcon, ChartBarIcon } from './components/icons/Icons';

export interface NavItemType {
  id: 'employees' | 'attendance' | 'payroll' | 'payments' | 'holidays' | 'rules' | 'contractors' | 'reports';
  label: string;
  // Fix: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
  disabled?: boolean;
  soon?: boolean;
}

export const NAV_ITEMS: NavItemType[] = [
  { id: 'employees', label: 'Employees', icon: <UsersIcon /> },
  { id: 'attendance', label: 'Attendance', icon: <CalendarIcon /> },
  { id: 'payroll', label: 'Payroll', icon: <CurrencyDollarIcon /> },
  { id: 'payments', label: 'Payments', icon: <CreditCardIcon /> },
  { id: 'holidays', label: 'Holidays', icon: <GiftIcon /> },
  { id: 'rules', label: 'Rules', icon: <InformationCircleIcon /> },
  { id: 'contractors', label: 'Contractors', icon: <BriefcaseIcon />, disabled: true, soon: true },
  { id: 'reports', label: 'Reports', icon: <ChartBarIcon />, disabled: true, soon: true },
];
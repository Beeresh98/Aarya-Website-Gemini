
import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, Holiday } from '../types';
import { AttendanceStatus } from '../types';

interface PayrollProps {
  employees: Employee[];
  attendance: Record<string, AttendanceRecord>;
  holidays: Holiday[];
}

const Payroll: React.FC<PayrollProps> = ({ employees, attendance, holidays }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const payrollData = useMemo(() => {
    const holidayDates = new Set(holidays.filter(h => h.date.startsWith(selectedMonth)).map(h => h.date));
    
    return employees.map(emp => {
      const dailyRate = emp.baseSalary / daysInMonth;
      let paidDays = 0;
      let absentDays = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        const date = new Date(dateStr);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        const dayOfWeek = date.getDay();
        const status = attendance[dateStr]?.[emp.id];

        const isHoliday = holidayDates.has(dateStr);
        const isSunday = dayOfWeek === 0;

        if (isHoliday || isSunday || status === AttendanceStatus.PRESENT || status === AttendanceStatus.LEAVE) {
            paidDays++;
        } else if (status === AttendanceStatus.ABSENT) {
            absentDays++;
        }
      }

      const grossPay = dailyRate * paidDays;

      return {
        ...emp,
        paidDays,
        absentDays,
        grossPay,
        netPay: grossPay, // Per PRD, Net Pay logic is not yet integrated with financials
      };
    });

  }, [selectedMonth, employees, attendance, holidays, daysInMonth]);

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium">Generate Payroll for:</h3>
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payrollData.map(data => (
                            <tr key={data.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${data.firstName} ${data.lastName}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{(data.baseSalary || 0).toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.paidDays} / {daysInMonth}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">{data.absentDays}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{data.grossPay.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{data.netPay.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  );
};

export default Payroll;


import React from 'react';

const RuleItem: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-primary-700 mb-2">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{children}</p>
    </div>
);

const Rules: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Application Business Logic</h2>
        
        <RuleItem title="Payroll Calculation">
            Gross Pay is calculated based on a daily rate (Base Salary divided by the total number of days in the month) multiplied by the number of paid days. Paid days include all days marked as 'Present' or 'Leave', all Sundays, and all company holidays listed in the Holidays module. Saturdays and days marked 'Absent' are considered unpaid.
        </RuleItem>

        <RuleItem title="Attendance Policy">
            Daily attendance is marked as 'Present', 'Absent', or 'Leave'. Official company holidays and all Sundays are automatically considered paid holidays. Saturdays are considered weekly off and are unpaid unless an employee is explicitly marked as 'Present'.
        </RuleItem>

        <RuleItem title="Employee Status">
            Employees can be 'Active' or 'Inactive'. Inactive employees are preserved in the system for historical records but are excluded from current attendance marking and payroll calculations.
        </RuleItem>

        <RuleItem title="Financial Transactions (Payments)">
            The Payments module tracks all non-salary financial transactions. This includes salary 'Advances', performance 'Incentives', and other 'Deductions'. These transactions are recorded but are not automatically factored into the current version of the Payroll module.
        </RuleItem>

    </div>
  );
};

export default Rules;
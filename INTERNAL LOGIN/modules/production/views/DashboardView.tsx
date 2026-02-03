import React from 'react';
import { FilmType, Client, Bill, LedgerPayment } from '../../types';

interface DashboardViewProps {
    bills: Bill[];
    clients: Client[];
    ledgerPayments: LedgerPayment[];
    filmTypes: FilmType[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ bills, clients, ledgerPayments }) => {
    // Basic Calculations
    const totalSales = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalReceipts = ledgerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstanding = totalSales - totalReceipts;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-2">₹{totalSales.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium">Total Receipts</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">₹{totalReceipts.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium">Outstanding</h3>
                    <p className="text-2xl font-bold text-rose-600 mt-2">₹{outstanding.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium">Total Clients</h3>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{clients.length}</p>
                </div>
            </div>

            {/* Recent Bills (Simplified) */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Bills</h3>
                <div className="space-y-3">
                    {bills.slice(0, 5).map(bill => {
                        const clientName = clients.find(c => c.id === bill.clientId)?.name || 'Unknown Client';
                        return (
                            <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-800">{bill.billNumber}</p>
                                    <p className="text-sm text-slate-500">{clientName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-slate-800">₹{bill.totalAmount.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{bill.date}</p>
                                </div>
                            </div>
                        )
                    })}
                    {bills.length === 0 && <p className="text-slate-500">No bills found.</p>}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;

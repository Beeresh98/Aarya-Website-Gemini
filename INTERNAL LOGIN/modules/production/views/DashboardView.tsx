
import React from 'react';
import { Bill, Client, LedgerPayment, FilmType } from '../../../types';
import { CurrencyDollarIcon, DocumentTextIcon, UsersIcon, TagIcon } from '../../../components/icons/Icons';

const DashboardView: React.FC<{ bills: Bill[], clients: Client[], ledgerPayments: LedgerPayment[], filmTypes: FilmType[] }> = ({ bills, clients, ledgerPayments, filmTypes }) => {
    // Simple dashboard implementation matching screenshot
    
    // Total Revenue: Sum of all PAID bills
    const paidBills = bills.filter(b => b.status === 'Paid');
    const totalRevenue = paidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // Outstanding: Pending + Dispatched
    const outstandingBills = bills.filter(b => b.status === 'Generated' || b.status === 'Dispatched');
    const totalOutstanding = outstandingBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // Active Clients: Count
    const activeClients = clients.length;

    // Stock Items: Film Type Count
    const stockItems = filmTypes.length;

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">Production Overview</h3>
            <p className="-mt-4 text-slate-500">Key metrics and performance indicators.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TOTAL REVENUE</p>
                        <p className="text-3xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
                        <div className="flex items-center mt-2 text-emerald-500 text-xs font-medium gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div> Paid bills
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CurrencyDollarIcon className="w-6 h-6" />
                    </div>
                </div>

                {/* Outstanding */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">OUTSTANDING</p>
                        <p className="text-3xl font-bold text-slate-800">₹{totalOutstanding.toLocaleString('en-IN')}</p>
                        <div className="flex items-center mt-2 text-amber-500 text-xs font-medium gap-1">
                            <div className="w-2 h-2 rounded-full bg-amber-400"></div> Pending + Dispatched
                        </div>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <DocumentTextIcon className="w-6 h-6" />
                    </div>
                </div>

                {/* Active Clients */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ACTIVE CLIENTS</p>
                        <p className="text-3xl font-bold text-slate-800">{activeClients}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                </div>

                {/* Stock Items */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">STOCK ITEMS</p>
                        <p className="text-3xl font-bold text-slate-800">{stockItems}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <TagIcon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;


import React, { useState, useMemo } from 'react';
import { Bill, Client, FilmType } from '../../../types';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants';
import { formatDate } from '../utils';
import { EllipsisVerticalIcon } from '../../../components/icons/Icons';
import { DropdownMenu } from '../components/ProductionModals';

const BillsView: React.FC<{ bills: Bill[], clients: Client[], filmTypes: FilmType[], onAction: (action: string, bill: Bill) => void, onEditRates: (bill: Bill) => void }> = ({ bills, clients, filmTypes, onAction, onEditRates }) => {
    const [filterStatus, setFilterStatus] = useState<string>('All');

    const filteredBills = useMemo(() => {
        if (filterStatus === 'All') return bills;
        return bills.filter(b => b.status === filterStatus);
    }, [bills, filterStatus]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700';
            case 'Dispatched': return 'bg-blue-100 text-blue-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-bold text-slate-800">Bills History</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                    {['All', 'Generated', 'Dispatched', 'Paid', 'Cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${filterStatus === s ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Mobile Card View */}
                <div className="md:hidden">
                    {filteredBills.map(bill => (
                        <div key={bill.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-slate-700 block">{bill.billNumber}</span>
                                    <span className="text-xs text-slate-500">{formatDate(bill.date)}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(bill.status)}`}>{bill.status}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-800">{clients.find(c => c.id === bill.clientId)?.name}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{bill.isManual ? 'MANUAL' : 'SYSTEM'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                <span className="text-lg font-bold text-slate-800">₹{(bill.totalAmount || 0).toLocaleString('en-IN')}</span>
                                <div className="relative">
                                    <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-slate-100 text-slate-400"><EllipsisVerticalIcon className="w-5 h-5" /></button>}>
                                        {(close) => (
                                            <>
                                                {bill.status === 'Generated' && (
                                                    <button onClick={() => { onAction('dispatch', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium">Mark Dispatched</button>
                                                )}
                                                {bill.status === 'Dispatched' && (
                                                    <button onClick={() => { onAction('pay', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium">Mark Paid</button>
                                                )}
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button onClick={() => { onAction('quotation', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-slate-50 font-medium">Download Quote</button>
                                                <button onClick={() => { onAction('checklist', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Download Checklist</button>
                                                <button onClick={() => { onEditRates(bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50">Edit Rates</button>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                {(bill.status === 'Generated' || bill.status === 'Dispatched') && (
                                                    <button onClick={() => { onAction('cancel', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel Bill</button>
                                                )}
                                                <button onClick={() => { onAction('delete', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete Bill</button>
                                            </>
                                        )}
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredBills.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No bills found</div>}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className={TABLE_HEAD_CLASS}>Bill #</th>
                                <th className={TABLE_HEAD_CLASS}>Date</th>
                                <th className={TABLE_HEAD_CLASS}>Client</th>
                                <th className={TABLE_HEAD_CLASS}>Type</th>
                                <th className={`${TABLE_HEAD_CLASS} text-right`}>Amount</th>
                                <th className={TABLE_HEAD_CLASS}>Status</th>
                                <th className={TABLE_HEAD_CLASS}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {filteredBills.map(bill => (
                                <tr key={bill.id} className={TABLE_ROW_CLASS}>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{bill.billNumber}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(bill.date)}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{clients.find(c => c.id === bill.clientId)?.name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{bill.isManual ? 'MANUAL' : 'SYSTEM'}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">₹{(bill.totalAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-sm"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(bill.status)}`}>{bill.status}</span></td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-slate-100 text-slate-400"><EllipsisVerticalIcon className="w-5 h-5" /></button>}>
                                            {(close) => (
                                                <>
                                                    {bill.status === 'Generated' && (
                                                        <button onClick={() => { onAction('dispatch', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium">Mark Dispatched</button>
                                                    )}
                                                    {bill.status === 'Dispatched' && (
                                                        <button onClick={() => { onAction('pay', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium">Mark Paid</button>
                                                    )}
                                                    <div className="border-t border-slate-100 my-1"></div>
                                                    <button onClick={() => { onAction('quotation', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-slate-50 font-medium">Download Quote</button>
                                                    <button onClick={() => { onAction('checklist', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Download Checklist</button>
                                                    {(bill.status === 'Generated' || bill.status === 'Dispatched') && (
                                                        <button onClick={() => { onAction('edit_details', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 font-medium">Edit Bill Items</button>
                                                    )}
                                                    <button onClick={() => { onEditRates(bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50">Edit Rates</button>
                                                    <div className="border-t border-slate-100 my-1"></div>
                                                    {(bill.status === 'Generated' || bill.status === 'Dispatched') && (
                                                        <button onClick={() => { onAction('cancel', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel Bill</button>
                                                    )}
                                                    <button onClick={() => { onAction('delete', bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete Bill</button>
                                                </>
                                            )}
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredBills.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No bills found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillsView;

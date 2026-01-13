
import React, { useState, useMemo } from 'react';
import { Client, Bill, LedgerPayment } from '../../../types';
import { PrinterIcon, ArrowLeftIcon } from '../../../components/icons/Icons';
import { formatDate, today } from '../utils';
import { INPUT_CLASS, SECONDARY_BTN, PRIMARY_BTN } from '../constants';
import { PrintLedgerModal } from '../components/PrintTemplates';

const LedgerView: React.FC<{
    clients: Client[];
    bills: Bill[];
    ledgerPayments: LedgerPayment[];
    onAddManualBill: (clientId: string) => void;
    onAddPayment: (clientId: string) => void;
    onEditManualBill: (bill: Bill) => void;
    onEditPayment: (payment: LedgerPayment) => void;
    onDeleteBill: (bill: Bill) => void;
    onDeletePayment: (id: string) => void;
}> = (props) => {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'detailed'>('monthly');
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ 
        start: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0], // April 1st of current year (approx)
        end: today 
    });
    const [showPrintModal, setShowPrintModal] = useState(false);

    const selectedClient = props.clients.find(c => c.id === selectedClientId);

    // 1. Unified Transaction List
    const allTransactions = useMemo(() => {
        if (!selectedClientId) return [];
        const clientBills = props.bills.filter(b => b.clientId === selectedClientId).map(b => ({ ...b, tType: 'BILL', dateStr: b.date }));
        const clientPayments = props.ledgerPayments.filter(p => p.clientId === selectedClientId).map(p => ({ ...p, tType: 'PAYMENT', dateStr: p.date }));
        
        // Sort Ascending for calculations
        return [...clientBills, ...clientPayments].sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
    }, [selectedClientId, props.bills, props.ledgerPayments]);

    // 2. Calculate Opening Balance BF (for Detailed View)
    const detailedViewData = useMemo(() => {
        if (!selectedClient) return { openingBalance: 0, transactions: [] };

        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime();

        let openingBalance = selectedClient.openingBalance || 0; // Positive = Debit/Receivable

        // Process transactions BEFORE start date to adjust opening balance
        const preTransactions = allTransactions.filter(t => new Date(t.dateStr).getTime() < start);
        preTransactions.forEach(t => {
            if (t.tType === 'BILL') openingBalance += (t.totalAmount || 0); // Debit increases receivable
            else openingBalance -= (t.amount || 0); // Credit decreases receivable
        });

        // Filter transactions within range
        const inRangeTransactions = allTransactions.filter(t => {
            const d = new Date(t.dateStr).getTime();
            return d >= start && d <= end;
        });

        return { openingBalance, transactions: inRangeTransactions };
    }, [allTransactions, dateRange, selectedClient]);

    // 3. Calculate Monthly Summary (for Monthly View)
    const monthlyData = useMemo(() => {
        if (!selectedClient) return [];
        
        const data: Record<string, { month: string, debit: number, credit: number, closing: number }> = {};
        let runningBalance = selectedClient.openingBalance || 0;

        // Group by Month-Year
        allTransactions.forEach(t => {
            const d = new Date(t.dateStr);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });

            if (!data[key]) data[key] = { month: monthLabel, debit: 0, credit: 0, closing: 0 };

            if (t.tType === 'BILL') {
                data[key].debit += (t.totalAmount || 0);
                runningBalance += (t.totalAmount || 0);
            } else {
                data[key].credit += (t.amount || 0);
                runningBalance -= (t.amount || 0);
            }
        });

        // Re-calculate running balance strictly chronologically to ensure accuracy
        let currentBalance = selectedClient.openingBalance || 0;
        const sortedKeys = Object.keys(data).sort();
        
        return sortedKeys.map(key => {
            currentBalance += data[key].debit - data[key].credit;
            return {
                ...data[key],
                closing: currentBalance,
                key // YYYY-MM for filtering
            };
        });

    }, [allTransactions, selectedClient]);

    const handleMonthClick = (monthKey: string) => {
        const [y, m] = monthKey.split('-');
        const year = parseInt(y);
        const month = parseInt(m) - 1; // JS months are 0-indexed
        
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
        
        setDateRange({ start: firstDay, end: lastDay });
        setViewMode('detailed');
    };

    const formatCurrency = (val: number) => Math.abs(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const getDrCr = (val: number) => val >= 0 ? 'Dr' : 'Cr';

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)]">
            {/* Left Sidebar: Client List */}
            <div className="lg:w-1/4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-64 lg:h-auto shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 uppercase text-xs tracking-wider">Select Account</div>
                <div className="overflow-y-auto flex-1">
                    {props.clients.map(c => (
                        <div key={c.id} onClick={() => { setSelectedClientId(c.id); setViewMode('monthly'); }} className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedClientId === c.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}>
                            <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{c.contactPerson}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Pane: Ledger Workspace */}
            <div className="lg:w-3/4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px] lg:h-auto">
                {selectedClient ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                                    {selectedClient.name}
                                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${((detailedViewData.openingBalance + detailedViewData.transactions.reduce((acc,t) => acc + (t.tType==='BILL'?(t.totalAmount||0):-(t.amount||0)), 0)) >= 0) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        Net: {formatCurrency((allTransactions.reduce((acc, t) => acc + (t.tType==='BILL'?(t.totalAmount||0):-(t.amount||0)), selectedClient.openingBalance || 0)))} {getDrCr((allTransactions.reduce((acc, t) => acc + (t.tType==='BILL'?(t.totalAmount||0):-(t.amount||0)), selectedClient.openingBalance || 0)))}
                                    </span>
                                </h3>
                                <p className="text-sm text-slate-500">{selectedClient.address} • {selectedClient.phone}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                {viewMode === 'detailed' && (
                                    <button onClick={() => setShowPrintModal(true)} className={`${SECONDARY_BTN} flex items-center gap-2 whitespace-nowrap`} title="Print Statement">
                                        <PrinterIcon className="w-4 h-4" /> <span className="hidden md:inline">Print</span>
                                    </button>
                                )}
                                <button onClick={() => props.onAddManualBill(selectedClient.id)} className="px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 transition-colors whitespace-nowrap">+ Bill</button>
                                <button onClick={() => props.onAddPayment(selectedClient.id)} className="px-4 py-2 text-sm font-medium bg-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-200 transition-colors whitespace-nowrap">+ Receipt</button>
                            </div>
                        </div>

                        {/* Controls & Breadcrumb */}
                        <div className="px-6 py-3 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                {viewMode === 'detailed' && (
                                    <button onClick={() => setViewMode('monthly')} className="flex items-center text-indigo-600 hover:underline font-medium">
                                        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Monthly
                                    </button>
                                )}
                                {viewMode === 'detailed' && <span className="text-slate-300">/</span>}
                                <span className="font-bold text-slate-700">{viewMode === 'monthly' ? 'Monthly Abstract' : 'Detailed Ledger'}</span>
                            </div>

                            {viewMode === 'detailed' && (
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="flex-1 md:flex-none px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <span className="text-slate-400 text-xs">to</span>
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="flex-1 md:flex-none px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
                            
                            {/* Monthly View */}
                            {viewMode === 'monthly' && (
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Month</th>
                                                <th className="px-4 py-3 text-right">Debit</th>
                                                <th className="px-4 py-3 text-right">Credit</th>
                                                <th className="px-4 py-3 text-right">Closing</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Opening Balance Row */}
                                            <tr className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium italic text-slate-500">Opening Balance</td>
                                                <td className="px-4 py-3 text-right text-slate-400">-</td>
                                                <td className="px-4 py-3 text-right text-slate-400">-</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-700">{formatCurrency(selectedClient.openingBalance || 0)} {getDrCr(selectedClient.openingBalance || 0)}</td>
                                            </tr>
                                            {/* Monthly Rows */}
                                            {monthlyData.map((m, idx) => (
                                                <tr key={idx} onClick={() => handleMonthClick(m.key)} className="hover:bg-indigo-50 cursor-pointer transition-colors group">
                                                    <td className="px-4 py-3 font-bold text-indigo-600 group-hover:underline">{m.month}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{m.debit ? `₹${formatCurrency(m.debit)}` : '-'}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600">{m.credit ? `₹${formatCurrency(m.credit)}` : '-'}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800">₹{formatCurrency(m.closing)} {getDrCr(m.closing)}</td>
                                                </tr>
                                            ))}
                                            {monthlyData.length === 0 && (
                                                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No transactions recorded yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Detailed View */}
                            {viewMode === 'detailed' && (
                                <>
                                    {/* Mobile Card Feed */}
                                    <div className="md:hidden space-y-3">
                                        <div className="bg-slate-100 p-3 rounded-lg text-sm font-bold text-slate-600 flex justify-between">
                                            <span>Opening Balance b/f</span>
                                            <span>{formatCurrency(detailedViewData.openingBalance)} {getDrCr(detailedViewData.openingBalance)}</span>
                                        </div>
                                        {detailedViewData.transactions.map((t, idx) => {
                                            const isBill = t.tType === 'BILL';
                                            
                                            // Calculate running balance locally for display
                                            const previousBalance = detailedViewData.openingBalance + detailedViewData.transactions.slice(0, idx).reduce((acc, prevT) => {
                                                return acc + (prevT.tType === 'BILL' ? (prevT.totalAmount || 0) : -(prevT.amount || 0));
                                            }, 0);
                                            const debit = isBill ? (t.totalAmount || 0) : 0;
                                            const credit = !isBill ? (t.amount || 0) : 0;
                                            const currentBalance = previousBalance + debit - credit;

                                            return (
                                                <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                                                    <div className="flex justify-between font-bold mb-1">
                                                        <span>{formatDate(t.dateStr)}</span>
                                                        <span className="text-slate-500 text-xs font-mono">{isBill ? t.billNumber : 'RCPT'}</span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <div className="font-medium text-slate-800">{isBill ? 'Sales Account' : t.method}</div>
                                                        <div className="text-xs text-slate-500 italic truncate">{t.description || t.notes || ''}</div>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase text-slate-400">Amount</span>
                                                            <span className={isBill ? 'text-slate-800 font-bold' : 'text-emerald-600 font-bold'}>
                                                                {isBill ? formatCurrency(debit) : formatCurrency(credit)}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] uppercase text-slate-400 block">Balance</span>
                                                            <span className="font-bold">{formatCurrency(currentBalance)} {getDrCr(currentBalance)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-50">
                                                         <button onClick={() => isBill ? props.onEditManualBill(t) : props.onEditPayment(t)} className="text-xs text-indigo-600 font-medium">Edit</button>
                                                         <button onClick={() => isBill ? props.onDeleteBill(t) : props.onDeletePayment(t.id)} className="text-xs text-red-600 font-medium">Delete</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {detailedViewData.transactions.length === 0 && (
                                            <div className="py-8 text-center text-slate-400 text-sm">No transactions in this period.</div>
                                        )}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 w-28">Date</th>
                                                    <th className="px-4 py-3">Particulars</th>
                                                    <th className="px-4 py-3 w-24">Vch Type</th>
                                                    <th className="px-4 py-3 w-24">Vch No.</th>
                                                    <th className="px-4 py-3 text-right w-32">Debit (₹)</th>
                                                    <th className="px-4 py-3 text-right w-32">Credit (₹)</th>
                                                    <th className="px-4 py-3 text-right w-32 bg-slate-50">Balance</th>
                                                    <th className="px-4 py-3 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {/* BF Balance Row */}
                                                <tr className="bg-slate-50/50 font-medium text-slate-600 italic">
                                                    <td className="px-4 py-3">{formatDate(dateRange.start)}</td>
                                                    <td className="px-4 py-3" colSpan={5}>Opening Balance b/f</td>
                                                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(detailedViewData.openingBalance)} {getDrCr(detailedViewData.openingBalance)}</td>
                                                    <td></td>
                                                </tr>

                                                {/* Transaction Rows */}
                                                {detailedViewData.transactions.map((t, idx) => {
                                                    const isBill = t.tType === 'BILL';
                                                    const debit = isBill ? (t.totalAmount || 0) : 0;
                                                    const credit = !isBill ? (t.amount || 0) : 0;
                                                    
                                                    const previousBalance = detailedViewData.openingBalance + detailedViewData.transactions.slice(0, idx).reduce((acc, prevT) => {
                                                        return acc + (prevT.tType === 'BILL' ? (prevT.totalAmount || 0) : -(prevT.amount || 0));
                                                    }, 0);
                                                    
                                                    const currentBalance = previousBalance + debit - credit;

                                                    return (
                                                        <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                            <td className="px-4 py-3 text-slate-600 font-medium">{formatDate(t.dateStr)}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-bold text-slate-700">{isBill ? 'To Sales Account' : `By ${t.method || 'Cash/Bank'}`}</div>
                                                                <div className="text-xs text-slate-400 italic">{t.description || t.notes || ''}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 text-xs uppercase font-bold tracking-wider">{isBill ? 'Sales' : 'Receipt'}</td>
                                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{isBill ? t.billNumber : '-'}</td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-700">{debit ? formatCurrency(debit) : ''}</td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-700">{credit ? formatCurrency(credit) : ''}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-slate-800 bg-slate-50/50 group-hover:bg-indigo-50/50">
                                                                {formatCurrency(currentBalance)} {getDrCr(currentBalance)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => isBill ? props.onEditManualBill(t) : props.onEditPayment(t)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                                                                    <button onClick={() => isBill ? props.onDeleteBill(t) : props.onDeletePayment(t.id)} className="text-xs text-red-600 hover:underline">Del</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {detailedViewData.transactions.length === 0 && (
                                                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No transactions in this period.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Render Print Modal */}
                        {showPrintModal && selectedClient && (
                            <PrintLedgerModal 
                                client={selectedClient}
                                transactions={detailedViewData.transactions}
                                dateRange={dateRange}
                                openingBalance={detailedViewData.openingBalance}
                                onClose={() => setShowPrintModal(false)}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl font-bold text-slate-300">←</span>
                        </div>
                        <p>Select a client from the list to view their ledger.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LedgerView;

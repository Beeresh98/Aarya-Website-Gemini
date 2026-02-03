
import React, { useState, useMemo, useEffect } from 'react';
import { Bill, Client, FilmType, FilmItem } from '../../../types';
import { TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants';
import { formatDate } from '../utils';
import { EllipsisVerticalIcon, ChevronUpIcon, ChevronDownIcon } from '../../../components/icons/Icons';
import { DropdownMenu } from '../components/ProductionModals';
import ViewBillDetailsModal from './ViewBillDetailsModal';

const BillsView: React.FC<{
    bills: Bill[],
    clients: Client[],
    filmTypes: FilmType[],
    inventory: FilmItem[],
    onAction: (action: string, bill: Bill) => void,
    onEditRates: (bill: Bill) => void
}> = ({ bills, clients, filmTypes, inventory, onAction, onEditRates }) => {
    // Filter States
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterClient, setFilterClient] = useState<string>('All');
    const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
    const [customDateFrom, setCustomDateFrom] = useState<string>('');
    const [customDateTo, setCustomDateTo] = useState<string>('');

    // Pagination States
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    // Sorting States
    const [sortField, setSortField] = useState<'billNumber' | 'date' | 'amount'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // View Bill Modal State
    const [viewBillModal, setViewBillModal] = useState<Bill | null>(null);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterClient, dateFilter, customDateFrom, customDateTo]);

    // Filtering and Sorting Logic
    const filteredAndSortedBills = useMemo(() => {
        let result = [...bills];

        // 1. Status Filter
        if (filterStatus !== 'All') {
            result = result.filter(b => b.status === filterStatus);
        }

        // 2. Client Filter
        if (filterClient !== 'All') {
            result = result.filter(b => b.clientId === filterClient);
        }

        // 3. Date Filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'daily') {
            result = result.filter(b => {
                const billDate = new Date(b.date);
                billDate.setHours(0, 0, 0, 0);
                return billDate.getTime() === today.getTime();
            });
        } else if (dateFilter === 'weekly') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            result = result.filter(b => new Date(b.date) >= weekAgo);
        } else if (dateFilter === 'monthly') {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            result = result.filter(b => new Date(b.date) >= monthStart);
        } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
            const from = new Date(customDateFrom);
            const to = new Date(customDateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(b => {
                const billDate = new Date(b.date);
                return billDate >= from && billDate <= to;
            });
        }

        // 4. Sorting
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === 'billNumber') {
                comparison = a.billNumber.localeCompare(b.billNumber);
            } else if (sortField === 'date') {
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            } else if (sortField === 'amount') {
                comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [bills, filterStatus, filterClient, dateFilter, customDateFrom, customDateTo, sortField, sortDirection]);

    // Pagination Logic
    const paginatedBills = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedBills.slice(startIndex, endIndex);
    }, [filteredAndSortedBills, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedBills.length / itemsPerPage);

    // Helper Functions
    const handleClearFilters = () => {
        setFilterStatus('All');
        setFilterClient('All');
        setDateFilter('all');
        setCustomDateFrom('');
        setCustomDateTo('');
        setCurrentPage(1);
    };

    const handleSortChange = (field: 'billNumber' | 'date' | 'amount') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700';
            case 'Dispatched': return 'bg-blue-100 text-blue-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const SortIcon = ({ field }: { field: 'billNumber' | 'date' | 'amount' }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUpIcon className="w-4 h-4 inline ml-1" /> :
            <ChevronDownIcon className="w-4 h-4 inline ml-1" />;
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        First
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    {startPage > 1 && <span className="text-slate-400">...</span>}
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    {endPage < totalPages && <span className="text-slate-400">...</span>}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Last
                    </button>
                </div>
                <div className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedBills.length)} of {filteredAndSortedBills.length} bills
                </div>
            </div>
        );
    };

    const activeFiltersCount = [
        filterStatus !== 'All',
        filterClient !== 'All',
        dateFilter !== 'all'
    ].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header and Filters */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-2xl font-bold text-slate-800">Bills History</h3>
                    {activeFiltersCount > 0 && (
                        <span className="text-sm text-slate-500">
                            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                        </span>
                    )}
                </div>

                {/* Status Filter */}
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

                {/* Client and Date Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Filter by Client</label>
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        >
                            <option value="All">All Clients</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Filter by Date</label>
                        <div className="flex gap-2">
                            {['all', 'daily', 'weekly', 'monthly', 'custom'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setDateFilter(filter as any)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all capitalize ${dateFilter === filter
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {filter === 'all' ? 'All' : filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">From Date</label>
                            <input
                                type="date"
                                value={customDateFrom}
                                onChange={(e) => setCustomDateFrom(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2">To Date</label>
                            <input
                                type="date"
                                value={customDateTo}
                                onChange={(e) => setCustomDateTo(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    if (customDateFrom && customDateTo) {
                                        setCurrentPage(1);
                                    }
                                }}
                                disabled={!customDateFrom || !customDateTo}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}

                {/* Clear Filters and Count */}
                <div className="flex justify-between items-center">
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={handleClearFilters}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            ✕ Clear All Filters
                        </button>
                    )}
                    <div className="ml-auto text-sm text-slate-500">
                        Showing {paginatedBills.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredAndSortedBills.length)} of {filteredAndSortedBills.length} bills
                    </div>
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Mobile Card View */}
                <div className="md:hidden">
                    {paginatedBills.map(bill => (
                        <div key={bill.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <button
                                        onClick={() => setViewBillModal(bill)}
                                        className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors block"
                                    >
                                        {bill.billNumber}
                                    </button>
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
                                                <button onClick={() => { setViewBillModal(bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium">View Details</button>
                                                <div className="border-t border-slate-100 my-1"></div>
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
                    {paginatedBills.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No bills found</div>}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th
                                    className={`${TABLE_HEAD_CLASS} cursor-pointer hover:bg-slate-100`}
                                    onClick={() => handleSortChange('billNumber')}
                                >
                                    Bill # <SortIcon field="billNumber" />
                                </th>
                                <th
                                    className={`${TABLE_HEAD_CLASS} cursor-pointer hover:bg-slate-100`}
                                    onClick={() => handleSortChange('date')}
                                >
                                    Date <SortIcon field="date" />
                                </th>
                                <th className={TABLE_HEAD_CLASS}>Client</th>
                                <th className={TABLE_HEAD_CLASS}>Type</th>
                                <th
                                    className={`${TABLE_HEAD_CLASS} text-right cursor-pointer hover:bg-slate-100`}
                                    onClick={() => handleSortChange('amount')}
                                >
                                    Amount <SortIcon field="amount" />
                                </th>
                                <th className={TABLE_HEAD_CLASS}>Status</th>
                                <th className={TABLE_HEAD_CLASS}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {paginatedBills.map(bill => (
                                <tr key={bill.id} className={TABLE_ROW_CLASS}>
                                    <td className="px-6 py-4 text-sm">
                                        <button
                                            onClick={() => setViewBillModal(bill)}
                                            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                        >
                                            {bill.billNumber}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(bill.date)}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{clients.find(c => c.id === bill.clientId)?.name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{bill.isManual ? 'MANUAL' : 'SYSTEM'}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">₹{(bill.totalAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 text-sm"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(bill.status)}`}>{bill.status}</span></td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        <DropdownMenu trigger={<button className="p-2 rounded-full hover:bg-slate-100 text-slate-400"><EllipsisVerticalIcon className="w-5 h-5" /></button>}>
                                            {(close) => (
                                                <>
                                                    <button onClick={() => { setViewBillModal(bill); close(); }} className="block w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium">View Details</button>
                                                    <div className="border-t border-slate-100 my-1"></div>
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
                            {paginatedBills.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No bills found</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {renderPagination()}
            </div>

            {/* View Bill Details Modal */}
            {viewBillModal && (
                <ViewBillDetailsModal
                    bill={viewBillModal}
                    client={clients.find(c => c.id === viewBillModal.clientId)}
                    filmTypes={filmTypes}
                    inventory={inventory}
                    onClose={() => setViewBillModal(null)}
                    onAction={onAction}
                    onEditRates={onEditRates}
                />
            )}
        </div>
    );
};

export default BillsView;

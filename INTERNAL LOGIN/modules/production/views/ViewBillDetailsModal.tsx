import React from 'react';
import Modal from '../../../components/Modal';
import { Bill, Client, FilmType, FilmItem, BillItem } from '../../../types';
import { formatDate } from '../utils';

interface ViewBillDetailsModalProps {
    bill: Bill;
    client: Client | undefined;
    filmTypes: FilmType[];
    inventory: FilmItem[];
    onClose: () => void;
    onAction: (action: string, bill: Bill) => void;
    onEditRates: (bill: Bill) => void;
}

const ViewBillDetailsModal: React.FC<ViewBillDetailsModalProps> = ({
    bill,
    client,
    filmTypes,
    inventory,
    onClose,
    onAction,
    onEditRates
}) => {
    // Group items by film type
    const groupedItems = bill.items?.reduce((acc, item) => {
        if (!acc[item.filmTypeId]) {
            acc[item.filmTypeId] = [];
        }
        acc[item.filmTypeId].push(item);
        return acc;
    }, {} as Record<string, BillItem[]>);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700';
            case 'Dispatched': return 'bg-blue-100 text-blue-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="border-b border-slate-200 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800">{bill.billNumber}</h2>
                            <p className="text-sm text-slate-500 mt-1">{formatDate(bill.date)}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getStatusStyle(bill.status)}`}>
                                {bill.status}
                            </span>
                            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">
                                {bill.isManual ? 'MANUAL' : 'SYSTEM'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Client Information */}
                {client && (
                    <div className="bg-slate-50 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Client Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Client Name</p>
                                <p className="text-sm font-semibold text-slate-800">{client.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Contact Person</p>
                                <p className="text-sm font-semibold text-slate-800">{client.contactPerson}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="text-sm font-semibold text-slate-800">{client.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Address</p>
                                <p className="text-sm font-semibold text-slate-800">{client.address}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bill Items */}
                {bill.items && bill.items.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Bill Items</h3>
                        <div className="space-y-4">
                            {Object.entries(groupedItems || {}).map(([filmTypeId, items]: [string, BillItem[]]) => {
                                const filmType = filmTypes.find(ft => ft.id === filmTypeId);
                                const rate = bill.rates?.[filmTypeId] || 0;
                                const groupTotal = items.reduce((sum, item) => sum + (item.netWeight * rate), 0);

                                return (
                                    <div key={filmTypeId} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-indigo-900">{filmType?.name || 'Unknown'}</span>
                                                <span className="text-sm text-indigo-700">Rate: ₹{rate.toFixed(2)}/kg</span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Box #</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Gross Wt (kg)</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Net Wt (kg)</th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {items.map((item, idx) => {
                                                        const inventoryItem = inventory.find(i => i.id === item.itemId);
                                                        const lineTotal = item.netWeight * rate;
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 text-sm text-slate-700">{item.boxNumber}</td>
                                                                <td className="px-4 py-2 text-sm text-right text-slate-700">
                                                                    {inventoryItem?.grossWeight.toFixed(2) || '-'}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-right font-semibold text-slate-800">
                                                                    {item.netWeight.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-right font-semibold text-slate-800">
                                                                    ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    <tr className="bg-indigo-50 font-bold">
                                                        <td className="px-4 py-2 text-sm text-right text-indigo-900">Group Total:</td>
                                                        <td className="px-4 py-2 text-sm text-right text-indigo-900">
                                                            {items.reduce((sum, item) => {
                                                                const invItem = inventory.find(i => i.id === item.itemId);
                                                                return sum + (invItem?.grossWeight || 0);
                                                            }, 0).toFixed(2)} kg
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right text-indigo-900">
                                                            {items.reduce((sum, item) => sum + item.netWeight, 0).toFixed(2)} kg
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right text-indigo-900">
                                                            ₹{groupTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Financial Summary */}
                <div className="bg-slate-50 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Financial Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Subtotal</span>
                            <span className="text-sm font-semibold text-slate-800">
                                ₹{(bill.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        {bill.freight && bill.freight > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Freight</span>
                                <span className="text-sm font-semibold text-green-600">
                                    + ₹{bill.freight.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        {bill.discount && bill.discount > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Discount</span>
                                <span className="text-sm font-semibold text-red-600">
                                    - ₹{bill.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-800">Total Amount</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                    ₹{(bill.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => { onAction('quotation', bill); onClose(); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                        Download Quote
                    </button>
                    <button
                        onClick={() => { onAction('checklist', bill); onClose(); }}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
                    >
                        Download Checklist
                    </button>
                    {(bill.status === 'Generated' || bill.status === 'Dispatched') && (
                        <button
                            onClick={() => { onAction('edit_details', bill); onClose(); }}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                        >
                            Edit Bill Items
                        </button>
                    )}
                    <button
                        onClick={() => { onEditRates(bill); onClose(); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                    >
                        Edit Rates
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm ml-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ViewBillDetailsModal;

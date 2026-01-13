
import React, { useState, useEffect, useMemo } from 'react';
import { Bill, FilmItem, FilmType } from '../../../types';
import { INPUT_CLASS, PRIMARY_BTN, SECONDARY_BTN, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '../constants';
import { PlusIcon, TrashIcon, SearchIcon, XMarkIcon } from '../../../components/icons/Icons';

interface EditBillDetailsModalProps {
    bill: Bill;
    inventory: FilmItem[];
    filmTypes: FilmType[];
    onClose: () => void;
    onSave: (
        billId: string,
        updatedItems: { id: string; pricePerKg: number; amount: number;[key: string]: any }[],
        addedItemIds: string[],
        removedItemIds: string[],
        financials: { totalWeight: number; subTotal: number; totalAmount: number; taxAmount: number }
    ) => Promise<void>;
    isSaving: boolean;
}

export const EditBillDetailsModal: React.FC<EditBillDetailsModalProps> = ({ bill, inventory, filmTypes, onClose, onSave, isSaving }) => {
    // State for tracking items
    const [currentItems, setCurrentItems] = useState<any[]>([]); // Items currently in the bill (including newly added)
    const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set()); // IDs of original items marked for removal
    const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set()); // IDs of new items added from inventory

    // State for "Add Item" picker
    const [selectedFilmType, setSelectedFilmType] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Initialize state from bill
    useEffect(() => {
        if (bill && bill.items) {
            setCurrentItems(bill.items.map(item => ({ ...item })));
        }
    }, [bill]);

    // Financial Calculations
    const financials = useMemo(() => {
        const activeItems = currentItems.filter(item => {
            const id = item.itemId || item.id;
            return !removedItemIds.has(id);
        });

        const totalWeight = activeItems.reduce((sum, item) => sum + (item.netWeight || 0), 0);
        const subTotal = activeItems.reduce((sum, item) => sum + (item.amount || 0), 0);

        // Calculate tax based on bill type logic (assuming 18% GST for now as per system default, or trying to infer from existing bill)
        // If the original bill had tax, we apply it. 
        // Logic: specific tax rate isn't stored in bill object usually, just totalAmount. 
        // We act conservatively: If bill.totalAmount > bill.subTotal, we assume GST.
        const hasTax = (bill.totalAmount || 0) > (bill.subTotal || 0);
        const taxRate = hasTax ? 0.18 : 0;
        const taxAmount = subTotal * taxRate;
        const totalAmount = subTotal + taxAmount;

        return { totalWeight, subTotal, taxAmount, totalAmount };
    }, [currentItems, removedItemIds, bill]);

    // Available Inventory for Picker
    const availableInventory = useMemo(() => {
        if (!selectedFilmType) return [];
        return inventory.filter(item =>
            item.filmTypeId === selectedFilmType &&
            item.status === 'In Stock' &&
            !addedItemIds.has(item.id) && // Don't show if already added
            (searchTerm === '' || item.boxNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [inventory, selectedFilmType, addedItemIds, searchTerm]);

    const handleRemoveItem = (docId: string, isOriginal: boolean) => {
        if (isOriginal) {
            // Mark original item for removal
            const newSet = new Set(removedItemIds);
            newSet.add(docId);
            setRemovedItemIds(newSet);
        } else {
            // Completely remove newly added item
            // We use docId (which is the inventory id) to filter
            setCurrentItems(prev => prev.filter(i => (i.itemId || i.id) !== docId));
            const newAdded = new Set(addedItemIds);
            newAdded.delete(docId);
            setAddedItemIds(newAdded);
        }
    };

    const handleRestoreItem = (docId: string) => {
        const newSet = new Set(removedItemIds);
        newSet.delete(docId);
        setRemovedItemIds(newSet);
    };

    const handleAddItem = (item: FilmItem) => {
        // Find packing weight to calculate net weight if needed
        const ft = filmTypes.find(f => f.id === item.filmTypeId);
        const pkgWeight = ft?.packagingWeight || 0;
        const netWeight = item.netWeight || (item.grossWeight - pkgWeight);

        // Determine rate. Try existing item or 0
        const existingItemOfSameType = currentItems.find(i =>
            i.filmTypeId === item.filmTypeId &&
            !removedItemIds.has(i.itemId || i.id)
        );
        const pricePerKg = existingItemOfSameType ? existingItemOfSameType.pricePerKg : 0;
        const amount = netWeight * pricePerKg;

        const newItem = {
            ...item,
            itemId: item.id, // Store doc ID explicitly
            uniqueBoxId: item.uniqueBoxId || item.id,
            netWeight,
            pricePerKg,
            amount
        };

        setCurrentItems(prev => [...prev, newItem]);
        setAddedItemIds(prev => new Set(prev).add(item.id));
    };

    const handleSave = () => {
        // Filter out removed items for the final list
        const finalItems = currentItems.filter(item => {
            const id = item.itemId || item.id;
            return !removedItemIds.has(id);
        });

        onSave(
            bill.id,
            finalItems,
            Array.from(addedItemIds),
            Array.from(removedItemIds),
            financials
        );
    };

    // Group items for display
    const groupedItems = useMemo(() => {
        const groups: Record<string, { name: string; items: typeof currentItems }> = {};
        const filmTypeMap = new Map(filmTypes.map(ft => [ft.id, ft.name]));

        currentItems.forEach(item => {
            const ftId = item.filmTypeId;
            if (!groups[ftId]) {
                groups[ftId] = {
                    name: filmTypeMap.get(ftId) || 'Unknown Size',
                    items: []
                };
            }
            groups[ftId].items.push(item);
        });

        // Sort items within groups numerically
        Object.values(groups).forEach(g => {
            g.items.sort((a, b) => {
                const numA = parseInt(a.boxNumber.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.boxNumber.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
        });

        return groups;
    }, [currentItems, filmTypes]);

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Edit Bill #{bill.billNumber}</h2>
                        <p className="text-slate-500 text-sm">Modify items, add new stock, or remove entries.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Current Items */}
                    <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Current Bill Items ({currentItems.filter(i => !removedItemIds.has(i.itemId || i.id)).length})</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Box No</th>
                                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Gross Wt</th>
                                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Net Wt</th>
                                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Rate (₹)</th>
                                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Amount</th>
                                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Object.keys(groupedItems).map((ftId) => {
                                        const group = groupedItems[ftId];
                                        // Filter out fully active items to show count in header
                                        const activeCount = group.items.filter(i => !removedItemIds.has(i.itemId || i.id)).length;

                                        if (group.items.length === 0) return null;

                                        return (
                                            <React.Fragment key={ftId}>
                                                <tr className="bg-slate-100">
                                                    <td colSpan={6} className="px-3 py-2 text-sm font-bold text-slate-700">
                                                        {group.name} ({activeCount} Boxes)
                                                    </td>
                                                </tr>
                                                {group.items.map(item => {
                                                    const itemId = item.itemId || item.id;
                                                    const isRemoved = removedItemIds.has(itemId);
                                                    const isNew = addedItemIds.has(itemId);

                                                    // Lookup inventory item for details if needed
                                                    const invItem = inventory.find(i => i.id === itemId);
                                                    const grossWt = item.grossWeight || invItem?.grossWeight || 0;

                                                    return (
                                                        <tr key={itemId} className={`${isRemoved ? 'bg-red-50 opacity-60' : isNew ? 'bg-emerald-50' : ''} hover:bg-slate-50 transition-colors`}>
                                                            <td className={`px-3 py-3 text-sm font-medium ${isRemoved ? 'line-through text-red-700' : 'text-slate-700'}`}>
                                                                {item.boxNumber}
                                                                {isNew && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">NEW</span>}
                                                            </td>
                                                            <td className="px-3 py-3 text-sm text-right text-slate-600">{grossWt ? grossWt.toFixed(2) : '-'}</td>
                                                            <td className="px-3 py-3 text-sm text-right text-slate-600">{item.netWeight?.toFixed(2)}</td>
                                                            <td className="px-3 py-3 text-sm text-right text-slate-600">
                                                                {item.pricePerKg}
                                                            </td>
                                                            <td className="px-3 py-3 text-sm text-right font-medium text-slate-800">₹{(item.amount || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-3 text-center">
                                                                {isRemoved ? (
                                                                    <button onClick={() => handleRestoreItem(itemId)} className="text-xs text-blue-600 hover:underline">Restore</button>
                                                                ) : (
                                                                    <button onClick={() => handleRemoveItem(itemId, !isNew)} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors">
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {currentItems.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <p>No items in this bill.</p>
                                </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">Total Weight:</span>
                                <span className="font-medium">{financials.totalWeight.toFixed(2)} kg</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">Subtotal:</span>
                                <span className="font-medium">₹{financials.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Tax {financials.taxAmount > 0 ? '(18%)' : '(0%)'}:</span>
                                <span className="font-medium">₹{financials.taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-200">
                                <span>Total:</span>
                                <span>₹{financials.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Add Items */}
                    <div className="w-full md:w-1/3 bg-white flex flex-col">
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                            <h3 className="font-bold text-indigo-900 mb-2">Add Stock to Bill</h3>

                            {/* Film Type Selector */}
                            <select
                                value={selectedFilmType}
                                onChange={(e) => setSelectedFilmType(e.target.value)}
                                className={`${INPUT_CLASS} mb-3`}
                            >
                                <option value="">Select Film Type...</option>
                                {filmTypes.map(ft => (
                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                ))}
                            </select>

                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Box No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`${INPUT_CLASS} pl-9`}
                                />
                                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                            {!selectedFilmType ? (
                                <div className="text-center p-8 text-slate-400 text-sm">Select a film type to browse stock.</div>
                            ) : availableInventory.length === 0 ? (
                                <div className="text-center p-8 text-slate-400 text-sm">No available stock found.</div>
                            ) : (
                                availableInventory.map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-300 transition-all">
                                        <div>
                                            <div className="font-medium text-slate-700">{item.boxNumber}</div>
                                            <div className="text-xs text-slate-500">Mfg: {item.manufacturingDate} • {item.netWeight}kg</div>
                                        </div>
                                        <button
                                            onClick={() => handleAddItem(item)}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-white rounded-b-2xl">
                    <button onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (currentItems.length - removedItemIds.size === 0)}
                        className={PRIMARY_BTN}
                    >
                        {isSaving ? 'Saving Changes...' : 'Save & Update Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
};

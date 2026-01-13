
import React, { useState, useMemo } from 'react';
import { FilmType, Client, FilmItem } from '../../../types';
import { INPUT_CLASS, PRIMARY_BTN, SECONDARY_BTN } from '../constants';
import { ArchiveBoxIcon, ChevronDownIcon, ChevronUpIcon } from '../../../components/icons/Icons';
import Modal from '../../../components/Modal';

// Helper to extract numeric value from box number strings (e.g., "Box 10" -> 10)
const getNumericBox = (str: string) => parseInt(str.replace(/\D/g, '')) || 0;

interface GroupedItem {
    type: FilmType | undefined;
    items: FilmItem[];
    weight: number;
}

const BillingView: React.FC<{ filmTypes: FilmType[], clients: Client[], inventory: FilmItem[], onCreateBill: (billData: any) => Promise<void> }> = ({ filmTypes, clients, inventory, onCreateBill }) => {
    // Advanced Billing Logic
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedFilmTypeId, setSelectedFilmTypeId] = useState('');
    const [targetWeight, setTargetWeight] = useState<string>('');
    const [strategy, setStrategy] = useState<'FIFO' | 'LIFO'>('FIFO');
    
    // Manual Selection Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualSearchTerm, setManualSearchTerm] = useState('');

    // Store selected items.
    const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, FilmItem>>(new Map<string, FilmItem>());

    // Billing Rates State: FilmTypeId -> Rate string
    const [rates, setRates] = useState<Record<string, string>>({});
    
    // Additional Charges
    const [freight, setFreight] = useState<string>('');
    const [discount, setDiscount] = useState<string>('');

    // Expanded groups in preview
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // 1. Filter Dropdown: Only show Film Types that have 'In Stock' items
    const stockAvailableFilmTypes = useMemo(() => {
        const stockedIds = new Set(inventory.filter(i => i.status === 'In Stock').map(i => i.filmTypeId));
        return filmTypes.filter(ft => stockedIds.has(ft.id));
    }, [filmTypes, inventory]);

    const availableInventory: FilmItem[] = useMemo(() => {
        if (!selectedFilmTypeId) return [];
        return inventory.filter(i => i.filmTypeId === selectedFilmTypeId && i.status === 'In Stock');
    }, [inventory, selectedFilmTypeId]);

    const availableWeight = useMemo(() => availableInventory.reduce((acc, i: FilmItem) => acc + (i.netWeight || 0), 0), [availableInventory]);

    const handleAutoSelect = () => {
        const target = parseFloat(targetWeight);
        if (!target || target <= 0) {
            alert("Please enter a valid target weight.");
            return;
        }

        // Sort based on strategy
        const sorted = [...availableInventory].sort((a, b) => {
            const dateA = new Date(a.manufacturingDate).getTime();
            const dateB = new Date(b.manufacturingDate).getTime();
            const boxA = getNumericBox(String(a.boxNumber));
            const boxB = getNumericBox(String(b.boxNumber));
            
            // Primary Sort: Date
            if (dateA !== dateB) {
                return strategy === 'FIFO' ? dateA - dateB : dateB - dateA;
            }

            // Secondary Sort: Box Number
            // FIFO: Smallest Box Number First (1, 2, 3)
            // LIFO: Largest Box Number First (100, 99, 98) - logic: last box made on that day
            return strategy === 'FIFO' ? boxA - boxB : boxB - boxA;
        });

        let currentWeight = 0;
        const newSelection = new Map(selectedItemsMap); 
        
        // Select items until target is reached
        for (const item of sorted) {
            if (currentWeight >= target) break;
            if (!newSelection.has(item.id)) {
                newSelection.set(item.id, item);
                currentWeight += item.netWeight;
            }
        }
        setSelectedItemsMap(newSelection);
    };

    const toggleItemSelection = (item: FilmItem) => {
        const newMap = new Map(selectedItemsMap);
        if (newMap.has(item.id)) {
            newMap.delete(item.id);
        } else {
            newMap.set(item.id, item);
        }
        setSelectedItemsMap(newMap);
    };

    // 2. Grouped Selection Data for Preview
    const groupedItems = useMemo<GroupedItem[]>(() => {
        const groups: Record<string, GroupedItem> = {};
        
        selectedItemsMap.forEach((item: FilmItem) => {
            if (!groups[item.filmTypeId]) {
                groups[item.filmTypeId] = {
                    type: filmTypes.find(ft => ft.id === item.filmTypeId),
                    items: [],
                    weight: 0
                };
            }
            groups[item.filmTypeId].items.push(item);
            groups[item.filmTypeId].weight += item.netWeight;
        });

        return Object.values(groups).map((g: GroupedItem) => {
            // Sort items numerically by box number inside the group
            g.items.sort((a, b) => getNumericBox(String(a.boxNumber)) - getNumericBox(String(b.boxNumber)));
            return g;
        });
    }, [selectedItemsMap, filmTypes]);

    // Calculate Totals dynamically
    const subTotal = groupedItems.reduce((acc: number, group: GroupedItem) => {
        const rateStr = rates[group.type?.id || ''];
        const rate = parseFloat(rateStr || '0');
        return acc + (group.weight * rate);
    }, 0);
    
    const freightVal = parseFloat(freight || '0');
    const discountVal = parseFloat(discount || '0');
    const grandTotal = subTotal + freightVal - discountVal;
    
    const totalBillWeight = groupedItems.reduce((acc, group) => acc + group.weight, 0);

    const toggleGroupExpand = (filmTypeId: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(filmTypeId)) newSet.delete(filmTypeId);
        else newSet.add(filmTypeId);
        setExpandedGroups(newSet);
    };

    const handleCreate = async () => {
        if (!selectedClient || selectedItemsMap.size === 0) return;
        
        // Prepare rates number map
        const finalRates: Record<string, number> = {};
        Object.entries(rates).forEach(([k, v]) => finalRates[k] = parseFloat(String(v)) || 0);

        const items: FilmItem[] = Array.from(selectedItemsMap.values());
        
        await onCreateBill({
            clientId: selectedClient,
            items: items.map(i => ({
                itemId: i.id,
                filmTypeId: i.filmTypeId,
                uniqueBoxId: i.uniqueBoxId,
                boxNumber: i.boxNumber,
                netWeight: i.netWeight
            })),
            totalWeight: totalBillWeight,
            rates: finalRates,
            subTotal: subTotal,
            freight: freightVal,
            discount: discountVal,
            totalAmount: grandTotal 
        });
        
        // Reset form
        setSelectedItemsMap(new Map());
        setTargetWeight('');
        setRates({});
        setFreight('');
        setDiscount('');
    };

    // Filtered inventory for manual selection modal
    const filteredManualInventory = useMemo(() => {
        let items = availableInventory;
        if (manualSearchTerm) {
            const lowerTerm = manualSearchTerm.toLowerCase();
            items = items.filter(i => i.boxNumber.toLowerCase().includes(lowerTerm));
        }
        return items.sort((a, b) => getNumericBox(String(a.boxNumber)) - getNumericBox(String(b.boxNumber)));
    }, [availableInventory, manualSearchTerm]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)]">
            {/* Left Column: Controls */}
            <div className="lg:w-1/3 space-y-6 flex flex-col">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CLIENT</label>
                        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className={INPUT_CLASS}>
                            <option value="">-- Select Client --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">FILM TYPE</label>
                        <select value={selectedFilmTypeId} onChange={e => setSelectedFilmTypeId(e.target.value)} className={INPUT_CLASS}>
                            <option value="">-- Select Film Type --</option>
                            {stockAvailableFilmTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
                        </select>
                        {selectedFilmTypeId && <p className="text-xs font-bold text-indigo-600 mt-2">Available: {availableWeight.toFixed(2)} kg</p>}
                    </div>

                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-indigo-800 uppercase">TARGET WEIGHT</label>
                            <label className="text-xs font-bold text-indigo-800 uppercase">STRATEGY</label>
                        </div>
                        <div className="flex gap-3">
                            <input 
                                type="number" 
                                placeholder="e.g. 500" 
                                value={targetWeight} 
                                onChange={e => setTargetWeight(e.target.value)} 
                                className="block w-full bg-white border border-indigo-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            />
                            <div className="flex bg-white rounded-lg border border-indigo-200 p-1 shrink-0">
                                <button onClick={() => setStrategy('FIFO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${strategy === 'FIFO' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>FIFO</button>
                                <button onClick={() => setStrategy('LIFO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${strategy === 'LIFO' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>LIFO</button>
                            </div>
                        </div>
                        <button onClick={handleAutoSelect} className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                            Auto Select
                        </button>
                    </div>
                </div>

                {/* Manual Selection Button */}
                {selectedFilmTypeId && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Manual Selection</h4>
                            <p className="text-xs text-slate-500 mt-1">Pick specific boxes from stock</p>
                        </div>
                        <button 
                            onClick={() => { setManualSearchTerm(''); setIsManualModalOpen(true); }} 
                            className={`${SECONDARY_BTN} border-indigo-200 text-indigo-700 hover:bg-indigo-50`}
                        >
                            Select Manually
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column: Preview (Grouped Layout) */}
            <div className="lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[500px] lg:h-auto">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-slate-800">Bill Preview</h3>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{selectedItemsMap.size} Items</span>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 space-y-4">
                    {groupedItems.length > 0 ? (
                        groupedItems.map(group => {
                            const filmTypeId = group.type?.id || 'unknown';
                            const rate = rates[filmTypeId] || '';
                            const groupAmount = group.weight * (parseFloat(rate) || 0);
                            const isExpanded = expandedGroups.has(filmTypeId);

                            return (
                                <div key={filmTypeId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Group Header */}
                                    <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800">{group.type?.name || 'Unknown Type'}</h4>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{group.items.length} Rolls</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Total Wt: <span className="font-bold text-slate-700">{group.weight.toFixed(2)} kg</span></p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400">RATE</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        min="0"
                                                        placeholder="0.00"
                                                        value={rate}
                                                        onChange={e => setRates({...rates, [filmTypeId]: e.target.value})}
                                                        className="w-24 px-2 py-1 text-right text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <p className="text-xs text-indigo-600 font-bold mt-1">₹ {groupAmount.toFixed(2)}</p>
                                            </div>
                                            <button 
                                                onClick={() => toggleGroupExpand(filmTypeId)}
                                                className="p-1 rounded hover:bg-slate-100 text-slate-400"
                                            >
                                                {isExpanded ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Group Items (Collapsible) */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-2">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-400 font-bold uppercase bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-2">Box No</th>
                                                        <th className="px-3 py-2">Date</th>
                                                        <th className="px-3 py-2 text-right">Weight</th>
                                                        <th className="w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {group.items.map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-3 py-2 font-mono text-slate-700 font-medium">{item.boxNumber}</td>
                                                            <td className="px-3 py-2 text-slate-500 text-xs">{item.manufacturingDate}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-slate-700">{item.netWeight.toFixed(2)}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <button onClick={() => toggleItemSelection(item)} className="text-slate-300 hover:text-red-500 font-bold text-lg leading-none">&times;</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <ArchiveBoxIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p>No items selected</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-600">Total Weight</span>
                        <span className="font-bold text-slate-800">{totalBillWeight.toFixed(2)} kg</span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-700">₹{subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-500">Freight (+)</span>
                            <input 
                                type="number" 
                                min="0" 
                                placeholder="0" 
                                value={freight}
                                onChange={e => setFreight(e.target.value)}
                                className="w-32 px-2 py-1 text-right text-sm border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-500">Discount (-)</span>
                            <input 
                                type="number" 
                                min="0" 
                                placeholder="0" 
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                className="w-32 px-2 py-1 text-right text-sm border border-slate-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <span className="text-lg font-bold text-slate-800">Grand Total</span>
                        <span className="text-2xl font-bold text-indigo-600">₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>

                    <button 
                        onClick={handleCreate} 
                        disabled={!selectedClient || selectedItemsMap.size === 0} 
                        className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-xl transition-all active:scale-[0.98] ${!selectedClient || selectedItemsMap.size === 0 ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                        Generate Bill
                    </button>
                </div>
            </div>

            {/* Manual Selection Modal */}
            {isManualModalOpen && (
                <Modal isOpen={true} onClose={() => setIsManualModalOpen(false)} title="Select Items Manually">
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Search by Box Number..." 
                            value={manualSearchTerm}
                            onChange={(e) => setManualSearchTerm(e.target.value)}
                            className={INPUT_CLASS}
                            autoFocus
                        />
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Select</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Box No</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredManualInventory.length > 0 ? (
                                        filteredManualInventory.map(item => (
                                            <tr 
                                                key={item.id} 
                                                onClick={() => toggleItemSelection(item)} 
                                                className={`cursor-pointer transition-colors ${selectedItemsMap.has(item.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-4 py-4 w-12">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedItemsMap.has(item.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                        {selectedItemsMap.has(item.id) && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm font-mono font-bold text-slate-700">{item.boxNumber}</td>
                                                <td className="px-4 py-4 text-sm text-slate-500">{item.manufacturingDate}</td>
                                                <td className="px-4 py-4 text-sm text-right font-bold text-slate-700">{item.netWeight.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                No items found matching "{manualSearchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-medium text-slate-600">Selected: {selectedItemsMap.size} items</span>
                            <button onClick={() => setIsManualModalOpen(false)} className={PRIMARY_BTN}>Done</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BillingView;

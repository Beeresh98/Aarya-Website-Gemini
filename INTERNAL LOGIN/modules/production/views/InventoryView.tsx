
import React, { useState, useMemo, useEffect } from 'react';
import { FilmType, FilmItem } from '../../../types';
import { CARD_CLASS, SECONDARY_BTN, PRIMARY_BTN, TABLE_HEAD_CLASS, TABLE_ROW_CLASS, BADGE_BASE } from '../constants';
import { formatDate } from '../utils';
import { ArrowLeftIcon, ArrowDownTrayIcon, CloudArrowUpIcon, ChevronUpIcon, ChevronDownIcon, PencilIcon, PlusIcon } from '../../../components/icons/Icons';
import { EditBoxModal } from '../components/ProductionModals';

export const InventoryDirectory: React.FC<{ filmTypes: FilmType[], inventory: FilmItem[], onSelect: (ft: FilmType) => void }> = ({ filmTypes, inventory, onSelect }) => {

    // Group films by size
    const sizeGroups = useMemo(() => {
        const groups = new Map<string, {
            size: string;
            filmTypes: FilmType[];
            totalBoxes: number;
            totalWeight: number;
        }>();

        filmTypes.forEach(ft => {
            // Default to "Other" if size is missing
            const sizeKey = ft.size || "Other";

            if (!groups.has(sizeKey)) {
                groups.set(sizeKey, {
                    size: sizeKey,
                    filmTypes: [],
                    totalBoxes: 0,
                    totalWeight: 0
                });
            }

            const group = groups.get(sizeKey)!;
            group.filmTypes.push(ft);

            // Calculate stock for this film type
            const stockItems = inventory.filter(i => i.filmTypeId === ft.id && i.status === 'In Stock');
            group.totalBoxes += stockItems.length;
            group.totalWeight += stockItems.reduce((s, i) => s + (i.netWeight || 0), 0);
        });

        // Convert to array and sort
        const result = Array.from(groups.values());

        // Sort groups by total stock (descending), then by size value (ascending)
        result.sort((a, b) => {
            // Primary: Total boxes in stock (descending)
            if (b.totalBoxes !== a.totalBoxes) {
                return b.totalBoxes - a.totalBoxes;
            }

            // Secondary: Size value (ascending)
            const sizeA = parseInt(a.size.match(/\d+/)?.[0] || '9999');
            const sizeB = parseInt(b.size.match(/\d+/)?.[0] || '9999');
            return sizeA - sizeB;
        });

        return result;
    }, [filmTypes, inventory]);

    // Active tab state (default: first group = most stock)
    const [activeTab, setActiveTab] = useState<string>('');

    // Update active tab when groups change (initial load or data update)
    useEffect(() => {
        if (sizeGroups.length > 0) {
            // If active tab doesn't exist anymore or it's empty, select the first one
            if (!activeTab || !sizeGroups.find(g => g.size === activeTab)) {
                setActiveTab(sizeGroups[0].size);
            }
        }
    }, [sizeGroups, activeTab]);

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800">Inventory Stockroom</h3>

            {/* Tab Navigation */}
            {sizeGroups.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
                    {sizeGroups.map(group => {
                        const isActive = activeTab === group.size;
                        const hasStock = group.totalBoxes > 0;

                        return (
                            <button
                                key={group.size}
                                onClick={() => setActiveTab(group.size)}
                                className={`
                                    px-5 py-3 rounded-t-lg font-medium text-sm whitespace-nowrap
                                    transition-all duration-200 flex items-center gap-2
                                    ${isActive
                                        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-b-2 border-transparent'
                                    }
                                `}
                            >
                                <span className={`w-2 h-2 rounded-full ${hasStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span>{group.size}</span>
                                <span className={`text-xs ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>({group.totalBoxes})</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No film types defined. Add film types in settings to categorize inventory.
                </div>
            )}

            {/* Active Content Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${activeTab ? 'opacity-100' : 'opacity-0'}`}>
                {sizeGroups
                    .find(g => g.size === activeTab)
                    ?.filmTypes
                    // Sort films within the group: active stock first, then by name
                    .sort((a, b) => {
                        const stockA = inventory.filter(i => i.filmTypeId === a.id && i.status === 'In Stock').length;
                        const stockB = inventory.filter(i => i.filmTypeId === b.id && i.status === 'In Stock').length;
                        if (stockA > 0 && stockB === 0) return -1;
                        if (stockA === 0 && stockB > 0) return 1;
                        return a.name.localeCompare(b.name);
                    })
                    .map(ft => {
                        const stockItems = inventory.filter(i => i.filmTypeId === ft.id && i.status === 'In Stock');
                        const totalWeight = stockItems.reduce((s, i) => s + (i.netWeight || 0), 0);
                        const count = stockItems.length;

                        const hasStock = count > 0;

                        return (
                            <div key={ft.id} onClick={() => onSelect(ft)} className={`${CARD_CLASS} cursor-pointer group hover:ring-2 hover:ring-indigo-500 transition-all p-6 transform hover:-translate-y-1 duration-200`}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-md">{ft.code}</span>
                                    <div className={`w-2 h-2 rounded-full ${hasStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                </div>

                                <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase truncate" title={ft.name}>{ft.name}</h4>
                                <p className="text-xs text-slate-400 mb-6">{ft.size} • {ft.micron} Micron</p>

                                <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL STOCK</p>
                                        <p className="text-lg font-bold text-slate-700">{count} <span className="text-xs font-normal text-slate-400">Boxes</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WEIGHT</p>
                                        <p className="text-lg font-bold text-slate-700">{totalWeight.toFixed(0)} <span className="text-xs font-normal text-slate-400">kg</span></p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {activeTab && sizeGroups.find(g => g.size === activeTab)?.filmTypes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        No film types found in this category.
                    </div>
                )}
            </div>
        </div>
    );
};

export const StockDetailView: React.FC<{
    filmType: FilmType;
    items: FilmItem[];
    onBack: () => void;
    onImportCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (ids: string[]) => void;
    onAddManual: () => void;
    onUpdateItem: (id: string, data: { boxNumber: string; manufacturingDate: string; grossWeight: number; netWeight: number }) => Promise<void>;
}> = ({ filmType, items, onBack, onImportCsv, onDelete, onUpdateItem, onAddManual }) => {
    const [statusFilter, setStatusFilter] = useState<'In Stock' | 'Allocated' | 'Sold' | 'All'>('In Stock');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<FilmItem | null>(null);

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const [sortConfig, setSortConfig] = useState<{ key: 'boxNumber' | 'manufacturingDate' | 'grossWeight' | 'netWeight'; direction: 'asc' | 'desc' }>({ key: 'boxNumber', direction: 'asc' });

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    const filteredItems = useMemo(() => {
        let res = items.filter(i => {
            const matchesStatus = statusFilter === 'All' ? true : i.status === statusFilter;
            const matchesSearch = i.boxNumber.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });

        // Sorting Logic
        res.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            // Handle numeric box numbers roughly for better sorting
            if (sortConfig.key === 'boxNumber') {
                const numA = parseInt(valA.replace(/\D/g, '')) || 0;
                const numB = parseInt(valB.replace(/\D/g, '')) || 0;
                if (numA !== numB) {
                    return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                }
                // Fallback to string compare if numbers are equal or missing
                return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            if (sortConfig.key === 'manufacturingDate') {
                const dateA = new Date(valA).getTime();
                const dateB = new Date(valB).getTime();
                if (dateA !== dateB) {
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                // Secondary Sort: Box Number Ascending
                const numA = parseInt(a.boxNumber.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.boxNumber.replace(/\D/g, '')) || 0;
                return numA - numB;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return res;
    }, [items, statusFilter, searchTerm, sortConfig]);

    // Pagination Calculation
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredItems, currentPage]);

    const handleSort = (key: 'boxNumber' | 'manufacturingDate' | 'grossWeight' | 'netWeight') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all currently visible filtered items (not just page)
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkDelete = () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} items? This cannot be undone.`)) {
            onDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    const downloadTemplate = () => {
        const headers = "Date,Box Number,Gross Weight";
        const sample = `${new Date().toISOString().split('T')[0]},101,25.5`;
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `import_template_${filmType.code}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusPill = (status: FilmItem['status']) => {
        const styles = { 'In Stock': 'bg-emerald-100 text-emerald-700 border border-emerald-200', 'Allocated': 'bg-amber-100 text-amber-700 border border-amber-200', 'Sold': 'bg-blue-50 text-blue-700 border border-blue-100' }[status];
        return <span className={`${BADGE_BASE} ${styles} px-3`}><span className={`w-1.5 h-1.5 rounded-full ${status === 'In Stock' ? 'bg-emerald-500' : status === 'Allocated' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>{status}</span>;
    };

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 ml-1"><ChevronUpIcon /></div>;
        return sortConfig.direction === 'asc'
            ? <div className="w-4 h-4 text-indigo-600 ml-1"><ChevronUpIcon /></div>
            : <div className="w-4 h-4 text-indigo-600 ml-1"><ChevronDownIcon /></div>;
    };

    return (
        <div className="space-y-6">
            {editingItem && (
                <EditBoxModal
                    item={editingItem}
                    filmType={filmType}
                    onClose={() => setEditingItem(null)}
                    onSave={async (id, data) => {
                        await onUpdateItem(id, data);
                        setEditingItem(null);
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col space-y-4">
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 w-fit font-medium">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Stockroom
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{filmType.name}</h2>
                        <p className="text-slate-500 mt-1">Pkg Weight: <span className="font-bold text-slate-700">{filmType.packagingWeight} kg</span> • Code: {filmType.code}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={downloadTemplate} className={SECONDARY_BTN + " bg-white"}>
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2 text-slate-500" /> Template
                        </button>
                        <button onClick={onAddManual} className={PRIMARY_BTN}>
                            <PlusIcon className="w-4 h-4 mr-2" /> Add Stock
                        </button>
                        <label className={SECONDARY_BTN + " cursor-pointer bg-white"}>
                            <CloudArrowUpIcon className="w-4 h-4 mr-2 text-indigo-500" /> Import Stock (CSV)
                            <input type="file" className="hidden" accept=".csv,.txt" onChange={onImportCsv} />
                        </label>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                    {['In Stock', 'Allocated', 'Sold', 'All'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {selectedIds.size > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 whitespace-nowrap">
                            Delete {selectedIds.size}
                        </button>
                    )}
                    <input
                        placeholder="Search Box..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                    />
                </div>
            </div>

            {/* Responsive Table / Cards */}
            <div className={`${CARD_CLASS} overflow-hidden flex flex-col`}>
                {/* Mobile Card View */}
                <div className="md:hidden">
                    {paginatedItems.map(item => (
                        <div key={item.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" checked={selectedIds.has(item.id)} onChange={() => toggleSelection(item.id)} />
                                    <span className="font-mono font-bold text-slate-800 text-lg">{item.boxNumber}</span>
                                </div>
                                {getStatusPill(item.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 mb-3 pl-8">
                                <div><span className="text-slate-400 text-xs uppercase block">Mfg Date</span>{formatDate(item.manufacturingDate)}</div>
                                <div className="text-right"><span className="text-slate-400 text-xs uppercase block">Net Weight</span><span className="font-bold text-slate-800">{item.netWeight.toFixed(2)} kg</span></div>
                            </div>
                            {item.status !== 'Sold' && (
                                <div className="flex justify-end pl-8">
                                    <button onClick={() => setEditingItem(item)} className="text-indigo-600 font-medium text-sm hover:underline flex items-center gap-1">
                                        <PencilIcon className="w-3 h-3" /> Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="py-12 text-center text-slate-400">
                            No items found.
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 w-12"><input type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>

                                <th onClick={() => handleSort('boxNumber')} className={`${TABLE_HEAD_CLASS} cursor-pointer hover:bg-slate-100 group select-none`}>
                                    <div className="flex items-center">Box No. <SortIcon colKey="boxNumber" /></div>
                                </th>

                                <th onClick={() => handleSort('manufacturingDate')} className={`${TABLE_HEAD_CLASS} cursor-pointer hover:bg-slate-100 group select-none`}>
                                    <div className="flex items-center">Mfg. Date <SortIcon colKey="manufacturingDate" /></div>
                                </th>

                                <th className={`${TABLE_HEAD_CLASS} text-right`}>Gross Wt. (kg)</th>
                                <th className={`${TABLE_HEAD_CLASS} text-right`}>Net Wt. (kg)</th>
                                <th className={TABLE_HEAD_CLASS}>Status</th>
                                <th className={TABLE_HEAD_CLASS}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {paginatedItems.map(item => (
                                <tr key={item.id} className={TABLE_ROW_CLASS}>
                                    <td className="px-6 py-4"><input type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" checked={selectedIds.has(item.id)} onChange={() => toggleSelection(item.id)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 font-mono">{item.boxNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(item.manufacturingDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-500">{(item.grossWeight || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-700">{(item.netWeight || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(item.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.status !== 'Sold' && (
                                            <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        No items found. <span className="block text-xs mt-2">Try changing filters or importing stock.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-600 font-medium">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

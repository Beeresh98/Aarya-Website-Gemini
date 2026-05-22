
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import Modal from '../../../components/Modal';
import { FilmType, FilmItem, Bill } from '../../../types';
import { INPUT_CLASS, PRIMARY_BTN, SECONDARY_BTN } from '../constants';
import { today } from '../utils';

export const ConfirmationDialog: React.FC<{
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonClass?: string;
}> = ({ isOpen, onConfirm, onCancel, title, message, confirmButtonText = "Confirm", confirmButtonClass = "bg-red-600 hover:bg-red-700" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{message}</p>
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onCancel} className={SECONDARY_BTN}>Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2.5 text-white rounded-xl font-medium shadow-md transition-colors ${confirmButtonClass}`}>{confirmButtonText}</button>
                </div>
            </div>
        </div>
    );
};

export const ImportResultModal: React.FC<{
    result: { success: boolean; message: string; errors?: string[] };
    onClose: () => void;
}> = ({ result, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={result.success ? "Import Successful" : "Import Failed"}>
            <div className="space-y-4">
                <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    {result.success
                        ? <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold">✓</div>
                        : <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold">!</div>
                    }
                    <div>
                        <h4 className="font-bold text-lg">{result.success ? 'Success!' : 'Error'}</h4>
                        <p>{result.message}</p>
                    </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                        <h5 className="font-bold text-slate-700 mb-2 sticky top-0 bg-slate-50">Details:</h5>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                            {result.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className={PRIMARY_BTN}>Close</button>
                </div>
            </div>
        </Modal>
    );
};

export const EditBoxModal: React.FC<{
    item: FilmItem;
    filmType: FilmType;
    items: FilmItem[];
    onClose: () => void;
    onSave: (id: string, data: { boxNumber: string; manufacturingDate: string; grossWeight: number; netWeight: number }) => Promise<void>;
}> = ({ item, filmType, items, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        boxNumber: item.boxNumber,
        manufacturingDate: item.manufacturingDate,
        grossWeight: item.grossWeight
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Month-scoped Duplicate Validation
        const newMonth = formData.manufacturingDate.substring(0, 7);
        const isDuplicate = items.some(i => 
            i.id !== item.id && 
            i.boxNumber === formData.boxNumber && 
            i.manufacturingDate.substring(0, 7) === newMonth
        );

        if (isDuplicate) {
            alert(`Error: A box with number '${formData.boxNumber}' already exists for this Film Type in the month of ${newMonth}.`);
            return;
        }

        const net = formData.grossWeight - (filmType.packagingWeight || 0);
        if (net <= 0) {
            alert(`Error: Net weight (${net.toFixed(2)} kg) must be positive. Gross weight must be greater than packaging weight (${filmType.packagingWeight} kg).`);
            return;
        }
        await onSave(item.id, {
            ...formData,
            netWeight: net
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Edit Box Details">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Box Number</label>
                    <input type="text" value={formData.boxNumber} onChange={e => setFormData({ ...formData, boxNumber: e.target.value })} className={INPUT_CLASS} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturing Date</label>
                    <input type="date" value={formData.manufacturingDate} max={today} onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })} className={INPUT_CLASS} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gross Weight (kg)</label>
                    <input type="number" step="0.01" min="0" value={formData.grossWeight} onChange={e => setFormData({ ...formData, grossWeight: parseFloat(e.target.value) })} className={INPUT_CLASS} required />
                    <p className="text-xs text-slate-500 mt-1">Net Weight will be auto-calculated (Gross - {filmType.packagingWeight}kg Pkg)</p>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                    <button type="submit" className={PRIMARY_BTN}>Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};

export const EditRatesModal: React.FC<{
    bill: Bill;
    filmTypes: FilmType[];
    onClose: () => void;
    onSubmit: (billId: string, rates: Record<string, number>) => Promise<void>;
}> = ({ bill, filmTypes, onClose, onSubmit }) => {
    const [currentRates, setCurrentRates] = useState<Record<string, string>>({});

    useEffect(() => {
        const initialRates: Record<string, string> = {};
        if (bill.rates) {
            Object.entries(bill.rates).forEach(([k, v]) => {
                initialRates[k] = v.toString();
            });
        }
        setCurrentRates(initialRates);
    }, [bill]);

    const filmTypeMap = useMemo(() => new Map(filmTypes.map(ft => [ft.id, ft])), [filmTypes]);

    const filmTypeIds = useMemo(() => {
        if (!bill.items) return [];
        return [...new Set(bill.items.map(item => item.filmTypeId))];
    }, [bill.items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericRates: Record<string, number> = {};
        for (const id of filmTypeIds) {
            const val = parseFloat(currentRates[id] || '0');
            numericRates[id] = isNaN(val) ? 0 : val;
        }
        onSubmit(bill.id, numericRates);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Edit Rates for Bill #${bill.billNumber}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {filmTypeIds.map(id => (
                    <div key={id} className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-700">{filmTypeMap.get(id)?.name || 'Unknown Item'}</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">₹</span>
                            <input type="number" step="0.01" min="0" placeholder="Rate/kg"
                                value={currentRates[id] || ''}
                                onChange={e => setCurrentRates(prev => ({ ...prev, [id]: e.target.value }))}
                                className={`${INPUT_CLASS} w-32 text-right`} required
                            />
                        </div>
                    </div>
                ))}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                    <button type="submit" className={PRIMARY_BTN}>Update Rates</button>
                </div>
            </form>
        </Modal>
    );
};

export const DropdownMenu: React.FC<{
    trigger: React.ReactElement;
    children: React.ReactNode | ((close: () => void) => React.ReactNode);
}> = ({ trigger, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Update position
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: window.scrollY + rect.bottom + 8,
                    left: window.scrollX + rect.right - 192
                });
            }
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            <div
                ref={triggerRef}
                className="relative inline-block"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(prev => !prev);
                }}
            >
                {trigger}
            </div>
            {isOpen && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                    className="fixed w-48 rounded-xl shadow-xl bg-white border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {/* Support Function as Child (Render Prop) or plain children */}
                        {typeof children === 'function' ? children(() => setIsOpen(false)) : children}
                    </div>
                </div>,
                document.getElementById('portal-root')!
            )}
        </>
    );
};

export const AddBatchStockModal: React.FC<{
    filmType: FilmType;
    inventory: FilmItem[];
    onClose: () => void;
    onSave: (items: { boxNumber: string; manufacturingDate: string; grossWeight: number; netWeight: number }[]) => Promise<void>;
}> = ({ filmType, inventory, onClose, onSave }) => {
    // 1. Fixed Mfg Date for the Batch
    const [mfgDate, setMfgDate] = useState(today);

    // 2. Dynamic Rows
    const [rows, setRows] = useState([
        { id: Date.now(), boxNumber: '', grossWeight: '' }
    ]);
    const [duplicates, setDuplicates] = useState<Set<number>>(new Set());

    // Focus ref for the last added row
    const lastRowInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const validateDuplicates = (currentRows: typeof rows, dateToCheck = mfgDate) => {
        const dups = new Set<number>();
        const mfgMonth = dateToCheck.substring(0, 7);
        currentRows.forEach((r, idx) => {
            if (r.boxNumber) {
                // Check against existing inventory in db for the same film type and month
                const exists = inventory.some(i => 
                    i.filmTypeId === filmType.id && 
                    i.boxNumber === r.boxNumber && 
                    i.manufacturingDate.substring(0, 7) === mfgMonth
                );
                // Check against other rows in this modal batch
                const isDupeInBatch = currentRows.findIndex((other, otherIdx) => otherIdx !== idx && other.boxNumber === r.boxNumber) !== -1;

                if (exists || isDupeInBatch) {
                    dups.add(idx);
                }
            }
        });
        setDuplicates(dups);
    };

    const handleRowChange = (index: number, field: 'boxNumber' | 'grossWeight', value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
        if (field === 'boxNumber') validateDuplicates(newRows);
    };

    const addRow = () => {
        setRows([...rows, { id: Date.now(), boxNumber: '', grossWeight: '' }]);
    };

    const removeRow = (index: number) => {
        const newRows = rows.filter((_, i) => i !== index);
        setRows(newRows);
        validateDuplicates(newRows);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' && index === rows.length - 1) {
            e.preventDefault();
            addRow();
        }
    };

    // Auto-focus logic
    useEffect(() => {
        if (rows.length > 1 && lastRowInputRef.current) {
            lastRowInputRef.current.focus();
        }
    }, [rows.length]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (duplicates.size > 0) {
            alert("Please fix duplicate box numbers before saving.");
            return;
        }

        const validItems = rows.filter(r => r.boxNumber && r.grossWeight).map(r => {
            const gross = parseFloat(r.grossWeight);
            const net = gross - (filmType.packagingWeight || 0);
            return {
                boxNumber: r.boxNumber,
                manufacturingDate: mfgDate,
                grossWeight: gross,
                netWeight: net
            };
        });

        if (validItems.length === 0) {
            alert("Please add at least one valid item.");
            return;
        }

        await onSave(validItems);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Add Stock: ${filmType.name}`}>
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">

                {/* Fixed Header Settings */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 flex items-center justify-between shrink-0">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Batch Mfg Date</label>
                        <input
                            type="date"
                            max={today}
                            value={mfgDate}
                            onChange={e => {
                                const newDate = e.target.value;
                                setMfgDate(newDate);
                                validateDuplicates(rows, newDate);
                            }}
                            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                            required
                        />
                    </div>
                    <div className="text-right text-sm text-slate-500">
                        <p>Packaging Weight: <span className="font-bold text-slate-800">{filmType.packagingWeight} kg</span></p>
                        <p>Net Weight will be auto-calculated.</p>
                    </div>
                </div>

                {/* Scrollable Table */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4 bg-white relative">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-12">#</th>
                                <th className="px-4 py-3">Box Number</th>
                                <th className="px-4 py-3">Gross Weight (kg)</th>
                                <th className="px-4 py-3">Net Weight</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => {
                                const gross = parseFloat(row.grossWeight) || 0;
                                const net = gross > 0 ? (gross - (filmType.packagingWeight || 0)).toFixed(2) : '-';
                                const isDupe = duplicates.has(index);

                                return (
                                    <tr key={row.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isDupe ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-3 font-mono text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <input
                                                    ref={index === rows.length - 1 ? lastRowInputRef : null} // Auto focus logic would be slightly more complex, simplifying: focus box number on new row
                                                    autoFocus={index === rows.length - 1 && index > 0}
                                                    type="text"
                                                    placeholder="Box No"
                                                    value={row.boxNumber}
                                                    onChange={e => handleRowChange(index, 'boxNumber', e.target.value)}
                                                    className={`w-full p-2 text-slate-900 border rounded-lg focus:ring-2 focus:outline-none ${isDupe ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                                />
                                                {isDupe && <span className="absolute right-2 top-2.5 text-xs text-red-600 font-bold">Exists</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={row.grossWeight}
                                                onChange={e => handleRowChange(index, 'grossWeight', e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, index)}
                                                className="w-full p-2 text-slate-900 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 focus:ring-2 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            {net} kg
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rows.length > 1 && (
                                                <button type="button" onClick={() => removeRow(index)} className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                                                    ✕
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <button
                        type="button"
                        onClick={addRow}
                        className="w-full py-3 text-indigo-600 font-bold text-sm bg-indigo-50 hover:bg-indigo-100 transition-colors border-t border-indigo-100 flex items-center justify-center gap-2"
                    >
                        + Add Row
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto shrink-0">
                    <div className="text-sm text-slate-500">
                        Total Items: <span className="font-bold text-slate-800">{rows.filter(r => r.boxNumber && r.grossWeight).length}</span>
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                        <button type="submit" disabled={duplicates.size > 0} className={PRIMARY_BTN}>
                            Save All
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

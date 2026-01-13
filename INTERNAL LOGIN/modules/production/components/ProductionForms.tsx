
import React, { useState, FormEvent, useEffect } from 'react';
import { Client, Bill, LedgerPayment, FilmType } from '../../../types';
import { INPUT_CLASS, PRIMARY_BTN, SECONDARY_BTN } from '../constants';
import { today } from '../utils';

export const ClientForm: React.FC<{
    onSubmit: (data: Omit<Client, 'id'>) => Promise<void>;
    onClose: () => void;
    client?: Client | null;
    isSaving: boolean;
    error: string | null;
    onDirty: () => void;
}> = ({ onSubmit, onClose, client, isSaving, error, onDirty }) => {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        contactPerson: client?.contactPerson || '',
        phone: client?.phone || '',
        address: client?.address || '',
        openingBalance: client?.openingBalance || 0,
    });
    
    const handleChange = (field: keyof typeof formData, value: string | number) => {
        onDirty();
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSubmit(formData); };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={INPUT_CLASS} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                    <input type="text" value={formData.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} className={INPUT_CLASS} required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className={INPUT_CLASS} required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance (₹)</label>
                    <input type="number" step="0.01" value={formData.openingBalance} onChange={e => handleChange('openingBalance', Number(e.target.value))} className={INPUT_CLASS} />
                    <p className="text-xs text-slate-500 mt-1">Positive for Debit (Receivable)</p>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea value={formData.address} onChange={e => handleChange('address', e.target.value)} rows={3} className={INPUT_CLASS}></textarea>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                <button type="submit" disabled={isSaving} className={PRIMARY_BTN}>
                    {isSaving ? 'Saving...' : (client ? 'Save Changes' : 'Add Client')}
                </button>
            </div>
        </form>
    );
}

export const ManualBillForm: React.FC<{
    clientId: string;
    bill?: Bill | null;
    onSubmit: (data: Omit<Bill, 'id'>) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}> = ({ clientId, bill, onSubmit, onClose, isSaving }) => {
    const [formData, setFormData] = useState({
        billNumber: bill?.billNumber || '',
        date: bill?.date || today,
        totalAmount: bill?.totalAmount || 0,
        description: bill?.description || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            clientId,
            status: 'Generated', // Default status for manual bills
            type: 'Manual',
            isManual: true,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm text-amber-800 mb-4">
                This is a <strong>Manual Bill</strong>. It will not affect inventory stock. Use this for historical data or service invoices.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bill Number</label>
                    <input type="text" value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className={INPUT_CLASS} required placeholder="e.g. OLD-101" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input type="date" value={formData.date} max={today} onChange={e => setFormData({...formData, date: e.target.value})} className={INPUT_CLASS} required />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={INPUT_CLASS} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Narration</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={INPUT_CLASS} rows={3}></textarea>
            </div>
             <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                <button type="submit" disabled={isSaving} className={PRIMARY_BTN}>
                    {isSaving ? 'Saving...' : (bill ? 'Update Bill' : 'Create Bill')}
                </button>
            </div>
        </form>
    );
};

export const LedgerPaymentForm: React.FC<{
    clientId: string;
    payment?: LedgerPayment | null;
    onSubmit: (data: Omit<LedgerPayment, 'id'>) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}> = ({ clientId, payment, onSubmit, onClose, isSaving }) => {
     const [formData, setFormData] = useState({
        date: payment?.date || today,
        amount: payment?.amount || 0,
        method: payment?.method || 'Bank Transfer',
        notes: payment?.notes || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            clientId,
            method: formData.method as any,
        });
    };

    return (
         <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                    <input type="date" value={formData.date} max={today} onChange={e => setFormData({...formData, date: e.target.value})} className={INPUT_CLASS} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received (₹)</label>
                    <input type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className={INPUT_CLASS} required />
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                 <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className={INPUT_CLASS}>
                     <option>Bank Transfer</option>
                     <option>Cheque</option>
                     <option>Cash</option>
                     <option>Other</option>
                 </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Reference No.</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={INPUT_CLASS} rows={2}></textarea>
            </div>
             <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                <button type="submit" disabled={isSaving} className={PRIMARY_BTN}>
                    {isSaving ? 'Saving...' : (payment ? 'Update Payment' : 'Record Receipt')}
                </button>
            </div>
         </form>
    );
};

export const FilmTypeForm: React.FC<{
    onSubmit: (data: Omit<FilmType, 'id'>) => Promise<void>;
    onClose: () => void;
    filmType?: FilmType | null;
    existingFilmTypes: FilmType[];
    isSaving: boolean;
}> = ({ onSubmit, onClose, filmType, existingFilmTypes, isSaving }) => {
    
    // Auto-generate code for new items
    const generateNextCode = () => {
        if (!existingFilmTypes || existingFilmTypes.length === 0) return 'FT-001';
        const codes = existingFilmTypes.map(ft => {
            const match = ft.code.match(/FT-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });
        const max = Math.max(0, ...codes);
        return `FT-${String(max + 1).padStart(3, '0')}`;
    };

    const [formData, setFormData] = useState({
        code: filmType?.code || generateNextCode(),
        name: filmType?.name || '',
        size: filmType?.size || '',
        micron: filmType?.micron || 0,
        color: filmType?.color || '',
        packagingWeight: filmType?.packagingWeight || 0,
        unitsInBox: filmType?.unitsInBox || 0
    });

    // Auto-generate name based on Size + Micron + Color rule
    useEffect(() => {
        const sizeStr = formData.size.trim().toUpperCase().replace(/\s+/g, '');
        const colorStr = formData.color.trim().toUpperCase().replace(/\s+/g, '');
        const micronStr = formData.micron > 0 ? formData.micron.toString() : '';

        // Only update if we have the components and it's not a manual override (optional)
        // For now, we strictly enforce the rule as per user request "Find out the rule"
        if (sizeStr && micronStr && colorStr) {
            const generatedName = `${sizeStr}-${micronStr}MIC-${colorStr}`;
            setFormData(prev => {
                if (prev.name !== generatedName) return { ...prev, name: generatedName };
                return prev;
            });
        }
    }, [formData.size, formData.micron, formData.color]);

    const handleChange = (field: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                <input 
                    name="code" 
                    value={formData.code} 
                    readOnly 
                    className={`${INPUT_CLASS} bg-slate-100 text-slate-500 cursor-not-allowed`} 
                />
                <p className="text-xs text-slate-400 mt-1">Auto-generated system code</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                    name="name" 
                    value={formData.name} 
                    onChange={e => handleChange('name', e.target.value)} 
                    className={`${INPUT_CLASS} bg-slate-50`} 
                    required 
                    placeholder="Auto-generated from details below"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                    <input 
                        name="size" 
                        value={formData.size} 
                        onChange={e => handleChange('size', e.target.value)} 
                        className={INPUT_CLASS} 
                        required 
                        placeholder="e.g. 250 MM"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Micron</label>
                    <input 
                        name="micron" 
                        type="number" 
                        value={formData.micron} 
                        onChange={e => handleChange('micron', Number(e.target.value))} 
                        className={INPUT_CLASS} 
                        required 
                        placeholder="e.g. 25"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                    <input 
                        name="color" 
                        value={formData.color} 
                        onChange={e => handleChange('color', e.target.value)} 
                        className={INPUT_CLASS} 
                        required 
                        placeholder="e.g. Milky White"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pkg Weight (kg)</label>
                    <input 
                        name="packagingWeight" 
                        type="number" 
                        step="0.01" 
                        value={formData.packagingWeight} 
                        onChange={e => handleChange('packagingWeight', Number(e.target.value))} 
                        className={INPUT_CLASS} 
                        required 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Units in Box</label>
                <input 
                    name="unitsInBox" 
                    type="number" 
                    value={formData.unitsInBox} 
                    onChange={e => handleChange('unitsInBox', Number(e.target.value))} 
                    className={INPUT_CLASS} 
                    required 
                />
            </div>
            <div className="flex justify-end pt-4 space-x-3 border-t border-slate-100 mt-4">
                 <button type="button" onClick={onClose} className={SECONDARY_BTN}>Cancel</button>
                 <button type="submit" disabled={isSaving} className={PRIMARY_BTN}>Save</button>
            </div>
        </form>
    );
};

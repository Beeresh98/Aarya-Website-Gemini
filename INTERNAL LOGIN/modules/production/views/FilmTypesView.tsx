
import React from 'react';
import { FilmType } from '../../../types';
import { CARD_CLASS, PRIMARY_BTN } from '../constants';
import { EllipsisVerticalIcon } from '../../../components/icons/Icons';
import { DropdownMenu } from '../components/ProductionModals';

export const FilmTypesView: React.FC<{
    filmTypes: FilmType[];
    onAdd: () => void;
    onEdit: (ft: FilmType) => void;
    onDelete: (id: string) => void;
}> = ({ filmTypes, onAdd, onEdit, onDelete }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Film Types</h3>
                    <p className="text-slate-500">Manage product specifications and standards.</p>
                </div>
                <button onClick={onAdd} className={PRIMARY_BTN}>+ Add Film Type</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filmTypes.map(ft => (
                    <div key={ft.id} className={`${CARD_CLASS} group relative flex flex-col`}>
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="p-6 flex-grow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-md">{ft.code}</span>
                                    <h4 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">{ft.name}</h4>
                                </div>
                                <DropdownMenu trigger={<button className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"><EllipsisVerticalIcon className="h-5 w-5" /></button>}>
                                    <button onClick={() => onEdit(ft)} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit Details</button>
                                    <button onClick={() => { if(confirm("Delete film type?")) onDelete(ft.id); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                                </DropdownMenu>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 p-2 rounded-lg"><span className="block text-xs text-slate-400 font-semibold uppercase">Size</span><span className="font-medium text-slate-700">{ft.size}</span></div>
                                <div className="bg-slate-50 p-2 rounded-lg"><span className="block text-xs text-slate-400 font-semibold uppercase">Micron</span><span className="font-medium text-slate-700">{ft.micron}</span></div>
                                <div className="bg-slate-50 p-2 rounded-lg"><span className="block text-xs text-slate-400 font-semibold uppercase">Color</span><span className="font-medium text-slate-700">{ft.color}</span></div>
                                <div className="bg-slate-50 p-2 rounded-lg"><span className="block text-xs text-slate-400 font-semibold uppercase">Pkg Wt.</span><span className="font-medium text-slate-700">{(ft.packagingWeight || 0).toFixed(2)} kg</span></div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium"><span>Units per box: {ft.unitsInBox}</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

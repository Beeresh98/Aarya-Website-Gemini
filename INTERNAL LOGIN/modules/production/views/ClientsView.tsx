
import React from 'react';
import { Client } from '../../../types';
import { CARD_CLASS, PRIMARY_BTN } from '../constants';
import { EllipsisVerticalIcon } from '../../../components/icons/Icons';
import { DropdownMenu } from '../components/ProductionModals';

export const ClientsView: React.FC<{
    clients: Client[];
    onAdd: () => void;
    onEdit: (client: Client) => void;
    onDelete: (id: string) => void;
}> = ({ clients, onAdd, onEdit, onDelete }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800">Clients</h3>
                <button onClick={onAdd} className={PRIMARY_BTN}>+ Add Client</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <div key={client.id} className={CARD_CLASS + " p-6 group"}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">{client.name.charAt(0)}</div>
                            <DropdownMenu trigger={<button className="p-2 rounded-full text-slate-400 hover:bg-slate-100"><EllipsisVerticalIcon className="w-5 h-5" /></button>}>
                                {(close) => (
                                    <>
                                        <button onClick={() => { onEdit(client); close(); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                                        <button onClick={() => { if (confirm("Delete client?")) onDelete(client.id); close(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                                    </>
                                )}
                            </DropdownMenu>
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 mb-1">{client.name}</h4>
                        <div className="text-sm text-slate-600 mb-2">{client.contactPerson}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                            <span>📞 {client.phone}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
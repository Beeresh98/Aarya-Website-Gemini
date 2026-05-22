
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import type { FilmType, FilmItem, Client, Bill, LedgerPayment } from '../types';
import Modal from '../components/Modal';
import { ChartPieIcon, BookOpenIcon, DocumentTextIcon, DocumentPlusIcon, ArchiveBoxIcon, TagIcon, BuildingStorefrontIcon, ArrowLeftIcon, ChevronDoubleLeftIcon, MenuIcon } from '../components/icons/Icons';

// New Imports from Modular Structure
import { INPUT_CLASS, SECONDARY_BTN, PRIMARY_BTN } from './production/constants';
import { today } from './production/utils';
import { ImportResultModal, EditRatesModal, ConfirmationDialog, AddBatchStockModal } from './production/components/ProductionModals';
import { ClientForm, ManualBillForm, LedgerPaymentForm, FilmTypeForm } from './production/components/ProductionForms';
import { PrintQuotationModal, PrintChecklistModal } from './production/components/PrintTemplates';
import { EditBillDetailsModal } from './production/components/EditBillDetailsModal';

// Views
import DashboardView from './production/views/DashboardView';
import { InventoryDirectory, StockDetailView } from './production/views/InventoryView';
import BillingView from './production/views/BillingView';
import BillsView from './production/views/BillsView';
import LedgerView from './production/views/LedgerView';
import { ClientsView } from './production/views/ClientsView';
import { FilmTypesView } from './production/views/FilmTypesView';

const Production: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'billing' | 'bills' | 'ledger' | 'clients' | 'film_types'>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [selectedFilmType, setSelectedFilmType] = useState<FilmType | null>(null); // For StockDetailView

    // Data State
    const [filmTypes, setFilmTypes] = useState<FilmType[]>([]);
    const [inventory, setInventory] = useState<FilmItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [ledgerPayments, setLedgerPayments] = useState<LedgerPayment[]>([]);

    // Modal States
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [isBillModalOpen, setIsBillModalOpen] = useState(false); // Manual Bill
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [manualBillClientId, setManualBillClientId] = useState<string | null>(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<LedgerPayment | null>(null);
    const [paymentClientId, setPaymentClientId] = useState<string | null>(null);

    const [isFilmTypeModalOpen, setIsFilmTypeModalOpen] = useState(false);
    const [editingFilmType, setEditingFilmType] = useState<FilmType | null>(null);

    const [importResult, setImportResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);

    const [printData, setPrintData] = useState<{ type: 'quotation' | 'checklist', bill: Bill, client: Client | undefined } | null>(null);

    const [editingRateBill, setEditingRateBill] = useState<Bill | null>(null);
    const [editingBillDetailed, setEditingBillDetailed] = useState<Bill | null>(null);
    const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const unsubs = [
            onSnapshot(collection(db, 'film_types'), snap => setFilmTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as FilmType)))),
            onSnapshot(collection(db, 'inventory'), snap => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as FilmItem)))),
            onSnapshot(collection(db, 'clients'), snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)))),
            onSnapshot(collection(db, 'bills'), snap => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bill)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))),
            onSnapshot(collection(db, 'ledger_payments'), snap => setLedgerPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerPayment))))
        ];
        return () => unsubs.forEach(u => u());
    }, []);

    // --- ACTIONS ---

    const handleBillAction = async (action: string, bill: Bill) => {
        try {
            if (action === 'dispatch') {
                await updateDoc(doc(db, 'bills', bill.id), { status: 'Dispatched' });
            } else if (action === 'edit_details') {
                setEditingBillDetailed(bill);
            } else if (action === 'pay') {
                await updateDoc(doc(db, 'bills', bill.id), { status: 'Paid' });
            } else if (action === 'cancel') {
                if (!window.confirm("Are you sure you want to cancel this bill? This will return all items to 'In Stock'.")) return;

                const batch = writeBatch(db);
                // 1. Mark Bill as Cancelled
                batch.update(doc(db, 'bills', bill.id), { status: 'Cancelled' });

                // 2. Return items to stock
                if (bill.items && bill.items.length > 0) {
                    bill.items.forEach(item => {
                        // We use item.itemId which corresponds to the inventory document ID
                        const itemRef = doc(db, 'inventory', item.itemId);
                        batch.update(itemRef, { status: 'In Stock' });
                    });
                }
                await batch.commit();
            } else if (action === 'delete') {
                if (!window.confirm("Delete this record permanently? This does NOT revert stock changes.")) return;
                await deleteDoc(doc(db, 'bills', bill.id));
            } else if (action === 'quotation') {
                setPrintData({ type: 'quotation', bill, client: clients.find(c => c.id === bill.clientId) });
            } else if (action === 'checklist') {
                setPrintData({ type: 'checklist', bill, client: clients.find(c => c.id === bill.clientId) });
            }
        } catch (error: any) {
            console.error("Bill action failed:", error);
            alert(`Action failed: ${error.message}`);
        }
    };

    const handleCreateSystemBill = async (billData: any) => {
        try {
            // billData contains: clientId, items[], totalWeight, rates, subTotal, freight, discount, totalAmount

            // Generate Bill Number (Simple Auto-Increment Logic or Timestamp)
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const count = bills.filter(b => b.date.startsWith(new Date().getFullYear().toString())).length + 1;
            const billNumber = `ARY/${currentYear}/${String(count).padStart(3, '0')}`;

            const batch = writeBatch(db);

            // 1. Create Bill
            const newBillRef = doc(collection(db, 'bills'));
            batch.set(newBillRef, {
                ...billData,
                billNumber,
                date: today,
                status: 'Generated',
                type: 'System',
                isManual: false
            });

            // 2. Update Inventory Status
            billData.items.forEach((item: any) => {
                const itemRef = doc(db, 'inventory', item.itemId);
                batch.update(itemRef, { status: 'Sold' });
            });

            await batch.commit();

            // Redirect to Bills view
            setActiveTab('bills');
            alert(`Bill ${billNumber} generated successfully!`);
        } catch (e: any) {
            console.error("Error creating bill", e);
            alert("Failed to create bill: " + e.message);
        }
    };

    const handleSaveManualBill = async (data: Omit<Bill, 'id'>) => {
        setIsSaving(true);
        try {
            if (editingBill) {
                await updateDoc(doc(db, 'bills', editingBill.id), data);
            } else {
                await addDoc(collection(db, 'bills'), data);
            }
            setIsBillModalOpen(false);
            setEditingBill(null);
            setManualBillClientId(null);
        } catch (e: any) {
            console.error(e);
            alert("Error saving manual bill");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePayment = async (data: Omit<LedgerPayment, 'id'>) => {
        setIsSaving(true);
        try {
            if (editingPayment) {
                await updateDoc(doc(db, 'ledger_payments', editingPayment.id), data);
            } else {
                await addDoc(collection(db, 'ledger_payments'), data);
            }
            setIsPaymentModalOpen(false);
            setEditingPayment(null);
            setPaymentClientId(null);
        } catch (e) {
            console.error(e);
            alert("Error saving payment");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateRates = async (billId: string, newRates: Record<string, number>) => {
        try {
            const bill = bills.find(b => b.id === billId);
            if (!bill || !bill.items) return;

            // Recalculate totals
            const subTotal = bill.items.reduce((sum, item) => {
                const rate = newRates[item.filmTypeId] || 0;
                return sum + (item.netWeight * rate);
            }, 0);

            const totalAmount = subTotal + (bill.freight || 0) - (bill.discount || 0);

            await updateDoc(doc(db, 'bills', billId), {
                rates: newRates,
                subTotal,
                totalAmount
            });
            setEditingRateBill(null);
        } catch (e: any) {
            console.error(e);
            alert("Failed to update rates");
        }
    };

    // Client CRUD
    const handleSaveClient = async (data: Omit<Client, 'id'>) => {
        setIsSaving(true);
        try {
            if (editingClient) await updateDoc(doc(db, 'clients', editingClient.id), data);
            else await addDoc(collection(db, 'clients'), data);
            setIsClientModalOpen(false); setEditingClient(null);
        } catch (e) { alert("Error saving client"); } finally { setIsSaving(false); }
    };

    // Inventory Import
    const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>, filmTypeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const newItems: any[] = [];
            const errors: string[] = [];

            // Skip header if present
            const startIdx = lines[0].toLowerCase().includes('box') ? 1 : 0;

            for (let i = startIdx; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length < 3) { errors.push(`Line ${i + 1}: Invalid format`); continue; }

                const date = parts[0].trim(); // YYYY-MM-DD
                const boxNo = parts[1].trim();
                const gross = parseFloat(parts[2].trim());

                if (isNaN(gross)) { errors.push(`Line ${i + 1}: Invalid weight`); continue; }

                const lineMonth = date.substring(0, 7);

                // 1. Check against existing inventory in db
                const existsInDb = inventory.some(item =>
                    item.filmTypeId === filmTypeId &&
                    item.boxNumber === boxNo &&
                    item.manufacturingDate.substring(0, 7) === lineMonth
                );

                // 2. Check against items already parsed in this CSV file batch
                const existsInBatch = newItems.some(item =>
                    item.boxNumber === boxNo &&
                    item.manufacturingDate.substring(0, 7) === lineMonth
                );

                if (existsInDb || existsInBatch) {
                    errors.push(`Line ${i + 1}: Duplicate box number '${boxNo}' for the month ${lineMonth}`);
                    continue;
                }

                const ft = filmTypes.find(f => f.id === filmTypeId);
                const net = gross - (ft?.packagingWeight || 0);

                newItems.push({
                    filmTypeId,
                    manufacturingDate: date,
                    boxNumber: boxNo,
                    uniqueBoxId: `${ft?.code}/B${boxNo}`,
                    grossWeight: gross,
                    netWeight: net,
                    status: 'In Stock'
                });
            }

            if (newItems.length > 0) {
                const batch = writeBatch(db);
                newItems.forEach(item => batch.set(doc(collection(db, 'inventory')), item));
                await batch.commit();
            }

            setImportResult({
                success: newItems.length > 0,
                message: `Imported ${newItems.length} items.`,
                errors: errors.length > 0 ? errors : undefined
            });
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const handleUpdateItem = async (id: string, data: any) => {
        await updateDoc(doc(db, 'inventory', id), data);
    };

    const handleBulkDeleteItems = async (ids: string[]) => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'inventory', id)));
        await batch.commit();
    };

    const handleBatchAddStock = async (items: { boxNumber: string; manufacturingDate: string; grossWeight: number; netWeight: number }[]) => {
        if (!selectedFilmType) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            items.forEach(item => {
                const uniqueBoxId = `${selectedFilmType.code}/B${item.boxNumber}`;
                const docRef = doc(collection(db, 'inventory'));
                batch.set(docRef, {
                    ...item,
                    filmTypeId: selectedFilmType.id,
                    uniqueBoxId,
                    status: 'In Stock'
                });
            });
            await batch.commit();
            setIsAddBatchModalOpen(false);
        } catch (e: any) {
            console.error(e);
            alert("Error saving items: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- NAVIGATION HELPERS ---
    const MENU_ITEMS = [
        { id: 'dashboard', label: 'Dashboard', icon: <ChartPieIcon /> },
        { id: 'inventory', label: 'Inventory', icon: <ArchiveBoxIcon /> },
        { id: 'billing', label: 'New Bill', icon: <DocumentPlusIcon /> },
        { id: 'bills', label: 'Bill History', icon: <DocumentTextIcon /> },
        { id: 'ledger', label: 'Ledger', icon: <BookOpenIcon /> },
        { id: 'clients', label: 'Clients', icon: <BuildingStorefrontIcon /> },
        { id: 'film_types', label: 'Film Types', icon: <TagIcon /> },
    ];

    const handleUpdateBillDetailed = async (billId: string, newItems: any[], addedIds: string[], removedIds: string[], financials: any) => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const billRef = doc(db, 'bills', billId);

            // 1. Update Bill
            batch.update(billRef, {
                items: newItems,
                totalWeight: financials.totalWeight,
                subTotal: financials.subTotal,
                totalAmount: financials.totalAmount,
                // If taxAmount was calculated in modal, we might want to store it, but type definition might not have it.
                // Assuming we just update totals for now.
            });

            // 2. Return Removed Items to Stock
            removedIds.forEach(id => {
                batch.update(doc(db, 'inventory', id), { status: 'In Stock' });
            });

            // 3. Mark Added Items as Sold
            addedIds.forEach(id => {
                batch.update(doc(db, 'inventory', id), { status: 'Sold' });
            });

            await batch.commit();
            setEditingBillDetailed(null);
        } catch (e) {
            console.error("Error updating bill items:", e);
            alert("Failed to update bill items. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 transform 
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative 
                ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} flex flex-col`}>

                <div className="h-16 flex items-center justify-center border-b border-slate-100">
                    <span className={`font-bold text-xl text-indigo-600 transition-opacity ${isSidebarCollapsed ? 'md:hidden' : ''}`}>PRODUCTION</span>
                    {isSidebarCollapsed && <span className="hidden md:block font-bold text-xl text-indigo-600">P</span>}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {MENU_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsMobileSidebarOpen(false); setSelectedFilmType(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <div className="w-5 h-5 shrink-0">{item.icon}</div>
                            {!isSidebarCollapsed && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                        <ChevronDoubleLeftIcon className={`w-5 h-5 transform transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={onExit} className={`w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
                        <ArrowLeftIcon className="w-5 h-5" />
                        {!isSidebarCollapsed && <span>Exit Module</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('_', ' ')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-700">{today}</p>
                            <p className="text-xs text-slate-500">System Active</p>
                        </div>
                    </div>
                </header>

                {/* Viewport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
                    {activeTab === 'dashboard' && <DashboardView bills={bills} clients={clients} ledgerPayments={ledgerPayments} filmTypes={filmTypes} />}

                    {activeTab === 'inventory' && (
                        !selectedFilmType
                            ? <InventoryDirectory filmTypes={filmTypes} inventory={inventory} onSelect={setSelectedFilmType} />
                            : <StockDetailView
                                filmType={selectedFilmType}
                                items={inventory.filter(i => i.filmTypeId === selectedFilmType.id)}
                                onBack={() => setSelectedFilmType(null)}
                                onImportCsv={(e) => handleImportCsv(e, selectedFilmType.id)}
                                onDelete={handleBulkDeleteItems}
                                onAddManual={() => setIsAddBatchModalOpen(true)}
                                onUpdateItem={handleUpdateItem}
                            />
                    )}

                    {activeTab === 'billing' && <BillingView filmTypes={filmTypes} clients={clients} inventory={inventory} onCreateBill={handleCreateSystemBill} />}

                    {activeTab === 'bills' && <BillsView bills={bills} clients={clients} filmTypes={filmTypes} inventory={inventory} onAction={handleBillAction} onEditRates={setEditingRateBill} />}

                    {activeTab === 'ledger' && <LedgerView
                        clients={clients}
                        bills={bills}
                        ledgerPayments={ledgerPayments}
                        onAddManualBill={(cid) => { setManualBillClientId(cid); setIsBillModalOpen(true); }}
                        onAddPayment={(cid) => { setPaymentClientId(cid); setIsPaymentModalOpen(true); }}
                        onEditManualBill={(bill) => { setEditingBill(bill); setManualBillClientId(bill.clientId); setIsBillModalOpen(true); }}
                        onEditPayment={(payment) => { setEditingPayment(payment); setPaymentClientId(payment.clientId); setIsPaymentModalOpen(true); }}
                        onDeleteBill={(bill) => handleBillAction('delete', bill)}
                        onDeletePayment={async (id) => { if (confirm("Delete payment?")) await deleteDoc(doc(db, 'ledger_payments', id)); }}
                    />}

                    {activeTab === 'clients' && <ClientsView clients={clients} onAdd={() => { setEditingClient(null); setIsClientModalOpen(true); }} onEdit={(c) => { setEditingClient(c); setIsClientModalOpen(true); }} onDelete={async (id) => await deleteDoc(doc(db, 'clients', id))} />}

                    {activeTab === 'film_types' && <FilmTypesView filmTypes={filmTypes} onAdd={() => { setEditingFilmType(null); setIsFilmTypeModalOpen(true); }} onEdit={(ft) => { setEditingFilmType(ft); setIsFilmTypeModalOpen(true); }} onDelete={async (id) => await deleteDoc(doc(db, 'film_types', id))} />}
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* Client Modal */}
            <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title={editingClient ? "Edit Client" : "Add Client"}>
                <ClientForm onSubmit={handleSaveClient} onClose={() => setIsClientModalOpen(false)} client={editingClient} isSaving={isSaving} error={formError} onDirty={() => setFormError(null)} />
            </Modal>

            {/* Manual Bill Modal */}
            {(isBillModalOpen && manualBillClientId) && (
                <Modal isOpen={true} onClose={() => setIsBillModalOpen(false)} title={editingBill ? "Edit Manual Bill" : "Add Manual Bill"}>
                    <ManualBillForm clientId={manualBillClientId} bill={editingBill} onSubmit={handleSaveManualBill} onClose={() => setIsBillModalOpen(false)} isSaving={isSaving} />
                </Modal>
            )}

            {/* Payment Modal */}
            {(isPaymentModalOpen && paymentClientId) && (
                <Modal isOpen={true} onClose={() => setIsPaymentModalOpen(false)} title={editingPayment ? "Edit Payment" : "Record Receipt"}>
                    <LedgerPaymentForm clientId={paymentClientId} payment={editingPayment} onSubmit={handleSavePayment} onClose={() => setIsPaymentModalOpen(false)} isSaving={isSaving} />
                </Modal>
            )}

            {/* Film Type Modal */}
            <Modal isOpen={isFilmTypeModalOpen} onClose={() => setIsFilmTypeModalOpen(false)} title={editingFilmType ? "Edit Film Type" : "Add Film Type"}>
                <FilmTypeForm
                    onSubmit={async (data) => {
                        setIsSaving(true);
                        try {
                            if (editingFilmType) await updateDoc(doc(db, 'film_types', editingFilmType.id), data);
                            else await addDoc(collection(db, 'film_types'), data);
                            setIsFilmTypeModalOpen(false); setEditingFilmType(null);
                        } catch (err) { alert("Error saving film type"); } finally { setIsSaving(false); }
                    }}
                    onClose={() => setIsFilmTypeModalOpen(false)}
                    filmType={editingFilmType}
                    existingFilmTypes={filmTypes}
                    isSaving={isSaving}
                />
            </Modal>

            {/* Import Result Modal */}
            {importResult && <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />}

            {/* Add Batch Stock Modal */}
            {isAddBatchModalOpen && selectedFilmType && (
                <AddBatchStockModal
                    filmType={selectedFilmType}
                    inventory={inventory.filter(i => i.filmTypeId === selectedFilmType.id)}
                    onClose={() => setIsAddBatchModalOpen(false)}
                    onSave={handleBatchAddStock}
                />
            )}

            {/* Edit Bill Detailed Modal */}
            {editingBillDetailed && (
                <EditBillDetailsModal
                    bill={editingBillDetailed}
                    inventory={inventory}
                    filmTypes={filmTypes}
                    onClose={() => setEditingBillDetailed(null)}
                    onSave={handleUpdateBillDetailed}
                    isSaving={isSaving}
                />
            )}

            {/* Edit Rates Modal */}
            {editingRateBill && <EditRatesModal bill={editingRateBill} filmTypes={filmTypes} onClose={() => setEditingRateBill(null)} onSubmit={handleUpdateRates} />}

            {/* Print Modals */}
            {printData?.type === 'quotation' && <PrintQuotationModal bill={printData.bill} client={printData.client} filmTypes={filmTypes} inventory={inventory} onClose={() => setPrintData(null)} />}
            {printData?.type === 'checklist' && <PrintChecklistModal bill={printData.bill} client={printData.client} filmTypes={filmTypes} inventory={inventory} onClose={() => setPrintData(null)} />}

        </div>
    );
};

export default Production;

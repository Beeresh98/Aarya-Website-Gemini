
import React, { useState, useMemo } from 'react';
import { Bill, Client, FilmType, BillItem, FilmItem } from '../../../types';
import { formatDate, amountToWords } from '../utils';
import { today } from '../utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Generation Utility
const generatePDF = async (elementId: string, filename: string, onComplete: () => void) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found for PDF generation');
        return;
    }

    try {
        // Capture the HTML content as canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        // Calculate PDF dimensions (A4)
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Download with guaranteed filename
        pdf.save(`${filename}.pdf`);
        onComplete();
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        onComplete();
    }
};

export const PrintQuotationModal: React.FC<{
    bill: Bill;
    client: Client | undefined;
    filmTypes: FilmType[];
    inventory: FilmItem[];
    onClose: () => void;
}> = ({ bill, client, filmTypes, inventory, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate dynamic filename
    const getFilename = () => {
        const clientName = client?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'client';
        const dateStr = bill.date?.replace(/-/g, '') || 'date';
        return `${clientName}_${dateStr}_quotation`;
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        await generatePDF('quotation-content', getFilename(), () => {
            setIsGenerating(false);
            onClose();
        });
    };

    const groupedItems = useMemo(() => {
        if (!bill.items) return [];
        const filmTypeMap = new Map(filmTypes.map(ft => [ft.id, ft.name]));

        type GroupedItem = { filmTypeName: string; items: BillItem[] };
        const grouped = bill.items.reduce((acc, item) => {
            if (!acc[item.filmTypeId]) {
                acc[item.filmTypeId] = {
                    filmTypeName: filmTypeMap.get(item.filmTypeId) || 'Unknown Item',
                    items: []
                };
            }
            acc[item.filmTypeId].items.push(item);
            return acc;
        }, {} as Record<string, GroupedItem>);

        return Object.values(grouped).map((group: GroupedItem) => {
            const boxes = group.items.map(i => parseInt(i.boxNumber)).sort((a, b) => a - b);
            let ranges: string[] = [];
            if (boxes.length > 0) {
                let start = boxes[0], end = boxes[0];
                for (let i = 1; i < boxes.length; i++) {
                    if (boxes[i] === end + 1) end = boxes[i];
                    else {
                        ranges.push(start === end ? `${start}` : `${start}-${end}`);
                        start = end = boxes[i];
                    }
                }
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
            }

            const totalWeight = group.items.reduce((sum, i) => sum + i.netWeight, 0);

            return {
                name: group.filmTypeName,
                boxCount: group.items.length,
                weight: totalWeight,
                ranges: ranges.join(', '),
                filmTypeId: group.items[0].filmTypeId
            };
        });
    }, [bill.items, filmTypes]);

    // Calculate totals
    const totalGrossWeight = useMemo(() => {
        if (!bill.items || !inventory) return 0;
        return bill.items.reduce((sum, item) => {
            const invItem = inventory.find(i => i.id === item.itemId);
            return sum + (invItem?.grossWeight || 0);
        }, 0);
    }, [bill.items, inventory]);

    const totalNetWeight = useMemo(() => {
        if (!bill.items) return 0;
        return bill.items.reduce((sum, item) => sum + item.netWeight, 0);
    }, [bill.items]);

    const totalBoxes = bill.items?.length || 0;

    // Calculate dynamic values for display
    const subTotal = bill.subTotal || bill.totalAmount;
    const freight = bill.freight || 0;
    const discount = bill.discount || 0;
    const grandTotal = bill.totalAmount;

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with buttons */}
                <div className="bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Quotation Preview</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* PDF Content - Scrollable */}
                <div className="overflow-y-auto flex-1">
                    <div id="quotation-content" className="p-8 bg-white">
                        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                            <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">Quotation</h1>
                            <h2 className="text-2xl font-semibold"></h2>
                            <p className="text-sm text-gray-600"></p>
                        </div>
                        <div className="flex justify-between mb-8">
                            <div className="w-1/2">
                                <h3 className="font-bold text-gray-500 text-xs uppercase mb-1">Bill To:</h3>
                                <p className="font-bold text-lg">{client?.name}</p>
                                <p className="whitespace-pre-wrap text-sm text-gray-700">{client?.address}</p>
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <span className="font-bold text-gray-500 text-xs uppercase block">Quotation No:</span>
                                    <span className="font-bold text-xl">{bill.billNumber}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 text-xs uppercase block">Date:</span>
                                    <span className="font-medium">{formatDate(bill.date)}</span>
                                </div>
                            </div>
                        </div>
                        <table className="w-full mb-8 border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-y-2 border-gray-800">
                                    <th className="py-3 px-2 text-left font-bold text-sm w-16">Sr.</th>
                                    <th className="py-3 px-2 text-left font-bold text-sm">Description</th>
                                    <th className="py-3 px-2 text-right font-bold text-sm w-24">Boxes</th>
                                    <th className="py-3 px-2 text-right font-bold text-sm w-24">Weight</th>
                                    <th className="py-3 px-2 text-right font-bold text-sm w-24">Rate</th>
                                    <th className="py-3 px-2 text-right font-bold text-sm w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedItems.map((item, index) => {
                                    const rate = bill.rates?.[item.filmTypeId] || 0;
                                    const amount = item.weight * rate;
                                    return (
                                        <tr key={index} className="border-b border-gray-300">
                                            <td className="py-3 px-2 text-sm">{index + 1}</td>
                                            <td className="py-3 px-2 text-sm">
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">Box Nos: {item.ranges}</div>
                                            </td>
                                            <td className="py-3 px-2 text-right text-sm">{item.boxCount}</td>
                                            <td className="py-3 px-2 text-right text-sm">{(item.weight || 0).toFixed(2)} kg</td>
                                            <td className="py-3 px-2 text-right text-sm">₹{rate}</td>
                                            <td className="py-3 px-2 text-right font-medium">₹{(amount || 0).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {/* Totals Row - Aligned with Columns */}
                                <tr className="border-t-2 border-gray-400 bg-gray-50">
                                    <td colSpan={2} className="py-3 px-2"></td>
                                    <td className="py-3 px-2 text-right font-bold text-base">
                                        {totalBoxes}
                                    </td>
                                    <td className="py-3 px-2 text-right font-bold text-base">
                                        {totalNetWeight.toFixed(2)} kg
                                    </td>
                                    <td colSpan={2} className="py-3 px-2"></td>
                                </tr>
                                {/* Financial Summary */}
                                {(freight > 0 || discount > 0) && (
                                    <tr className="border-t border-gray-300">
                                        <td colSpan={5} className="py-2 text-right font-medium text-sm text-gray-600">Subtotal</td>
                                        <td className="py-2 text-right font-medium text-sm">₹{subTotal.toFixed(2)}</td>
                                    </tr>
                                )}
                                {freight > 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-2 text-right font-medium text-sm text-gray-600">Freight Charges</td>
                                        <td className="py-2 text-right font-medium text-sm">+ ₹{freight.toFixed(2)}</td>
                                    </tr>
                                )}
                                {discount > 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-2 text-right font-medium text-sm text-gray-600">Discount</td>
                                        <td className="py-2 text-right font-medium text-sm">- ₹{discount.toFixed(2)}</td>
                                    </tr>
                                )}
                                <tr className="border-t-2 border-gray-800">
                                    <td colSpan={5} className="py-4 text-right font-bold uppercase text-sm">Grand Total</td>
                                    <td className="py-4 text-right font-bold text-xl">₹{grandTotal.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="font-bold text-sm text-gray-600 mb-1">Amount in words:</p>
                            <p className="italic font-medium mb-8 capitalize">{amountToWords(grandTotal)}</p>
                            <div className="flex justify-between items-end mt-16">
                                <div className="text-center"><div className="border-t border-gray-400 w-40 pt-2">Receiver's Signature</div></div>
                                <div className="text-center"><p className="font-bold mb-8"></p><div className="border-t border-gray-400 w-40 pt-2">Authorized Signatory</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PrintChecklistModal: React.FC<{
    bill: Bill;
    client: Client | undefined;
    filmTypes: FilmType[];
    inventory: FilmItem[];
    onClose: () => void;
}> = ({ bill, client, filmTypes, inventory, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate dynamic filename
    const getFilename = () => {
        const clientName = client?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'client';
        const dateStr = bill.date?.replace(/-/g, '') || 'date';
        return `${clientName}_${dateStr}_dispatch_checklist`;
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        await generatePDF('checklist-content', getFilename(), () => {
            setIsGenerating(false);
            onClose();
        });
    };

    const groupedItems = useMemo(() => {
        if (!bill.items) return [];
        const filmTypeMap = new Map(filmTypes.map(ft => [ft.id, ft.name]));
        const inventoryMap = new Map<string, FilmItem>(inventory.map(i => [i.id, i]));

        type GroupedBox = { filmTypeName: string; boxes: (BillItem & { mfgDate?: string; grossWeight?: number })[] };
        const grouped = bill.items.reduce((acc, item) => {
            if (!acc[item.filmTypeId]) {
                acc[item.filmTypeId] = {
                    filmTypeName: filmTypeMap.get(item.filmTypeId) || 'Unknown Item',
                    boxes: []
                };
            }
            const invItem = inventoryMap.get(item.itemId);

            acc[item.filmTypeId].boxes.push({
                ...item,
                mfgDate: invItem?.manufacturingDate,
                grossWeight: invItem?.grossWeight
            });
            return acc;
        }, {} as Record<string, GroupedBox>);

        return Object.values(grouped).map((g: GroupedBox) => {
            g.boxes.sort((a, b) => {
                const numA = parseInt(a.boxNumber.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.boxNumber.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
            return g;
        });
    }, [bill.items, filmTypes, inventory]);

    let globalSlNo = 0;

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with buttons */}
                <div className="bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Dispatch Checklist Preview</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* PDF Content - Scrollable */}
                <div className="overflow-y-auto flex-1">
                    <div id="checklist-content" className="p-8 bg-white">
                        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                            <h1 className="text-3xl font-bold uppercase tracking-wider">Dispatch Checklist</h1>
                            <p className="text-lg font-mono mt-2">{bill.billNumber}</p>
                        </div>
                        <div className="flex justify-between mb-8 bg-gray-50 p-4 rounded border border-gray-200">
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase">Client</span>
                                <span className="text-lg font-bold">{client?.name}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase">Dispatch Date</span>
                                <span className="text-lg font-bold">{formatDate(today)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase">Total Items</span>
                                <span className="text-lg font-bold">{bill.items?.length || 0} Boxes</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-800">
                                        <th className="py-2 px-2 text-left font-bold text-gray-600 w-12">Sl No</th>
                                        <th className="py-2 px-2 text-left font-bold text-gray-600">Box #</th>
                                        <th className="py-2 px-2 text-left font-bold text-gray-600">MFG Date</th>
                                        <th className="py-2 px-2 text-right font-bold text-gray-600">Gross Wt</th>
                                        <th className="py-2 px-2 text-right font-bold text-gray-600">Net Wt</th>
                                        <th className="py-2 px-2 text-center font-bold text-gray-600 w-16">Check</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedItems.map((group) => (
                                        <React.Fragment key={group.filmTypeName}>
                                            <tr className="bg-gray-100">
                                                <td colSpan={6} className="py-2 px-4 font-bold text-gray-800 border-y border-gray-300">
                                                    {group.filmTypeName} ({group.boxes.length} Boxes)
                                                </td>
                                            </tr>
                                            {group.boxes.map((box) => {
                                                globalSlNo++;
                                                return (
                                                    <tr key={box.itemId} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-2 px-2 text-gray-500">{globalSlNo}</td>
                                                        <td className="py-2 px-2 font-mono font-bold text-gray-800">{box.boxNumber}</td>
                                                        <td className="py-2 px-2 text-gray-600">
                                                            {box.mfgDate ? formatDate(box.mfgDate) : '-'}
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-gray-600">
                                                            {box.grossWeight ? box.grossWeight.toFixed(2) : '-'}
                                                        </td>
                                                        <td className="py-2 px-2 text-right font-bold text-gray-800">
                                                            {(box.netWeight || 0).toFixed(2)}
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <div className="w-4 h-4 border border-gray-400 inline-block rounded-sm"></div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-auto pt-8 border-t border-gray-200 flex justify-between">
                            <div><p className="text-xs font-bold text-gray-500 uppercase">Checked By</p><div className="mt-8 border-t border-gray-400 w-32"></div></div>
                            <div><p className="text-xs font-bold text-gray-500 uppercase">Loaded By</p><div className="mt-8 border-t border-gray-400 w-32"></div></div>
                            <div><p className="text-xs font-bold text-gray-500 uppercase">Driver Sign</p><div className="mt-8 border-t border-gray-400 w-32"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PrintLedgerModal: React.FC<{
    client: Client;
    transactions: any[];
    dateRange: { start: string, end: string };
    openingBalance: number;
    onClose: () => void;
}> = ({ client, transactions, dateRange, openingBalance, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const getFilename = () => {
        const clientName = client?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'client';
        return `Statement_${clientName}_${dateRange.start}_to_${dateRange.end}`;
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        await generatePDF('ledger-content', getFilename(), () => {
            setIsGenerating(false);
            onClose();
        });
    };

    let runningBalance = openingBalance;

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with buttons */}
                <div className="bg-white border-b p-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Statement Preview</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* PDF Content - Scrollable */}
                <div className="overflow-y-auto flex-1">
                    <div id="ledger-content" className="p-8 bg-white">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">Statement of Accounts</h1>
                            <h2 className="text-lg font-semibold text-gray-700 mt-1"></h2>
                            <p className="text-xs text-gray-500"></p>
                        </div>

                        <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-4">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block">Account Of</span>
                                <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                                <p className="text-sm text-gray-600 max-w-sm">{client.address}</p>
                                <p className="text-sm text-gray-600 mt-1">Phone: {client.phone}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-500 uppercase block">Statement Period</span>
                                <p className="text-lg font-medium text-gray-900">{formatDate(dateRange.start)} <span className="text-gray-400 mx-1">to</span> {formatDate(dateRange.end)}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm border-collapse mb-8">
                            <thead>
                                <tr className="border-y-2 border-gray-800 bg-gray-50">
                                    <th className="py-2 px-2 text-left font-bold w-24">Date</th>
                                    <th className="py-2 px-2 text-left font-bold">Particulars</th>
                                    <th className="py-2 px-2 text-left font-bold w-24">Vch Type</th>
                                    <th className="py-2 px-2 text-left font-bold w-24">Vch No.</th>
                                    <th className="py-2 px-2 text-right font-bold w-32">Debit (₹)</th>
                                    <th className="py-2 px-2 text-right font-bold w-32">Credit (₹)</th>
                                    <th className="py-2 px-2 text-right font-bold w-32">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <td className="py-2 px-2 italic text-gray-600">{formatDate(dateRange.start)}</td>
                                    <td className="py-2 px-2 font-semibold italic">Opening Balance b/f</td>
                                    <td className="py-2 px-2"></td>
                                    <td className="py-2 px-2"></td>
                                    <td className="py-2 px-2 text-right text-gray-600">{openingBalance > 0 ? openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                                    <td className="py-2 px-2 text-right text-gray-600">{openingBalance < 0 ? Math.abs(openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                                    <td className="py-2 px-2 text-right font-bold">
                                        {Math.abs(openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                                    </td>
                                </tr>

                                {transactions.map((t) => {
                                    const isBill = t.tType === 'BILL';
                                    const debit = isBill ? (t.totalAmount || 0) : 0;
                                    const credit = !isBill ? (t.amount || 0) : 0;
                                    runningBalance = runningBalance + debit - credit;

                                    return (
                                        <tr key={t.id} className="border-b border-gray-100">
                                            <td className="py-2 px-2 text-gray-700">{formatDate(t.date)}</td>
                                            <td className="py-2 px-2">
                                                <div className="font-medium text-gray-900">{isBill ? 'To Sales Account' : `By ${t.method || 'Receipt'}`}</div>
                                                {t.description && <div className="text-xs text-gray-500 italic truncate max-w-xs">{t.description}</div>}
                                                {t.notes && <div className="text-xs text-gray-500 italic truncate max-w-xs">{t.notes}</div>}
                                            </td>
                                            <td className="py-2 px-2 text-gray-600">{isBill ? 'Sales' : 'Receipt'}</td>
                                            <td className="py-2 px-2 text-gray-600">{isBill ? t.billNumber : '-'}</td>
                                            <td className="py-2 px-2 text-right font-medium">{debit ? debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                                            <td className="py-2 px-2 text-right font-medium">{credit ? credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                                            <td className="py-2 px-2 text-right font-bold text-gray-800">
                                                {Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {runningBalance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-gray-800 bg-gray-50">
                                    <td colSpan={4} className="py-3 px-2 text-right font-bold uppercase text-xs tracking-wider">Closing Balance</td>
                                    <td className="py-3 px-2 text-right font-bold text-lg text-gray-900" colSpan={3}>
                                        ₹ {Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {runningBalance >= 0 ? 'Dr' : 'Cr'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="mt-auto flex justify-between items-end pt-12">
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-48 pt-2 text-xs uppercase font-bold text-gray-500">Customer Signature</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-sm mb-12"></div>
                                <div className="border-t border-gray-400 w-48 pt-2 text-xs uppercase font-bold text-gray-500">Authorized Signatory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useMemo } from 'react';
import { FilmType, Client, Bill, LedgerPayment, FilmItem } from '../../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
    Package, IndianRupee, 
    Users, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight,
    Activity, ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
    bills: Bill[];
    clients: Client[];
    ledgerPayments: LedgerPayment[];
    filmTypes: FilmType[];
    inventory: FilmItem[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const DashboardView: React.FC<DashboardViewProps> = ({ bills, clients, ledgerPayments, filmTypes, inventory }) => {

    const { currentMonth, prevMonth } = useMemo(() => {
        const now = new Date();
        const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        let py = now.getFullYear();
        let pm = now.getMonth();
        if (pm === 0) {
            py -= 1;
            pm = 12;
        }
        const prevM = `${py}-${String(pm).padStart(2, '0')}`;
        return { currentMonth: cm, prevMonth: prevM };
    }, []);

    // -----------------------------------------------------
    // 1. KPI Calculations
    // -----------------------------------------------------
    const kpiData = useMemo(() => {
        let cmRevenue = 0, pmRevenue = 0;
        let totalSales = 0, totalReceipts = 0;
        
        bills.forEach(b => {
            totalSales += b.totalAmount || 0;
            const month = b.date?.substring(0, 7);
            if (month === currentMonth) cmRevenue += b.totalAmount || 0;
            else if (month === prevMonth) pmRevenue += b.totalAmount || 0;
        });

        ledgerPayments.forEach(p => {
            totalReceipts += p.amount || 0;
        });

        const outstanding = totalSales - totalReceipts;
        
        let activeStockWeight = 0;
        let cmManufacturedWeight = 0;
        
        inventory.forEach(item => {
            if (item.status === 'In Stock') {
                activeStockWeight += item.netWeight || 0;
            }
            if (item.manufacturingDate?.substring(0, 7) === currentMonth) {
                cmManufacturedWeight += item.netWeight || 0;
            }
        });

        const revenueTrend = pmRevenue === 0 ? 100 : ((cmRevenue - pmRevenue) / pmRevenue) * 100;

        return { cmRevenue, revenueTrend, outstanding, activeStockWeight, cmManufacturedWeight };
    }, [bills, ledgerPayments, inventory, currentMonth, prevMonth]);

    // -----------------------------------------------------
    // 2. Chart Data Prep: Monthly Revenue vs Receipts
    // -----------------------------------------------------
    const revenueVsReceiptsData = useMemo(() => {
        const monthlyData: Record<string, { month: string; Revenue: number; Receipts: number }> = {};
        
        bills.forEach(b => {
            const m = b.date?.substring(0, 7) || 'Unknown';
            if (!monthlyData[m]) monthlyData[m] = { month: m, Revenue: 0, Receipts: 0 };
            monthlyData[m].Revenue += b.totalAmount || 0;
        });
        
        ledgerPayments.forEach(p => {
            const m = p.date?.substring(0, 7) || 'Unknown';
            if (!monthlyData[m]) monthlyData[m] = { month: m, Revenue: 0, Receipts: 0 };
            monthlyData[m].Receipts += p.amount || 0;
        });

        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    }, [bills, ledgerPayments]);

    // -----------------------------------------------------
    // 3. Chart Data Prep: Monthly Production vs Sales Volume
    // -----------------------------------------------------
    const volumeData = useMemo(() => {
        const monthlyData: Record<string, { month: string; Manufactured: number; Sold: number }> = {};
        
        inventory.forEach(item => {
            const m = item.manufacturingDate?.substring(0, 7) || 'Unknown';
            if (!monthlyData[m]) monthlyData[m] = { month: m, Manufactured: 0, Sold: 0 };
            monthlyData[m].Manufactured += item.netWeight || 0;
        });

        bills.forEach(b => {
            const m = b.date?.substring(0, 7) || 'Unknown';
            if (!monthlyData[m]) monthlyData[m] = { month: m, Manufactured: 0, Sold: 0 };
            monthlyData[m].Sold += b.totalWeight || 0;
        });

        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    }, [inventory, bills]);

    // -----------------------------------------------------
    // 4. Chart Data Prep: Stock Distribution
    // -----------------------------------------------------
    const stockDistributionData = useMemo(() => {
        const dist: Record<string, number> = {};
        inventory.forEach(item => {
            if (item.status === 'In Stock') {
                dist[item.filmTypeId] = (dist[item.filmTypeId] || 0) + (item.netWeight || 0);
            }
        });
        return Object.entries(dist)
            .map(([id, weight]) => ({
                name: filmTypes.find(f => f.id === id)?.name || 'Unknown',
                value: Number(weight.toFixed(2))
            }))
            .filter(d => d.value > 0);
    }, [inventory, filmTypes]);

    // -----------------------------------------------------
    // 5. Advanced Insights
    // -----------------------------------------------------
    const topClients = useMemo(() => {
        const clientRevenue: Record<string, number> = {};
        bills.forEach(b => {
            if (b.date?.substring(0, 7) === currentMonth) {
                clientRevenue[b.clientId] = (clientRevenue[b.clientId] || 0) + (b.totalAmount || 0);
            }
        });
        return Object.entries(clientRevenue)
            .map(([id, rev]) => ({ client: clients.find(c => c.id === id)?.name || 'Unknown', revenue: rev }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [bills, clients, currentMonth]);

    const outstandingBreakdown = useMemo(() => {
        const clientBalances: Record<string, { sales: number; receipts: number }> = {};
        bills.forEach(b => {
            if (!clientBalances[b.clientId]) clientBalances[b.clientId] = { sales: 0, receipts: 0 };
            clientBalances[b.clientId].sales += b.totalAmount || 0;
        });
        ledgerPayments.forEach(p => {
            if (!clientBalances[p.clientId]) clientBalances[p.clientId] = { sales: 0, receipts: 0 };
            clientBalances[p.clientId].receipts += p.amount || 0;
        });
        
        return Object.entries(clientBalances)
            .map(([id, data]) => ({
                client: clients.find(c => c.id === id)?.name || 'Unknown',
                outstanding: data.sales - data.receipts
            }))
            .filter(d => d.outstanding > 10)
            .sort((a, b) => b.outstanding - a.outstanding)
            .slice(0, 5);
    }, [bills, ledgerPayments, clients]);

    const lowStockAlerts = useMemo(() => {
        return filmTypes.map(ft => {
            const stockCount = inventory.filter(i => i.filmTypeId === ft.id && i.status === 'In Stock').length;
            return { name: ft.name, count: stockCount };
        }).filter(ft => ft.count < 5).sort((a, b) => a.count - b.count);
    }, [filmTypes, inventory]);

    // Formatters
    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const formatWeight = (val: number) => `${val.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Revenue Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Rev This Month</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(kpiData.cmRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative mt-4 flex items-center text-sm">
                        {kpiData.revenueTrend >= 0 ? (
                            <span className="flex items-center text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
                                <ArrowUpRight className="w-4 h-4 mr-1" />
                                {kpiData.revenueTrend.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="flex items-center text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-md">
                                <ArrowDownRight className="w-4 h-4 mr-1" />
                                {Math.abs(kpiData.revenueTrend).toFixed(1)}%
                            </span>
                        )}
                        <span className="text-slate-400 ml-2">vs last month</span>
                    </div>
                </div>

                {/* Outstanding Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Outstanding</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(kpiData.outstanding)}</h3>
                        </div>
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative mt-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-600">Action Required</span> pending collections
                    </div>
                </div>

                {/* Active Stock Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Active Stock Volume</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatWeight(kpiData.activeStockWeight)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative mt-4 text-sm text-slate-500">
                        Available across <span className="font-medium text-slate-700">{filmTypes.length}</span> film types
                    </div>
                </div>

                {/* Manufactured Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Produced This Month</p>
                            <h3 className="text-2xl font-bold text-slate-800">{formatWeight(kpiData.cmManufacturedWeight)}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="relative mt-4 text-sm text-slate-500">
                        Total weight manufactured in {currentMonth}
                    </div>
                </div>
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Receipts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <IndianRupee className="w-5 h-5 mr-2 text-indigo-500" /> Revenue vs Receipts 
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueVsReceiptsData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                                <RechartsTooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), undefined]}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar yAxisId="left" dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar yAxisId="left" dataKey="Receipts" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Production vs Sales Volume */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-500" /> Production vs Sales Volume (kg)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorMfg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val}kg`} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatWeight(value), undefined]}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Area type="monotone" dataKey="Manufactured" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMfg)" />
                                <Area type="monotone" dataKey="Sold" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSold)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stock Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-indigo-500" /> Stock Distribution
                    </h3>
                    <div className="flex-1 min-h-[250px] relative flex justify-center items-center">
                        {stockDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockDistributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stockDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(value: number) => [formatWeight(value), undefined]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-400 text-sm">No stock data available</p>
                        )}
                        {stockDistributionData.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-slate-800">{stockDistributionData.length}</span>
                                    <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider">Types</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Clients & Outstanding */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <Users className="w-4 h-4 mr-2" /> Top Clients ({currentMonth})
                        </h3>
                        <div className="space-y-3">
                            {topClients.map((c, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 font-medium truncate pr-4">{i+1}. {c.client}</span>
                                    <span className="text-slate-900 font-bold bg-slate-50 px-2 py-1 rounded">{formatCurrency(c.revenue)}</span>
                                </div>
                            ))}
                            {topClients.length === 0 && <p className="text-xs text-slate-400">No billing data this month.</p>}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" /> Highest Outstanding
                        </h3>
                        <div className="space-y-3">
                            {outstandingBreakdown.map((c, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 font-medium truncate pr-4">{c.client}</span>
                                    <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">{formatCurrency(c.outstanding)}</span>
                                </div>
                            ))}
                            {outstandingBreakdown.length === 0 && <p className="text-xs text-slate-400">No outstanding balances!</p>}
                        </div>
                    </div>
                </div>

                {/* Low Stock & Activity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <ShieldAlert className="w-4 h-4 mr-2" /> Low Stock Alerts
                        </h3>
                        <div className="space-y-3">
                            {lowStockAlerts.length > 0 ? lowStockAlerts.map((ft, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 bg-rose-50/50 rounded-lg border border-rose-100">
                                    <span className="text-rose-800 font-medium truncate pr-4">{ft.name}</span>
                                    <span className="text-rose-600 font-bold whitespace-nowrap">{ft.count} boxes</span>
                                </div>
                            )) : (
                                <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium text-center">Stock levels are healthy!</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex-1">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                            <FileText className="w-4 h-4 mr-2" /> Recent Bills
                        </h3>
                        <div className="space-y-3">
                            {bills.slice(0, 4).map(bill => (
                                <div key={bill.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-bold text-slate-700">{bill.billNumber}</p>
                                        <p className="text-xs text-slate-500">{bill.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{formatCurrency(bill.totalAmount)}</p>
                                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{bill.status}</p>
                                    </div>
                                </div>
                            ))}
                            {bills.length === 0 && <p className="text-xs text-slate-400">No bills generated yet.</p>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardView;

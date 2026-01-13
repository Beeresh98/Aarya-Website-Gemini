
import React, { useState, useEffect, useRef } from 'react';
import { NAV_ITEMS, NavItemType } from './constants';
import Employees from './modules/Employees';
import Attendance from './modules/Attendance';
import Payroll from './modules/Payroll';
import Payments from './modules/Payments';
import Holidays from './modules/Holidays';
import Rules from './modules/Rules';
import ComingSoon from './modules/ComingSoon';
import Header from './components/Header';
import type { Employee, Holiday, Payment, AttendanceRecord, Department } from './types';
import { ChevronDoubleLeftIcon, BriefcaseIcon, CubeIcon, CloudArrowUpIcon, ArrowPathIcon, ShieldCheckIcon } from './components/icons/Icons';
import { db } from './firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Production from './modules/Production';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { generateBackup, restoreBackup } from './utils/backupService';

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
    </div>
);

const LandingPage: React.FC<{ onSelectMode: (mode: 'management' | 'production') => void, onLogout: () => void, userRole: string | null }> = ({ onSelectMode, onLogout, userRole }) => {
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAccessManagement = userRole === 'super_admin' || userRole === 'hr';
  const canAccessProduction = userRole === 'super_admin' || userRole === 'production';
  const isSuperAdmin = userRole === 'super_admin';

  const handleBackup = async () => {
    setIsBackupLoading(true);
    try {
        await generateBackup();
        alert("Backup downloaded successfully.");
    } catch (e) {
        alert("Backup failed. See console.");
    } finally {
        setIsBackupLoading(false);
    }
  };

  const handleRestoreClick = () => {
      if (window.confirm("WARNING: Restoring will OVERWRITE current data. Are you sure?")) {
          fileInputRef.current?.click();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setRestoreStatus("Restoring database... please wait.");
      try {
          await restoreBackup(file);
          alert("System restored successfully. The page will now reload.");
          window.location.reload();
      } catch (e) {
          setRestoreStatus(null);
          alert("Restore failed. Invalid file or permission error.");
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 z-0"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl z-0"></div>
        
        {/* Header Section */}
        <div className="relative z-10 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-bold text-white">Good Morning</h1>
                <p className="text-primary-100 mt-1">Welcome to the Aarya Command Center</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex flex-col items-end text-right text-white">
                    <span className="text-sm font-medium opacity-90">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span className="text-xs opacity-75 uppercase tracking-wider">{userRole?.replace('_', ' ')}</span>
                </div>
                <button onClick={onLogout} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium">
                    Sign Out
                </button>
            </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="relative z-10 flex-1 px-6 pb-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Modules */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-semibold text-white/90 mb-4">Select Module</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Management Card */}
                    <div 
                        onClick={canAccessManagement ? () => onSelectMode('management') : undefined}
                        className={`group relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all duration-300 ${canAccessManagement ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
                    >
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <BriefcaseIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Management</h3>
                            <p className="text-gray-500 mb-6">HR, Attendance, Payroll & Employee Data</p>
                            <div className="flex items-center text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                                Access Dashboard &rarr;
                            </div>
                        </div>
                    </div>

                    {/* Production Card */}
                    <div 
                        onClick={canAccessProduction ? () => onSelectMode('production') : undefined}
                        className={`group relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all duration-300 ${canAccessProduction ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
                    >
                         <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-50 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <CubeIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Production</h3>
                            <p className="text-gray-500 mb-6">Inventory, Billing, Clients & Ledger</p>
                             <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                                Access Dashboard &rarr;
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Health / Status */}
                <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-xl p-6 shadow-sm mt-8">
                     <div className="flex items-center space-x-3 text-green-700">
                        <ShieldCheckIcon className="w-6 h-6" />
                        <span className="font-semibold">System Operational</span>
                        <span className="text-sm text-gray-500 ml-auto">Database Connected • Secure Connection</span>
                     </div>
                </div>
            </div>

            {/* Right Column: Utilities & Stats */}
            <div className="space-y-6">
                
                {/* System Maintenance Widget (Backup/Restore) */}
                {isSuperAdmin && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-primary-500">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">System Maintenance</h3>
                        <p className="text-sm text-gray-500 mb-6">Manage database integrity. Regular backups are recommended.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={handleBackup}
                                disabled={isBackupLoading || !!restoreStatus}
                                className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-gray-700 font-medium group"
                            >
                                <CloudArrowUpIcon className="w-5 h-5 mr-3 text-primary-500 group-hover:scale-110 transition-transform" />
                                {isBackupLoading ? 'Creating Backup...' : 'Download Backup'}
                            </button>
                            
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            
                            <button 
                                onClick={handleRestoreClick}
                                disabled={isBackupLoading || !!restoreStatus}
                                className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-colors text-gray-700 hover:text-red-700 font-medium group"
                            >
                                <ArrowPathIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500 group-hover:rotate-180 transition-all duration-500" />
                                {restoreStatus ? 'Restoring...' : 'Restore Database'}
                            </button>
                        </div>
                        {restoreStatus && <p className="text-xs text-center text-blue-600 mt-3 animate-pulse">{restoreStatus}</p>}
                    </div>
                )}

                {/* Quick Stats Placeholder (Visual Only for Landing) */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                    <h3 className="text-lg font-bold mb-1">Quick Stats</h3>
                    <p className="text-indigo-200 text-sm mb-6">Overview</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-xs text-indigo-200 mb-1">Modules</p>
                            <p className="text-2xl font-bold">2</p>
                        </div>
                         <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                            <p className="text-xs text-indigo-200 mb-1">Status</p>
                            <p className="text-lg font-bold text-green-300">Active</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};


const MainContent: React.FC = () => {
  const { currentUser, userRole, loading, logout } = useAuth();
  const [appMode, setAppMode] = useState<'landing' | 'management' | 'production'>('landing');
  const [activeTab, setActiveTab] = useState<NavItemType['id']>('employees');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (appMode !== 'management') {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    const handleFetchError = (error: Error, collectionName: string) => {
        console.error(`Error fetching ${collectionName} from Firestore: `, error);
        alert(`Could not connect to the ${collectionName} collection. Please check your Firebase configuration and security rules.`);
    };

    const employeeUnsub = onSnapshot(collection(db, "employees"), (snapshot) => {
        const empList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(empList);
    }, (error) => handleFetchError(error, 'employees'));
    
    const departmentUnsub = onSnapshot(collection(db, "departments"), (snapshot) => {
        const deptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
        setDepartments(deptList.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => handleFetchError(error, 'departments'));
    
    const holidayUnsub = onSnapshot(collection(db, "holidays"), (snapshot) => {
        const holidayList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
        setHolidays(holidayList.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }, (error) => handleFetchError(error, 'holidays'));

    const paymentUnsub = onSnapshot(collection(db, "payments"), (snapshot) => {
        const paymentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        setPayments(paymentList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => handleFetchError(error, 'payments'));
    
    const attendanceUnsub = onSnapshot(collection(db, "attendance"), (snapshot) => {
        const attendanceData = snapshot.docs.reduce((acc, doc) => {
            acc[doc.id] = doc.data() as AttendanceRecord;
            return acc;
        }, {} as Record<string, AttendanceRecord>);
        setAttendance(attendanceData);
    }, (error) => handleFetchError(error, 'attendance'));

    // A simple way to stop loading, assuming snapshots load quickly
    const loadingTimer = setTimeout(() => setIsDataLoading(false), 1500);

    // Cleanup function to unsubscribe from listeners on component unmount
    return () => {
      employeeUnsub();
      departmentUnsub();
      holidayUnsub();
      paymentUnsub();
      attendanceUnsub();
      clearTimeout(loadingTimer);
    };
  }, [appMode]);

  if (loading) {
      return <Spinner />;
  }

  if (!currentUser) {
      return <Login />;
  }

  const activeEmployees = employees.filter(e => e.status === 'Active');

  const renderContent = () => {
    if (isDataLoading) {
      return <Spinner />;
    }
    switch (activeTab) {
      case 'employees':
        return <Employees employees={employees} departments={departments} />;
      case 'attendance':
        return <Attendance employees={activeEmployees} attendance={attendance} holidays={holidays} />;
      case 'payroll':
        return <Payroll employees={activeEmployees} attendance={attendance} holidays={holidays} />;
      case 'payments':
        return <Payments payments={payments} employees={activeEmployees} />;
      case 'holidays':
        return <Holidays holidays={holidays} />;
      case 'rules':
        return <Rules />;
      case 'contractors':
      case 'reports':
        return <ComingSoon />;
      default:
        return <Employees employees={employees} departments={departments} />;
    }
  };

  if (appMode === 'landing') {
    return <LandingPage onSelectMode={setAppMode} onLogout={logout} userRole={userRole} />;
  }

  if (appMode === 'production') {
    return <Production onExit={() => setAppMode('landing')} />;
  }
  
  const activeNavItem = NAV_ITEMS.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 transform w-64 
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 flex-shrink-0">
          <h1 className={`text-2xl font-bold text-primary-700 transition-all duration-300 ${isSidebarCollapsed ? 'md:opacity-0' : 'opacity-100'}`}>Aarya</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
              disabled={item.disabled}
              title={isSidebarCollapsed ? item.label : ''}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${ isSidebarCollapsed ? 'md:justify-center' : ''} ${
                activeTab === item.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`h-6 w-6 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'} ${activeTab === item.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                {item.icon}
              </span>
              <div className={`flex-1 text-left ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                <span className="truncate">{item.label}</span>
                {item.soon && <span className="ml-auto text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Soon</span>}
              </div>
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t border-gray-200 hidden md:flex ${isSidebarCollapsed ? 'justify-center' : ''}`}>
           <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
              <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
           </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={activeNavItem?.label || 'Dashboard'} onBack={() => setAppMode('landing')} onToggleMobileSidebar={() => setIsMobileSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MainContent />
        </AuthProvider>
    );
};

export default App;

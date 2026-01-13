import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, Holiday } from '../types';
import { AttendanceStatus } from '../types';
import { db } from '../firebaseConfig';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

interface AttendanceProps {
  employees: Employee[];
  attendance: Record<string, AttendanceRecord>;
  holidays: Holiday[];
}

const toISODateString = (date: Date) => date.toISOString().split('T')[0];
const today = toISODateString(new Date());

const statusColors: Record<AttendanceStatus, string> = {
    [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
    [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
    [AttendanceStatus.LEAVE]: 'bg-yellow-100 text-yellow-800',
    [AttendanceStatus.HOLIDAY]: 'bg-blue-100 text-blue-800',
    [AttendanceStatus.WEEKEND]: 'bg-gray-100 text-gray-600',
};

// Moved helper function outside the component for purity
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const Attendance: React.FC<AttendanceProps> = ({ employees, attendance, holidays }) => {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<string>(today.substring(0, 7));
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [monthlySelection, setMonthlySelection] = useState<{ employeeId: string; dates: Set<string> } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // FIX: Moved memoized calculations to the top level of the component
  // to avoid conditional hook calls, which was causing React error #310.
  const [year, month] = useMemo(() => selectedMonth.split('-').map(Number), [selectedMonth]);
  const daysInMonth = useMemo(() => getDaysInMonth(year, month - 1), [year, month]);
  const holidayDates = useMemo(() => new Set(holidays.map(h => h.date)), [holidays]);

  const monthlyStats = useMemo(() => {
      const stats: Record<string, { present: number, absent: number, leave: number, paidDays: number, unpaidDays: number }> = {};
      employees.forEach(emp => {
          let present = 0, absent = 0, leave = 0, paidDays = 0, unpaidDays = 0;
          for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
              const date = new Date(dateStr);
              date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
              const dayOfWeek = date.getDay();
              
              const status = attendance[dateStr]?.[emp.id];
              const isHoliday = holidayDates.has(dateStr);
              const isSunday = dayOfWeek === 0;

              if (status === AttendanceStatus.PRESENT) present++;
              if (status === AttendanceStatus.ABSENT) absent++;
              if (status === AttendanceStatus.LEAVE) leave++;

              if (isHoliday || isSunday || status === AttendanceStatus.PRESENT || status === AttendanceStatus.LEAVE) {
                  paidDays++;
              } else {
                  unpaidDays++;
              }
          }
          stats[emp.id] = { present, absent, leave, paidDays, unpaidDays };
      });
      return stats;
  }, [selectedMonth, employees, attendance, daysInMonth, holidayDates]);


  const updateAttendanceInFirestore = async (date: string, recordsToUpdate: AttendanceRecord) => {
    try {
      const attendanceDocRef = doc(db, 'attendance', date);
      await setDoc(attendanceDocRef, recordsToUpdate, { merge: true });
    } catch (e: any) {
      console.error("Error updating attendance: ", e);
      alert(`Failed to update attendance. The database rejected the change. Please check Firestore security rules or your network connection. Error: ${e.message}`);
    }
  };

  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    updateAttendanceInFirestore(selectedDate, { [employeeId]: status });
  };

  const handleBulkUpdate = (status: AttendanceStatus) => {
    const updatedRecords: AttendanceRecord = {};
    selectedEmployees.forEach(empId => {
      updatedRecords[empId] = status;
    });

    updateAttendanceInFirestore(selectedDate, updatedRecords);
    setSelectedEmployees([]);
  }

  const handleSelectEmployee = (empId: string, isSelected: boolean) => {
    if (isSelected) {
        setSelectedEmployees([...selectedEmployees, empId]);
    } else {
        setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
    }
  }

  const handleSelectAll = (isSelect: boolean) => {
    if (isSelect) {
        setSelectedEmployees(employees.map(e => e.id));
    } else {
        setSelectedEmployees([]);
    }
  }
  
  const handleMonthlyBulkUpdate = async (status: AttendanceStatus) => {
    if (!monthlySelection || monthlySelection.dates.size === 0) return;

    try {
        const batch = writeBatch(db);
        monthlySelection.dates.forEach(dateStr => {
            const docRef = doc(db, 'attendance', dateStr);
            batch.set(docRef, { [monthlySelection.employeeId]: status }, { merge: true });
        });
        await batch.commit();
        setMonthlySelection(null); // Clear selection on success
        setIsDragging(false);
    } catch (e: any) {
        console.error("Error in bulk monthly attendance update: ", e);
        alert(`Failed to bulk update attendance. The database rejected the changes. Please check Firestore security rules. Error: ${e.message}`);
    }
  };

  const handleCellMouseDown = (employeeId: string, dateStr: string) => {
    setIsDragging(true);

    // If clicking on a different employee, reset selection
    if (monthlySelection?.employeeId !== employeeId) {
        const newSelection = new Set([dateStr]);
        setMonthlySelection({ employeeId, dates: newSelection });
        setDragMode('select');
        return;
    }
    
    // Continue with the same employee
    const newDates = new Set(monthlySelection.dates);
    const isCurrentlySelected = newDates.has(dateStr);

    if (isCurrentlySelected) {
        newDates.delete(dateStr);
        setDragMode('deselect');
    } else {
        newDates.add(dateStr);
        setDragMode('select');
    }
    setMonthlySelection({ employeeId, dates: newDates });
  };
  
  const handleCellMouseEnter = (employeeId: string, dateStr: string) => {
      if (!isDragging || monthlySelection?.employeeId !== employeeId) return;

      const newDates = new Set(monthlySelection.dates);
      if (dragMode === 'select') {
          newDates.add(dateStr);
      } else {
          newDates.delete(dateStr);
      }
      setMonthlySelection({ employeeId, dates: newDates });
  };


  const renderDailyView = () => (
    <div className="space-y-4">
        <div>
            <div className="flex flex-wrap items-center space-x-4">
                <h3 className="text-lg font-medium">Mark Attendance for:</h3>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    max={today}
                    className="p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
            </div>
            <p className="text-xs text-gray-500 mt-1">Note: Date format is determined by your browser's settings.</p>
        </div>

        {selectedEmployees.length > 0 && (
            <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 space-y-2 sm:space-y-0">
                <span className="text-sm font-medium text-primary-700">{selectedEmployees.length} employee(s) selected</span>
                <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-sm text-gray-600 mb-1 sm:mb-0">Mark all selected as:</span>
                    <button onClick={() => handleBulkUpdate(AttendanceStatus.PRESENT)} className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 hover:bg-green-200">Present</button>
                    <button onClick={() => handleBulkUpdate(AttendanceStatus.ABSENT)} className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 hover:bg-red-200">Absent</button>
                    <button onClick={() => handleBulkUpdate(AttendanceStatus.LEAVE)} className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Leave</button>
                </div>
            </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                checked={selectedEmployees.length === employees.length && employees.length > 0}
                                onChange={e => handleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    checked={selectedEmployees.includes(emp.id)}
                                    onChange={e => handleSelectEmployee(emp.id, e.target.checked)}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                    {Object.values(AttendanceStatus).filter(s => s !== AttendanceStatus.HOLIDAY && s !== AttendanceStatus.WEEKEND).map(status => (
                                        <button key={status} onClick={() => handleStatusChange(emp.id, status)}
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${attendance[selectedDate]?.[emp.id] === status ? statusColors[status] : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );

  const renderMonthlyView = () => {
    // FIX: Removed memoized calculations from this nested function.
    // They are now at the top level of the component and available in this scope.

    const handleToggleExpand = (empId: string) => {
      setExpandedEmployeeId(prev => (prev === empId ? null : empId));
      setMonthlySelection(null);
      setIsDragging(false);
    }
    
    const renderCalendar = (employeeId: string) => {
        const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
        const calendarDays = Array.from({length: firstDayOfMonth}, (_, i) => ({key: `empty-${i}`, day: null})).concat(
            // Fix: Changed key from a number to a string to resolve TypeScript error with array concat.
            Array.from({length: daysInMonth}, (_, i) => ({key: String(i + 1), day: i + 1}))
        );
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="mt-4 pt-4 border-t border-gray-200" onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
              {monthlySelection?.employeeId === employeeId && monthlySelection.dates.size > 0 && (
                <div className="mb-3 bg-primary-50 p-2 rounded-lg flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 z-30 border border-primary-200">
                    <span className="text-sm font-bold text-primary-700 px-1">{monthlySelection.dates.size} days selected</span>
                    <div className="flex items-center space-x-1">
                      <button title="Mark Present" onClick={() => handleMonthlyBulkUpdate(AttendanceStatus.PRESENT)} className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200">Present</button>
                      <button title="Mark Absent" onClick={() => handleMonthlyBulkUpdate(AttendanceStatus.ABSENT)} className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200">Absent</button>
                      <button title="Mark Leave" onClick={() => handleMonthlyBulkUpdate(AttendanceStatus.LEAVE)} className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Leave</button>
                      <button title="Clear Selection" onClick={() => setMonthlySelection(null)} className="px-2 py-1 text-gray-400 hover:text-gray-700 font-bold text-lg leading-none">&times;</button>
                    </div>
                </div>
              )}
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-semibold mb-2">
                  {weekDays.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({key, day}) => {
                      if (day === null) return <div key={key}></div>;

                      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                      const date = new Date(dateStr);
                      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                      const dayOfWeek = date.getDay();
                      
                      let status = attendance[dateStr]?.[employeeId];
                      if(!status) {
                         if(holidayDates.has(dateStr)) status = AttendanceStatus.HOLIDAY;
                         else if (dayOfWeek === 0) status = AttendanceStatus.HOLIDAY;
                         else if (dayOfWeek === 6) status = AttendanceStatus.WEEKEND;
                      }
                      
                      const statusChar = status ? status.charAt(0) : '';
                      const color = status ? statusColors[status] : 'bg-white text-gray-700 hover:bg-gray-100';
                      const isSelected = monthlySelection?.employeeId === employeeId && monthlySelection.dates.has(dateStr);

                      return (
                        <div key={key} 
                            className={`h-8 sm:h-9 w-full flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 text-xs sm:text-sm ${ isSelected ? 'ring-2 ring-primary-500 z-10 scale-110' : 'hover:scale-105'}`}
                            onMouseDown={() => handleCellMouseDown(employeeId, dateStr)}
                            onMouseEnter={() => handleCellMouseEnter(employeeId, dateStr)}
                        >
                            <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg font-bold ${color}`}>
                                <span>{day}</span>
                                {statusChar && <span className="text-[9px] -mt-1 font-bold uppercase">{statusChar}</span>}
                            </div>
                        </div>
                      )
                  })}
              </div>
            </div>
        )
    }

    const StatPill: React.FC<{label: string, value: number, color: string}> = ({label, value, color}) => (
        <div className="flex flex-col items-center p-2 rounded-md bg-gray-50 flex-1">
            <span className="text-base font-bold text-gray-800">{value}</span>
            <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
        </div>
    )

    return (
      <div className="space-y-4">
          <div className="flex flex-wrap items-center space-x-4">
              <h3 className="text-lg font-medium">Monthly Summary for:</h3>
              <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={e => {setSelectedMonth(e.target.value); setExpandedEmployeeId(null);}}
                  max={today.substring(0, 7)}
                  className="p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {employees.map(emp => {
                const stats = monthlyStats[emp.id];
                const isExpanded = expandedEmployeeId === emp.id;

                return (
                    <div key={emp.id} className={`bg-white shadow-md rounded-lg p-4 transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary-500 shadow-xl' : 'hover:shadow-lg'}`}>
                       <div className="flex justify-between items-center cursor-pointer" onClick={() => handleToggleExpand(emp.id)}>
                           <div>
                              <h4 className="font-bold text-gray-800">{emp.firstName} {emp.lastName}</h4>
                              <p className="text-xs text-gray-500">{emp.employeeCode}</p>
                           </div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                           </svg>
                       </div>
                       
                        <div className="mt-3 flex items-center justify-between space-x-2">
                           <StatPill label="Present" value={stats.present} color="text-green-600" />
                           <StatPill label="Absent" value={stats.absent} color="text-red-600" />
                           <StatPill label="Leave" value={stats.leave} color="text-yellow-600" />
                           <StatPill label="Paid Days" value={stats.paidDays} color="text-blue-600" />
                        </div>
                        
                        {isExpanded && renderCalendar(emp.id)}
                    </div>
                )
            })}
          </div>
      </div>
    )
  };

  return (
    <div className={isDragging ? 'no-select' : ''}>
        <div className="mb-6 bg-white p-2 rounded-lg shadow-sm inline-flex">
            <button onClick={() => setView('daily')} className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'daily' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>Daily Marking</button>
            <button onClick={() => setView('monthly')} className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'monthly' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>Monthly View</button>
        </div>
        {view === 'daily' && renderDailyView()}
        {view === 'monthly' && renderMonthlyView()}
    </div>
  );
};

export default Attendance;
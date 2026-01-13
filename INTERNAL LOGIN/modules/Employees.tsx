
import React, { useState, FormEvent, useMemo } from 'react';
import type { Employee, Department } from '../types';
import Modal from '../components/Modal';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';


interface EmployeesProps {
  employees: Employee[];
  departments: Department[];
}

const formInputClass = "mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500";

const ConfirmationDialog: React.FC<{
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-md ${confirmButtonClass}`}>{confirmButtonText}</button>
        </div>
      </div>
    </div>
  );
};


const EmployeeForm: React.FC<{
  onSubmit: (employee: Omit<Employee, 'id' | 'employeeCode'>) => Promise<void>;
  onDeactivateRequest: () => void;
  onClose: () => void;
  employee?: Employee | null;
  departments: Department[];
  isSaving: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  onDirty: () => void;
}> = ({ onSubmit, onDeactivateRequest, onClose, employee, departments, isSaving, error, setError, onDirty }) => {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    departmentId: employee?.departmentId || (departments[0]?.id || ''),
    baseSalary: employee?.baseSalary || 0,
    status: employee?.status || 'Active',
  });

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setError(null); // Clear error on new input
    onDirty();
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700">Employee Code</label>
           {employee ? (
            <>
              <div className="mt-1 block w-full bg-gray-200 border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-not-allowed">
                  {employee.employeeCode}
              </div>
              <p className="text-xs text-gray-500 mt-1">Employee code is auto-generated and cannot be changed.</p>
            </>
           ) : (
             <div className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500">
                Will be generated on save
            </div>
           )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Salary (₹)</label>
          <input type="number" value={formData.baseSalary} min="0" onChange={(e) => handleChange('baseSalary', Number(e.target.value))} className={formInputClass} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className={formInputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input type="text" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className={formInputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Department</label>
        <select value={formData.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} className={formInputClass} required>
           {departments.length === 0 && <option>Please add a department first</option>}
          {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
        </select>
      </div>

       {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4" role="alert">
            <div className="flex">
                <div className="py-1">
                    <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="font-bold text-red-800">Save Failed</p>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <div>
          {employee && employee.status === 'Active' && (
            <button type="button" onClick={onDeactivateRequest} disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
                {isSaving ? 'Deactivating...' : 'Deactivate'}
            </button>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Cancel</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
            {isSaving ? 'Saving...' : (employee ? 'Save Changes' : 'Add Employee')}
            </button>
        </div>
      </div>
    </form>
  );
};

const DepartmentManager: React.FC<{
  departments: Department[];
  employees: Employee[];
  onClose: () => void;
  setPageError: (error: string | null) => void;
}> = ({ departments, employees, onClose, setPageError }) => {
    const [newDeptName, setNewDeptName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string } | null>(null);

    const handleAdd = async () => {
        const trimmedName = newDeptName.trim();
        setError(null);
        if (!trimmedName) {
            setError("Department name cannot be empty.");
            return;
        }
        if (departments.some(d => d.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError("A department with this name already exists.");
            return;
        }
        if (isAdding) return;

        setIsAdding(true);

        const existingCodes = departments.map(d => d.departmentCode).filter(Boolean);
        let newDeptNumber = 1;
        if (existingCodes.length > 0) {
            const maxNumber = Math.max(...existingCodes.map(code => {
                const parts = code.split('/');
                return parseInt(parts[parts.length - 1], 10);
            }));
            newDeptNumber = maxNumber + 1;
        }
        const newDeptCode = `ARY/DEP/${String(newDeptNumber).padStart(2, '0')}`;
        
        const newDeptData = { name: trimmedName, departmentCode: newDeptCode };
        
        try {
            await addDoc(collection(db, 'departments'), newDeptData);
            setNewDeptName('');
        } catch (e: any) {
            console.error("Error adding department: ", e);
            setError(`Could not add department. Error: ${e.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteRequest = (id: string) => {
        const isDeptInUse = employees.some(emp => emp.departmentId === id);
        if (isDeptInUse) {
            setPageError('Cannot delete department. It is assigned to one or more employees. Please re-assign them before deleting.');
            return;
        }
        setConfirmAction({ id });
    };
    
    const performDelete = async () => {
      if (!confirmAction) return;
      try {
        await deleteDoc(doc(db, 'departments', confirmAction.id));
      } catch (e: any) {
        console.error("Error deleting department: ", e);
        setPageError(`Failed to delete department. Error: ${e.message}`);
      } finally {
        setConfirmAction(null);
      }
    };

    return (
        <>
        <ConfirmationDialog 
            isOpen={!!confirmAction}
            onCancel={() => setConfirmAction(null)}
            onConfirm={performDelete}
            title="Delete Department"
            message="Are you sure you want to delete this department? This action cannot be undone."
            confirmButtonText="Delete"
        />
        <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800">Existing Departments</h4>
            <ul className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border">
                {departments.map(dept => (
                    <li key={dept.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                        <div>
                            <span className="font-medium">{dept.name}</span>
                            <span className="text-xs text-gray-500 block">{dept.departmentCode}</span>
                        </div>
                        <button onClick={() => handleDeleteRequest(dept.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Delete</button>
                    </li>
                ))}
            </ul>
            <div className="flex space-x-2 pt-4 border-t">
                <input type="text" value={newDeptName} onChange={e => { setNewDeptName(e.target.value); setError(null); }} placeholder="New department name" className={`${formInputClass} flex-grow`} />
                <button onClick={handleAdd} disabled={isAdding} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                    {isAdding ? 'Adding...' : 'Add'}
                </button>
            </div>
             {error && <p className="text-sm text-red-600">{error}</p>}
             <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Close</button>
            </div>
        </div>
        </>
    );
};


const Employees: React.FC<EmployeesProps> = ({ employees, departments }) => {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDeactivation, setConfirmDeactivation] = useState<Employee | null>(null);


  const departmentMap = useMemo(() => {
    return new Map(departments.map(dept => [dept.id, dept.name]));
  }, [departments]);

  const handleCloseEmployeeModal = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        setIsDirty(false);
      }
    } else {
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormError(null);
    setIsDirty(false);
    setIsEmployeeModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormError(null);
    setIsDirty(false);
    setIsEmployeeModalOpen(true);
  };
  
  const handleDeactivateRequest = () => {
      if (editingEmployee) {
          setConfirmDeactivation(editingEmployee);
      }
  };
  
  const performDeactivate = async () => {
    if (!confirmDeactivation) return;
    
    setIsSaving(true);
    setFormError(null);
    try {
        const employeeDoc = doc(db, 'employees', confirmDeactivation.id);
        await updateDoc(employeeDoc, { status: 'Inactive' });
        setIsEmployeeModalOpen(false);
        setIsDirty(false);
    } catch (e: any) {
        console.error("Error deactivating employee: ", e);
        setFormError(`Failed to deactivate employee. Error: ${e.message}`);
    } finally {
        setIsSaving(false);
        setConfirmDeactivation(null);
    }
  };

  const handleFormSubmit = async (employeeData: Omit<Employee, 'id' | 'employeeCode'>) => {
    if (!employeeData.departmentId) {
        setFormError("Department is required.");
        return;
    }
    
    setIsSaving(true);
    setFormError(null);

    try {
        if (editingEmployee) {
            const employeeDoc = doc(db, 'employees', editingEmployee.id);
            await updateDoc(employeeDoc, employeeData);
        } else {
            const department = departments.find(d => d.id === employeeData.departmentId);
            if (!department || !department.departmentCode) {
                setFormError('Selected department is invalid or missing a department code.');
                setIsSaving(false);
                return;
            }
            
            const deptCodePart = department.departmentCode.split('/')[2];
            const employeesInDept = employees.filter(e => e.departmentId === employeeData.departmentId);
            
            let newEmpNumber = 1;
            if (employeesInDept.length > 0) {
                const maxEmpNumber = Math.max(0, ...employeesInDept.map(e => {
                    const parts = e.employeeCode.split('/');
                    return parseInt(parts[parts.length - 1], 10) || 0;
                }));
                newEmpNumber = maxEmpNumber + 1;
            }

            const newEmployeeCode = `ARY/DEP${deptCodePart}/${String(newEmpNumber).padStart(2, '0')}`;
            const finalEmployeeData = { ...employeeData, employeeCode: newEmployeeCode };
            
            await addDoc(collection(db, 'employees'), finalEmployeeData);
        }
        setIsEmployeeModalOpen(false); // Close modal only on success
        setEditingEmployee(null);
        setIsDirty(false);
    } catch (e: any) {
        console.error("Error saving employee: ", e);
        setFormError(`Could not save employee. Error: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => showInactive ? emp.status === 'Inactive' : emp.status === 'Active');

  return (
    <div>
      <ConfirmationDialog 
        isOpen={!!confirmDeactivation}
        onCancel={() => setConfirmDeactivation(null)}
        onConfirm={performDeactivate}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${confirmDeactivation?.firstName} ${confirmDeactivation?.lastName}? They will be excluded from payroll and attendance.`}
        confirmButtonText="Deactivate"
      />
      
      {pageError && (
         <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{pageError}</p>
            <button onClick={() => setPageError(null)} className="font-bold float-right -mt-5">&times;</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
            <button onClick={() => setIsDeptModalOpen(true)} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Manage Departments
            </button>
            <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                <input type="checkbox" checked={showInactive} onChange={() => setShowInactive(!showInactive)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-600">Show Inactive</span>
            </label>
        </div>
        <button onClick={handleAdd} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white shadow-md rounded-lg p-5 flex flex-col transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-primary-600 font-medium">{departmentMap.get(employee.departmentId) || 'Unassigned'}</p>
                    <p className="text-xs text-gray-400 mt-1">ID: {employee.employeeCode}</p>
                    <p className="text-sm text-gray-500 mt-2">Salary: ₹{(employee.baseSalary || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button onClick={() => handleEdit(employee)} className="text-sm font-medium text-primary-600 hover:text-primary-900">
                        View / Edit
                    </button>
                </div>
            </div>
        ))}
      </div>
      
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={handleCloseEmployeeModal}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <EmployeeForm
          onSubmit={handleFormSubmit}
          onDeactivateRequest={handleDeactivateRequest}
          onClose={handleCloseEmployeeModal}
          employee={editingEmployee}
          departments={departments}
          isSaving={isSaving}
          error={formError}
          setError={setFormError}
          onDirty={() => setIsDirty(true)}
        />
      </Modal>

      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Manage Departments"
      >
        <DepartmentManager departments={departments} employees={employees} onClose={() => setIsDeptModalOpen(false)} setPageError={setPageError} />
      </Modal>
    </div>
  );
};

export default Employees;

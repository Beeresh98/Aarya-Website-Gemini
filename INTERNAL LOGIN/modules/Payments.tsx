
import React, { useState, FormEvent } from 'react';
import type { Payment, Employee } from '../types';
import Modal from '../components/Modal';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface PaymentsProps {
  payments: Payment[];
  employees: Employee[];
}

const formInputClass = "mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500";
const today = new Date().toISOString().split('T')[0];

const formatDate = (isoDate: string): string => {
    if (!isoDate || !isoDate.includes('-')) return isoDate;
    const date = new Date(isoDate);
    // Adjust for timezone offset to prevent date from shifting
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); 
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
};


const PaymentForm: React.FC<{
  onSubmit: (payment: Omit<Payment, 'id'>) => Promise<void>;
  onClose: () => void;
  payment?: Payment | null;
  employees: Employee[];
  isSaving: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  onDirty: () => void;
}> = ({ onSubmit, onClose, payment, employees, isSaving, error, setError, onDirty }) => {
  const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
    employeeId: payment?.employeeId || (employees.length > 0 ? employees[0].id : ''),
    type: payment?.type || 'Incentive',
    amount: payment?.amount || 0,
    date: payment?.date || today,
    description: payment?.description || '',
  });

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setError(null);
    onDirty();
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Employee</label>
        <select value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} className={formInputClass} required>
          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
        </select>
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className={formInputClass} required>
          <option>Incentive</option>
          <option>Advance</option>
          <option>Deduction</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
        <input type="number" value={formData.amount} min="0" onChange={(e) => handleChange('amount', Number(e.target.value))} className={formInputClass} required />
      </div>
       <div>
            <div className="flex justify-between items-baseline">
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">Date</label>
                <span className="text-xs text-gray-500 pr-1">Format depends on browser locale</span>
            </div>
            <input id="paymentDate" type="date" value={formData.date} max={today} onChange={(e) => handleChange('date', e.target.value)} className={formInputClass} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description / Notes</label>
        <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className={formInputClass} required />
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

      <div className="flex justify-end space-x-2 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Cancel</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            {isSaving ? 'Saving...' : (payment ? 'Save Changes' : 'Add Payment')}
        </button>
      </div>
    </form>
  );
};

const Payments: React.FC<PaymentsProps> = ({ payments, employees }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  }

  const handleCloseModal = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        setIsModalOpen(false);
        setEditingPayment(null);
        setIsDirty(false);
      }
    } else {
      setIsModalOpen(false);
      setEditingPayment(null);
    }
  };

  const handleAdd = () => {
    setEditingPayment(null);
    setFormError(null);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormError(null);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (payment: Payment) => {
    setPaymentToDelete(payment);
  };

  const performDelete = async () => {
    if (!paymentToDelete) return;
    try {
      await deleteDoc(doc(db, 'payments', paymentToDelete.id));
    } catch (e: any) {
      console.error("Error deleting payment: ", e);
      setPageError(`Failed to delete payment record. Error: ${e.message}`);
    } finally {
      setPaymentToDelete(null);
    }
  };

 const handleFormSubmit = async (paymentData: Omit<Payment, 'id'>) => {
    if (!paymentData.employeeId) {
        setFormError("An employee must be selected.");
        return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
        if (editingPayment) {
            const paymentDoc = doc(db, 'payments', editingPayment.id);
            await updateDoc(paymentDoc, paymentData);
        } else {
            await addDoc(collection(db, 'payments'), paymentData);
        }
        setIsModalOpen(false); // Close only on success
        setEditingPayment(null);
        setIsDirty(false);
    } catch (e: any) {
        console.error("Error saving payment: ", e);
        setFormError(`Could not save payment. Error: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div>
       <ConfirmationDialog 
        isOpen={!!paymentToDelete}
        onCancel={() => setPaymentToDelete(null)}
        onConfirm={performDelete}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
      />

      {pageError && (
         <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p>{pageError}</p>
            <button onClick={() => setPageError(null)} className="font-bold float-right -mt-5">&times;</button>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={handleAdd} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Add Transaction
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getEmployeeName(payment.employeeId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.type === 'Incentive' ? 'bg-green-100 text-green-800' :
                      payment.type === 'Advance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{(payment.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{payment.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(payment)} className="text-primary-600 hover:text-primary-900">Edit</button>
                    <button onClick={() => handleDeleteRequest(payment)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPayment ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <PaymentForm
          onSubmit={handleFormSubmit}
          onClose={handleCloseModal}
          payment={editingPayment}
          employees={employees}
          isSaving={isSaving}
          error={formError}
          setError={setFormError}
          onDirty={() => setIsDirty(true)}
        />
      </Modal>
    </div>
  );
};

export default Payments;

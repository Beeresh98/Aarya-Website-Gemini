
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';

const COLLECTIONS_TO_BACKUP = [
  'employees',
  'departments',
  'holidays',
  'attendance',
  'payments',
  'users',
  'film_types',
  'inventory',
  'clients',
  'bills',
  'ledger_payments'
];

export const generateBackup = async () => {
  const backupData: Record<string, any[]> = {};
  const timestamp = new Date().toISOString();

  try {
    for (const colName of COLLECTIONS_TO_BACKUP) {
      const querySnapshot = await getDocs(collection(db, colName));
      backupData[colName] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    const finalBackup = {
      version: '1.0',
      timestamp,
      data: backupData
    };

    const blob = new Blob([JSON.stringify(finalBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aarya_backup_${timestamp.split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
};

export const restoreBackup = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        
        if (!backup.data || !backup.version) {
          throw new Error("Invalid backup file format.");
        }

        const batchSize = 450; // Firestore batch limit is 500, keeping safety margin
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const [colName, docs] of Object.entries(backup.data)) {
          // @ts-ignore
          for (const docData of docs) {
            const { id, ...data } = docData;
            const docRef = doc(db, colName, id);
            batch.set(docRef, data);
            operationCount++;

            if (operationCount >= batchSize) {
              await batch.commit();
              batch = writeBatch(db);
              operationCount = 0;
            }
          }
        }

        if (operationCount > 0) {
          await batch.commit();
        }

        resolve(true);
      } catch (error) {
        console.error("Restore failed:", error);
        reject(error);
      }
    };
    reader.readAsText(file);
  });
};

import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

// Add new attendance record
export async function addAttendance(attendance) {
  const docRef = await addDoc(collection(db, "attendance"), attendance);
  return docRef.id;
}

// Get all attendance records
export async function getAllAttendance() {
  const querySnapshot = await getDocs(collection(db, "attendance"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update an attendance record
export async function updateAttendance(id, updates) {
  await updateDoc(doc(db, "attendance", id), updates);
}

// Delete an attendance record
export async function deleteAttendance(id) {
  await deleteDoc(doc(db, "attendance", id));
}
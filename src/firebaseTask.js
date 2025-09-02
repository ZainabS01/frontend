import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

// Add new task
export async function addTask(task) {
  const docRef = await addDoc(collection(db, "tasks"), task);
  return docRef.id;
}

// Get all tasks
export async function getAllTasks() {
  const querySnapshot = await getDocs(collection(db, "tasks"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update a task
export async function updateTask(id, updates) {
  await updateDoc(doc(db, "tasks", id), updates);
}

// Delete a task
export async function deleteTask(id) {
  await deleteDoc(doc(db, "tasks", id));
}
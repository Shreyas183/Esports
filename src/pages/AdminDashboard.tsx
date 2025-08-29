
// ...existing code...

import React, { useEffect, useState } from 'react';
import { collection, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { User, UserRole } from '@/types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
      setLoading(false);
    }, (err) => {
      setError('Failed to fetch users: ' + err.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setError(null);
    setSuccess(null);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setSuccess('Role updated successfully.');
    } catch (err: any) {
      setError('Failed to update role: ' + err.message);
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      <h2>User Management</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2">UID</th>
            <th className="border px-2">Name</th>
            <th className="border px-2">Email</th>
            <th className="border px-2">Role</th>
            <th className="border px-2">Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uid}>
              <td className="border px-2">{user.uid}</td>
              <td className="border px-2">{user.displayName}</td>
              <td className="border px-2">{user.email}</td>
              <td className="border px-2">{user.role}</td>
              <td className="border px-2">
                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user.uid, e.target.value as UserRole)}
                >
                  <option value="viewer">viewer</option>
                  <option value="player">player</option>
                  <option value="organizer">organizer</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;

"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [saving, setSaving] = useState(false);

  // --- 1. MARGINS LOGIC ---
  const { data: marginData, mutate: mutateMargins, isLoading: marginsLoading } = useSWR('/api/settings', fetcher);
  const [margins, setMargins] = useState({ top: "4.5cm", bottom: "2cm", left: "1.5cm", right: "1.5cm" });

  useEffect(() => {
    if (marginData?.settings) {
      const getSet = (key: string, fallback: string) => marginData.settings.find((s: any) => s.settingKey === key)?.settingVal || fallback;
      setMargins({
        top: getSet('MARGIN_TOP', '4.5cm'), bottom: getSet('MARGIN_BOTTOM', '2cm'),
        left: getSet('MARGIN_LEFT', '1.5cm'), right: getSet('MARGIN_RIGHT', '1.5cm')
      });
    }
  }, [marginData]);

  const handleSaveMargins = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(margins) });
      if (res.ok) { alert("Global Margins saved successfully!"); mutateMargins(); }
    } catch (e) { alert("Network error"); }
    setSaving(false);
  };

  // --- 2. TESTS LOGIC ---
  const { data: testData, mutate: mutateTests, isLoading: testsLoading } = useSWR('/api/tests', fetcher);
  const [newTest, setNewTest] = useState({ testName: "", category: "Blood", unit: "", normalRange: "" });
  
  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTest) });
      const result = await res.json();
      if (res.ok) {
        setNewTest({ testName: "", category: "Blood", unit: "", normalRange: "" });
        mutateTests();
      } else { alert(result.error); }
    } catch (e) { alert("Network error"); }
    setSaving(false);
  };

  const handleToggleTest = async (id: string, currentStatus: boolean) => {
    await fetch("/api/tests", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !currentStatus }) });
    mutateTests();
  };

  const handleDeleteTest = async (id: string) => {
    if (confirm("Delete this test permanently?")) {
      await fetch(`/api/tests?id=${id}`, { method: 'DELETE' });
      mutateTests();
    }
  };

  const tests = testData?.tests || [];

  // --- 3. USERS LOGIC ---
  const { data: userData, mutate: mutateUsers, isLoading: usersLoading } = useSWR('/api/users', fetcher);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "RECEPTION" });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      const result = await res.json();
      if (res.ok) {
        setNewUser({ name: "", username: "", password: "", role: "RECEPTION" });
        mutateUsers();
        alert("User created successfully!");
      } else { alert(result.error); }
    } catch (e) { alert("Network error"); }
    setSaving(false);
  };

  const handleToggleUser = async (id: string, currentStatus: boolean) => {
    await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !currentStatus }) });
    mutateUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Delete this user? They will lose all access immediately.")) {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      mutateUsers();
    }
  };

  const users = userData?.users || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-[#002642] uppercase tracking-wide">Super Admin Console</h1>
        <p className="text-gray-500 mt-1 font-semibold">Modify core system parameters, print constraints, and staff access.</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab("margins")} className={`px-6 py-2.5 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === "margins" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>📄 Margins</button>
        <button onClick={() => setActiveTab("tests")} className={`px-6 py-2.5 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === "tests" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>🔬 Test Config</button>
        <button onClick={() => setActiveTab("users")} className={`px-6 py-2.5 rounded-t-lg font-bold transition whitespace-nowrap ${activeTab === "users" ? "bg-[#002642] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>👥 User Access</button>
      </div>

      {/* TAB 1: MARGINS */}
      {activeTab === "margins" && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-[#008C8C] mb-6">Global Letterhead Print Constraints</h2>
          {marginsLoading ? ( <div className="animate-pulse text-[#002642] font-bold">Loading...</div> ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Top Margin (Logo Gap)</label><input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.top} onChange={e => setMargins({...margins, top: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bottom Margin</label><input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.bottom} onChange={e => setMargins({...margins, bottom: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Left</label><input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.left} onChange={e => setMargins({...margins, left: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Right</label><input type="text" className="w-full border-2 p-3 rounded-xl font-bold outline-none focus:border-[#008C8C]" value={margins.right} onChange={e => setMargins({...margins, right: e.target.value})} /></div>
                </div>
                <button onClick={handleSaveMargins} disabled={saving} className="bg-[#008C8C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-teal-600 transition w-full disabled:opacity-50">Save Global Margins</button>
              </div>
              <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center p-8 relative h-80 overflow-hidden">
                <div className="absolute top-0 w-full bg-blue-100/50 flex items-center justify-center text-blue-800 font-bold text-xs" style={{ height: margins.top }}>Header ({margins.top})</div>
                <div className="bg-white w-full h-full border shadow-sm flex items-center justify-center text-gray-400 font-bold text-sm">Safe Printable Content</div>
                <div className="absolute bottom-0 w-full bg-blue-100/50 flex items-center justify-center text-blue-800 font-bold text-xs" style={{ height: margins.bottom }}>Footer ({margins.bottom})</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TESTS */}
      {activeTab === "tests" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold text-[#008C8C] mb-4">Add New Test</h2>
            <form onSubmit={handleAddTest} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Test Name *</label><input required type="text" className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newTest.testName} onChange={e => setNewTest({...newTest, testName: e.target.value})} placeholder="e.g. Lipid Profile" /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Category *</label>
                <select required className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newTest.category} onChange={e => setNewTest({...newTest, category: e.target.value})}>
                  <option value="Blood">Blood (Phlebotomy)</option><option value="Urine">Urine</option><option value="Stool">Stool</option><option value="Physical">Physical / Imaging</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Unit</label><input type="text" className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newTest.unit} onChange={e => setNewTest({...newTest, unit: e.target.value})} placeholder="e.g. mg/dL" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Normal Range</label><input type="text" className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newTest.normalRange} onChange={e => setNewTest({...newTest, normalRange: e.target.value})} placeholder="e.g. < 200" /></div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#008C8C] text-white py-3 rounded-xl font-bold hover:bg-[#006b6b] transition mt-2 shadow-md">{saving ? "Adding..." : "➕ Add to Master List"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center"><h2 className="text-lg font-bold text-[#002642]">Global Master Test List</h2><span className="bg-[#002642] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">{tests.length} Total</span></div>
            {testsLoading ? <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading...</div> : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white border-b shadow-sm"><tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Test Name</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Category</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {tests.map((test: any) => (
                      <tr key={test.id} className={`${!test.isActive ? "opacity-50" : ""}`}>
                        <td className="p-4"><p className="font-bold text-[#002642]">{test.testName}</p></td>
                        <td className="p-4"><span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">{test.category}</span></td>
                        <td className="p-4 text-right space-x-3">
                          <button onClick={() => handleToggleTest(test.id, test.isActive)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">{test.isActive ? "Disable" : "Enable"}</button>
                          <button onClick={() => handleDeleteTest(test.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold text-[#008C8C] mb-4">Create Staff Account</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label><input required type="text" className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Dr. Ramesh" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Username (Login ID) *</label><input required type="text" className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="e.g. dr.ramesh" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Password *</label><input required type="password" minLength={6} className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">System Role *</label>
                <select required className="w-full border-2 p-2.5 rounded-lg font-semibold outline-none focus:border-[#008C8C]" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="RECEPTION">Receptionist</option>
                  <option value="PHLEBOTOMIST">Phlebotomist</option>
                  <option value="TECHNICIAN">Lab Technician</option>
                  <option value="DOCTOR">Doctor (Reviewer)</option>
                  <option value="ADMIN">Camp Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#002642] text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition mt-2 shadow-md">{saving ? "Creating..." : "Create Account"}</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center"><h2 className="text-lg font-bold text-[#002642]">Active Staff Directory</h2><span className="bg-[#008C8C] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm">{users.length} Users</span></div>
            {usersLoading ? <div className="p-8 text-center text-gray-400 font-bold animate-pulse">Loading...</div> : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white border-b shadow-sm"><tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Staff Member</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th><th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Access Control</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 && ( <tr><td colSpan={3} className="p-8 text-center text-gray-400">No users found.</td></tr> )}
                    {users.map((user: any) => (
                      <tr key={user.id} className={`${!user.isActive ? "opacity-50" : ""}`}>
                        <td className="p-4">
                          <p className="font-bold text-[#002642]">{user.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {user.username}</p>
                        </td>
                        <td className="p-4"><span className="text-[10px] font-black tracking-wider bg-[#008C8C] text-white px-2 py-1 rounded-md uppercase">{user.role}</span></td>
                        <td className="p-4 text-right space-x-3">
                          <button onClick={() => handleToggleUser(user.id, user.isActive)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${user.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>{user.isActive ? "Suspend" : "Activate"}</button>
                          <button onClick={() => handleDeleteUser(user.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
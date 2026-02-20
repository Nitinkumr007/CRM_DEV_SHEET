import { useState, useEffect, useMemo } from 'react';
import { Users, AlertOctagon, CheckCircle, Network, UserCircle, Search, Plus, Database } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { MasterCard } from '../components/masters/MasterCard';
import { Drawer } from '../components/ui/Drawer';
import { DataTable, type Column } from '../components/ui/DataTable';
import type { Status, RSM, ASM, ComplaintType, SystemUser, CustomerType } from '../types/masters';

const TABS = [
    { id: 'user', label: 'Users', icon: Users },
    { id: 'customer-type', label: 'Customer Types', icon: Users },
    { id: 'complaint-type', label: 'Complaint Types', icon: AlertOctagon },
    { id: 'status', label: 'Status', icon: CheckCircle },
    { id: 'rsm', label: 'RSM', icon: Network },
    { id: 'asm', label: 'ASM', icon: UserCircle },
];

// --- Form Components ---
const MasterInput = ({ label, id, type = 'text', required = false, formData, setFormData }: any) => (
    <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <input
            type={type}
            className="glass-input"
            value={formData[id] || ''}
            onChange={e => setFormData({ ...formData, [id]: e.target.value })}
            placeholder={`Enter ${label.toLowerCase()}`}
        />
    </div>
);

const MasterSelect = ({ label, id, options, required = false, valueField = 'value', labelField = 'label', formData, setFormData }: any) => (
    <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            <select
                className="glass-input appearance-none bg-no-repeat bg-[right_1rem_center] pr-10"
                value={formData[id] || ''}
                onChange={e => setFormData({ ...formData, [id]: e.target.value })}
            >
                <option value="">Select {label}</option>
                {options.map((opt: any) => {
                    const val = typeof opt === 'object' ? opt[valueField] : opt;
                    const lab = typeof opt === 'object' ? opt[labelField] : opt;
                    return <option key={val} value={val}>{lab}</option>;
                })}
            </select>
        </div>
    </div>
);

const MasterStatusSelect = ({ formData, setFormData }: any) => (
    <MasterSelect
        label="Status"
        id="statusId"
        options={[{ value: 1, label: 'Active' }, { value: 2, label: 'Inactive' }]}
        required
        formData={formData}
        setFormData={setFormData}
    />
);

export default function Masters() {
    const [activeTab, setActiveTab] = useState('user');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleTabChange = (tabId: string) => {
        setData([]); // CRITICAL: Clear data immediately to prevent render crash before useEffect fetches new data
        setActiveTab(tabId);
    };
    const [searchQuery, setSearchQuery] = useState('');

    // Modal/Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    // RSM List for ASM Form
    const [rsmList, setRsmList] = useState<any[]>([]);

    useEffect(() => {
        setData([]); // Clear data to prevent type mismatch during tab switch
        fetchData();
        setSearchQuery('');
        // Fetch RSM list if needed for ASM tab
        if (activeTab === 'asm' && rsmList.length === 0) {
            fetchRSMs();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/masters/${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch data');

            const json = await res.json();
            if (Array.isArray(json)) {
                setData(json);
            } else {
                console.error('Data is not an array:', json);
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRSMs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/masters/rsm', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json)) {
                    setRsmList(json);
                } else {
                    console.error('RSM Data is not an array:', json);
                    setRsmList([]);
                }
            }
        } catch (err) {
            console.error('Error fetching RSMs:', err);
            setRsmList([]);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({});
        setIsDrawerOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);

        let mappedData = { ...item };

        if (activeTab === 'user') {
            mappedData = {
                fullName: item.Full_Name,
                userCode: item.User_Code,
                mobile: item.Mobile,
                email: item.Email,
                role: item.Role,
                statusId: item.Status_ID,
                password: ''
            };
        } else if (activeTab === 'customer-type') {
            mappedData = {
                customerTypeName: item.Customer_Type_Name,
                customerTypeCode: item.Customer_Type_Code,
                description: item.Description,
                statusId: item.Status_ID
            };
        } else if (activeTab === 'complaint-type') {
            mappedData = {
                complaintName: item.Complaint_Name,
                complaintCode: item.Complaint_Code,
                slaHours: item.SLA_Hours,
                statusId: item.Status_ID
            };
        } else if (activeTab === 'status') {
            mappedData = {
                statusName: item.Status_Name,
                statusCode: item.Status_Code,
                statusType: item.Status_Type
            };
        } else if (activeTab === 'rsm') {
            mappedData = {
                rsmName: item.RSM_Name,
                rsmCode: item.RSM_Code,
                designation: item.Designation,
                mobile: item.Mobile,
                email: item.Email,
                region: item.Region,
                statusId: item.Status_ID
            };
        } else if (activeTab === 'asm') {
            mappedData = {
                asmName: item.ASM_Name,
                asmCode: item.ASM_Code,
                mobile: item.Mobile,
                district: item.District,
                email: item.Email,
                rsmId: item.RSM_ID,
                statusId: item.Status_ID
            };
        }

        setFormData(mappedData);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/masters/${activeTab}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = `/api/masters/${activeTab}` + (editingItem ? `/${getId(editingItem)}` : '');
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsDrawerOpen(false);
                fetchData();
            } else {
                alert('Failed to save');
            }
        } catch (err) {
            console.error('Error saving:', err);
        }
    };

    const getId = (item: any) => {
        if (!item) return null;
        if (activeTab === 'user') return item.User_ID;
        if (activeTab === 'customer-type') return item.Customer_Type_ID;
        if (activeTab === 'complaint-type') return item.Complaint_Type_ID;
        if (activeTab === 'status') return item.Status_ID;
        if (activeTab === 'rsm') return item.RSM_ID;
        if (activeTab === 'asm') return item.ASM_ID;
    };

    const filteredData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.filter(item => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchLower)
            );
        });
    }, [data, searchQuery]);

    // --- Columns Definitions ---
    const userColumns: Column<SystemUser>[] = useMemo(() => [
        { header: 'Full Name', accessorKey: 'Full_Name', sortable: true, className: 'font-medium text-slate-900' },
        { header: 'User Code', accessorKey: 'User_Code', sortable: true },
        {
            header: 'Role', accessorKey: 'Role', sortable: true,
            cell: (user) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                    ${user.Role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.Role === 'Sales' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-100'}`}>
                    {user.Role}
                </span>
            )
        },
        {
            header: 'Contact', accessorKey: 'Email',
            cell: (user) => (
                <div className="flex flex-col">
                    <span className="text-slate-900">{user.Email}</span>
                    <span className="text-xs text-slate-500">{user.Mobile}</span>
                </div>
            )
        },
        {
            header: 'Status', accessorKey: 'Status_ID', sortable: true,
            cell: (user) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.Status_ID === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.Status_ID === 1 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {user.Status_ID === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Actions', accessorKey: 'User_ID',
            cell: (user) => (
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(user); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(user.User_ID); }} className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline">Delete</button>
                </div>
            )
        }
    ], []);

    const customerTypeColumns: Column<CustomerType>[] = useMemo(() => [
        { header: 'Type Name', accessorKey: 'Customer_Type_Name', sortable: true, className: 'font-medium text-slate-900' },
        { header: 'Code', accessorKey: 'Customer_Type_Code', sortable: true },
        { header: 'Description', accessorKey: 'Description', sortable: true },
        {
            header: 'Status', accessorKey: 'Status_ID', sortable: true,
            cell: (item) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Status_ID === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.Status_ID === 1 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {item.Status_ID === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Actions', accessorKey: 'Customer_Type_ID',
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.Customer_Type_ID); }} className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline">Delete</button>
                </div>
            )
        }
    ], []);

    const complaintTypeColumns: Column<ComplaintType>[] = useMemo(() => [
        { header: 'Complaint Code', accessorKey: 'Complaint_Code', sortable: true, className: 'font-medium text-slate-900' },
        { header: 'Complaint Name', accessorKey: 'Complaint_Name', sortable: true },
        { header: 'SLA Hours', accessorKey: 'SLA_Hours', sortable: true },
        {
            header: 'Status', accessorKey: 'Status_ID', sortable: true,
            cell: (item) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${item.Status_ID === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.Status_ID === 1 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {item.Status_ID === 1 ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Actions', accessorKey: 'Complaint_Type_ID',
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline">Edit</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.Complaint_Type_ID); }} className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline">Delete</button>
                </div>
            )
        }
    ], []);


    // --- Render Content ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Loading data...</p>
                </div>
            );
        }

        if (filteredData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white/40 backdrop-blur-sm border border-dashed border-slate-200/60 rounded-3xl mx-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No results found</h3>
                    <p className="text-slate-500 max-w-sm mt-2 text-base">
                        We couldn't find any items matching "{searchQuery}". Try adjusting your search or add a new item.
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-6 text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pb-20"
            >
                {/* Table Views */}
                {activeTab === 'user' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden">
                        <DataTable data={filteredData} columns={userColumns} keyField="User_ID" onRowClick={handleEdit} />
                    </div>
                )}
                {activeTab === 'customer-type' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden">
                        <DataTable data={filteredData} columns={customerTypeColumns} keyField="Customer_Type_ID" onRowClick={handleEdit} />
                    </div>
                )}
                {activeTab === 'complaint-type' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden">
                        <DataTable data={filteredData} columns={complaintTypeColumns} keyField="Complaint_Type_ID" onRowClick={handleEdit} />
                    </div>
                )}

                {/* Card Views */}
                {['status', 'rsm', 'asm'].includes(activeTab) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredData.map((item) => {
                                if (activeTab === 'status') {
                                    const st = item as Status;
                                    return (
                                        <MasterCard
                                            key={st.Status_ID}
                                            title={st.Status_Name}
                                            subtitle={st.Status_Type}
                                            details={[{ label: 'Code', value: st.Status_Code }]}
                                            onEdit={() => handleEdit(st)}
                                            onDelete={() => handleDelete(st.Status_ID)}
                                        />
                                    );
                                }
                                if (activeTab === 'rsm') {
                                    const rsm = item as RSM;
                                    return (
                                        <MasterCard
                                            key={rsm.RSM_ID}
                                            title={rsm.RSM_Name}
                                            subtitle={rsm.Region}
                                            details={[
                                                { label: 'Code', value: rsm.RSM_Code },
                                                { label: 'Mobile', value: rsm.Mobile }
                                            ]}
                                            onEdit={() => handleEdit(rsm)}
                                            onDelete={() => handleDelete(rsm.RSM_ID)}
                                        />
                                    );
                                }
                                if (activeTab === 'asm') {
                                    const asm = item as ASM;
                                    return (
                                        <MasterCard
                                            key={asm.ASM_ID}
                                            title={asm.ASM_Name}
                                            subtitle={asm.District}
                                            details={[
                                                { label: 'Code', value: asm.ASM_Code },
                                                { label: 'Mobile', value: asm.Mobile },
                                                { label: 'RSM', value: asm.RSM_NAME || String(asm.RSM_ID) }
                                            ]}
                                            onEdit={() => handleEdit(asm)}
                                            onDelete={() => handleDelete(asm.ASM_ID)}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        );
    };

    const renderForm = () => {
        const props = { formData, setFormData };
        // ... same form logic, simplified slightly for brevity in thought but kept fully in file ...
        if (activeTab === 'user') {
            return (
                <>
                    <MasterInput label="Full Name" id="fullName" required {...props} />
                    <MasterInput label="User Code" id="userCode" required {...props} />
                    <MasterInput label="Mobile" id="mobile" required {...props} />
                    <MasterInput label="Email" id="email" type="email" required {...props} />
                    <MasterSelect label="Role" id="role" options={['Admin', 'User', 'Sales', 'RSM', 'ASM']} required {...props} />
                    {!editingItem && <MasterInput label="Password" id="password" type="password" required {...props} />}
                    <MasterStatusSelect {...props} />
                    {editingItem && <MasterInput label="New Password (Optional)" id="password" type="password" {...props} />}
                </>
            );
        }
        if (activeTab === 'customer-type') return (
            <>
                <MasterInput label="Customer Type Name" id="customerTypeName" required {...props} />
                <MasterInput label="Customer Type Code" id="customerTypeCode" required {...props} />
                <MasterInput label="Description" id="description" {...props} />
                <MasterStatusSelect {...props} />
            </>
        );
        if (activeTab === 'complaint-type') return (
            <>
                <MasterInput label="Complaint Name" id="complaintName" required {...props} />
                <MasterInput label="Code" id="complaintCode" required {...props} />
                <MasterInput label="SLA Hours" id="slaHours" type="number" required {...props} />
                <MasterStatusSelect {...props} />
            </>
        );
        if (activeTab === 'status') return (
            <>
                <MasterInput label="Status Name" id="statusName" required {...props} />
                <MasterInput label="Code" id="statusCode" required {...props} />
                <MasterInput label="Type" id="statusType" required {...props} />
            </>
        );
        if (activeTab === 'rsm') return (
            <>
                <MasterInput label="RSM Name" id="rsmName" required {...props} />
                <MasterInput label="Code" id="rsmCode" required {...props} />
                <MasterInput label="Designation" id="designation" {...props} />
                <MasterInput label="Mobile" id="mobile" required {...props} />
                <MasterInput label="Region" id="region" required {...props} />
                <MasterInput label="Email" id="email" type="email" {...props} />
                <MasterStatusSelect {...props} />
            </>
        );
        if (activeTab === 'asm') return (
            <>
                <MasterInput label="ASM Name" id="asmName" required {...props} />
                <MasterInput label="Code" id="asmCode" required {...props} />
                <MasterInput label="Mobile" id="mobile" required {...props} />
                <MasterInput label="District" id="district" required {...props} />
                <MasterInput label="Email" id="email" type="email" {...props} />
                <MasterSelect label="RSM" id="rsmId" options={rsmList} valueField="RSM_ID" labelField="RSM_Name" required {...props} />
                <MasterStatusSelect {...props} />
            </>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-8 fade-in p-4 lg:p-8 max-w-[1600px] mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3 font-display">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                                <Database className="w-6 h-6" />
                            </div>
                            Master Data
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-medium max-w-2xl">
                            Centralized control for system-wide configurations and data standards.
                        </p>
                    </div>
                    <button onClick={handleCreate} className="glass-btn px-6 hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5" />
                        <span className="font-semibold">Add New {activeTab === 'rsm' || activeTab === 'asm' ? activeTab.toUpperCase() : 'Item'}</span>
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center bg-white/60 backdrop-blur-xl border border-white/60 p-2 rounded-3xl shadow-sm sticky top-4 z-20">
                    <div className="flex overflow-x-auto pb-0 hide-scrollbar gap-1 p-1">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-300 whitespace-nowrap
                                        ${isActive ? 'text-white shadow-md shadow-indigo-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}`}
                                >
                                    {isActive && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-indigo-600 rounded-2xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative group min-w-[300px] px-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-12 py-3 bg-white/60 border border-slate-200/80 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm group-hover:border-slate-300 focus:bg-white/90"
                        />
                    </div>
                </div>

                {renderContent()}

                <Drawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    title={`${editingItem ? 'Edit' : 'New'} ${activeTab === 'rsm' || activeTab === 'asm' ? activeTab.toUpperCase() : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    description="Fill in the details below. Fields marked with * are required."
                >
                    <form onSubmit={handleSubmit}>
                        {renderForm()}
                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="glass-btn">
                                {editingItem ? 'Save Changes' : 'Create Item'}
                            </button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </div>
    );
}

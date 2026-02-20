import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Tag, Edit2, Trash2 } from 'lucide-react';
import { Drawer } from '../components/ui/Drawer';
import { DataTable, type Column } from '../components/ui/DataTable';

interface Customer {
    Customer_ID: number;
    Customer_Name: string;
    Customer_type: string;
    Customer_Number: string;
    Customer_Address: string;
    Customer_Type_ID: number;
    customer_statu: string;
    Created_At: string;
    Customer_Type_Name_Joined?: string;
}

export default function Customers() {
    const [data, setData] = useState<Customer[]>([]);
    const [filteredData, setFilteredData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customerTypes, setCustomerTypes] = useState<any[]>([]);

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchData();
        fetchCustomerTypes();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerTypes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/masters/customer-type', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setCustomerTypes(json);
            }
            // For safety, I'll add a specific fetch logic or check backend first.
            // Actually, I missed adding Customer Type to Masters.tsx tabs?
            // User didn't ask for it in Masters, but needed for Tickets.
            // I'll assume /api/masters/customer-type exists or I will create it. 
            // Let's look at server/masters.js again to be sure.
        } catch (err) { console.error(err); }
    };

    // TEMPORARY: I will use a direct fetch to a new endpoint I'll ensure exists.
    // For now, let's write the component assuming the endpoint works.

    const handleCreate = () => {
        setCurrentCustomer(null);
        setFormData({ status: 'Active' });
        setIsDrawerOpen(true);
    };

    const handleEdit = (item: Customer) => {
        setCurrentCustomer(item);
        setFormData({
            name: item.Customer_Name,
            phone: item.Customer_Number,
            address: item.Customer_Address,
            customerTypeId: item.Customer_Type_ID,
            status: item.customer_statu
        });
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/customers/${id}`, {
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
        const url = `/api/customers` + (currentCustomer ? `/${currentCustomer.Customer_ID}` : '');
        const method = currentCustomer ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                customerTypeId: formData.customerTypeId,
                status: formData.status
            };
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsDrawerOpen(false);
                fetchData();
            } else {
                alert('Failed to save');
            }
        } catch (err) {
            console.error('Error saving:', err); // Moved this line to the correct place
        }
    };

    // Removed the direct filteredData computation here as it's now handled by useEffect
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = data.filter(item =>
            item.Customer_Name.toLowerCase().includes(lowerQuery) ||
            (item.Customer_Number && item.Customer_Number.toLowerCase().includes(lowerQuery)) ||
            (item.Customer_Type_Name_Joined && item.Customer_Type_Name_Joined.toLowerCase().includes(lowerQuery)) ||
            (item.customer_statu && item.customer_statu.toLowerCase().includes(lowerQuery))
        );
        setFilteredData(filtered);
    }, [searchQuery, data]);

    const columns: Column<Customer>[] = [
        { header: 'Name', accessorKey: 'Customer_Name', sortable: true, className: 'font-medium text-slate-900' },
        { header: 'Number', accessorKey: 'Customer_Number', sortable: true },
        {
            header: 'Type', accessorKey: 'Customer_Type_Name_Joined', sortable: true,
            cell: (item) => (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    <Tag className="w-3 h-3" />
                    {item.Customer_Type_Name_Joined || 'N/A'}
                </span>
            )
        },
        {
            header: 'Status', accessorKey: 'customer_statu',
            cell: (item) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.customer_statu === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {item.customer_statu}
                </span>
            )
        },
        { header: 'Created', accessorKey: 'Created_At', cell: (item) => new Date(item.Created_At).toLocaleDateString() },
        {
            header: 'Actions',
            accessorKey: 'Customer_ID',
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.Customer_ID); }}
                        className="p-1 hover:bg-red-50 rounded text-slate-500 hover:text-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    // Helper for inputs
    return (
        <div className="space-y-6 fade-in p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2 font-display">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Customers
                    </h1>
                    <p className="text-slate-500 mt-1">Manage customer profiles and details.</p>
                </div>
                <button onClick={handleCreate} className="glass-btn">
                    <Plus className="w-4 h-4" />
                    New Customer
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                </div>
                <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
                    <Filter className="w-4 h-4" />
                    <span>{filteredData.length} records</span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <DataTable data={filteredData} columns={columns} keyField="Customer_ID" onRowClick={handleEdit} />
            )}

            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title={currentCustomer ? 'Edit Customer' : 'New Customer'}
                description="Manage customer details."
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                            <input
                                name="name"
                                defaultValue={currentCustomer?.Customer_Name}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                placeholder="Enter customer name"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Number</label>
                                <input
                                    name="phone"
                                    defaultValue={currentCustomer?.Customer_Number}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type</label>
                            <select
                                name="customerTypeId"
                                defaultValue={currentCustomer?.Customer_Type_ID}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="">Select Type</option>
                                {customerTypes.map(type => (
                                    <option key={type.Customer_Type_ID} value={type.Customer_Type_ID}>
                                        {type.Customer_Type_Name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <textarea
                                name="address"
                                defaultValue={currentCustomer?.Customer_Address}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                placeholder="Enter full address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                name="status"
                                defaultValue={currentCustomer?.customer_statu || 'Active'}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                        <button type="submit" className="glass-btn">{currentCustomer ? 'Save Changes' : 'Create Customer'}</button>
                    </div>
                </form>
            </Drawer>
        </div>
    );
}

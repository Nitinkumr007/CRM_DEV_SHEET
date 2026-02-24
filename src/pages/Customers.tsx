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
    Customer_Status: string;
    Created_At: string;
    Customer_Type_Name_Joined?: string;
    city_name?: string;
    pincode?: string;
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

    useEffect(() => {
        fetchData();
        fetchCustomerTypes();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { gsheet } = await import('../lib/gsheet');
            // Manual Join Implementation (Safe for GSheet architecture)
            const [customers, types] = await Promise.all([
                gsheet.read('customers_profile'),
                gsheet.read('Customer_Type_Master')
            ]);

            const mapped: Customer[] = customers.map((c: any) => {
                const type = types.find((t: any) => t.Customer_Type_ID == c.Customer_Type_ID);
                return {
                    ...c,
                    Customer_Status: c.Customer_Status || c.customer_statu || 'Active',
                    Customer_Type_Name_Joined: type ? type.Customer_Type_Name : 'Unknown'
                };
            });

            setData(mapped);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerTypes = async () => {
        try {
            const { gsheet } = await import('../lib/gsheet');
            const types = await gsheet.read('Customer_Type_Master');
            setCustomerTypes(types);
        } catch (err) { console.error(err); }
    };

    const handleCreate = () => {
        setCurrentCustomer(null);
        setIsDrawerOpen(true);
    };

    const handleEdit = (item: Customer) => {
        setCurrentCustomer(item);
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const { gsheet } = await import('../lib/gsheet');
            await gsheet.query(`DELETE FROM customers_profile WHERE Customer_ID = @id`, { id });
            fetchData();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formDataObj = new FormData(form);
        const { gsheet } = await import('../lib/gsheet');

        try {
            const payload = {
                customerName: formDataObj.get('name'),
                customerNumber: formDataObj.get('phone'),
                customerAddress: formDataObj.get('address'),
                customerTypeId: formDataObj.get('customerTypeId'),
                customerStatus: formDataObj.get('status'),
                cityName: formDataObj.get('city'),
                pincode: formDataObj.get('pincode')
            };

            if (currentCustomer) {
                await gsheet.query(`
                    UPDATE customers_profile SET 
                        Customer_Name = @customerName, 
                        Customer_Number = @customerNumber, 
                        Customer_Address = @customerAddress, 
                        Customer_Type_ID = @customerTypeId, 
                        Customer_Status = @customerStatus, 
                        city_name = @cityName, 
                        pincode = @pincode 
                    WHERE Customer_ID = @id
                `, { ...payload, id: currentCustomer.Customer_ID });
            } else {
                await gsheet.query(`
                    INSERT INTO customers_profile (
                        Customer_Name, Customer_Number, Customer_Address, 
                        Customer_Type_ID, Customer_Status, city_name, pincode
                    ) VALUES (
                        @customerName, @customerNumber, @customerAddress, 
                        @customerTypeId, @customerStatus, @cityName, @pincode
                    )
                `, payload);
            }
            setIsDrawerOpen(false);
            fetchData();
        } catch (err) {
            console.error('Error saving:', err);
            alert('Failed to save customer');
        }
    };

    // Removed the direct filteredData computation here as it's now handled by useEffect
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = data.filter(item =>
            item.Customer_Name.toLowerCase().includes(lowerQuery) ||
            (item.Customer_Number && item.Customer_Number.toLowerCase().includes(lowerQuery)) ||
            (item.Customer_Type_Name_Joined && item.Customer_Type_Name_Joined.toLowerCase().includes(lowerQuery)) ||
            (item.Customer_Status && item.Customer_Status.toLowerCase().includes(lowerQuery))
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
            header: 'Status', accessorKey: 'Customer_Status',
            cell: (item) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.Customer_Status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {item.Customer_Status}
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
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                placeholder="Enter full address"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                <input
                                    name="city"
                                    defaultValue={currentCustomer?.city_name}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="Enter city"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                                <input
                                    name="pincode"
                                    defaultValue={currentCustomer?.pincode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="6-digit pincode"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                name="status"
                                defaultValue={currentCustomer?.Customer_Status || 'Active'}
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

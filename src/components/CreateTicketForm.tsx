
import { useState, useRef, useEffect } from 'react';
import type { Priority } from '../types/ticket';
import { Loader2, Search, History, Copy, Plus, Phone, MapPin, Briefcase, User, ThumbsUp } from 'lucide-react';
import { useMasters } from '../hooks/useMasters';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateTicketFormProps {
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
}

export function CreateTicketForm({ onSubmit, onCancel }: CreateTicketFormProps) {
    const { asmList, rsmList, complaintTypeList, customerTypes, loading: mastersLoading } = useMasters();
    // History State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const ticketFormRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [customerTickets, setCustomerTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        customer_number: '',
        customer_address: '',
        customer_type: '',
        city_name: '',
        pincode: '',
        customer_id: 0,
        title: '',
        description: '',
        priority: 'medium' as Priority,
        complaint_type: '',
        complaintTypeId: 0,
        asm_name: '',
        rsm_name: ''
    });

    // Add Customer State
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [addCustomerSuccess, setAddCustomerSuccess] = useState(false);

    const handleAddCustomer = async () => {
        // Validation
        if (!formData.customerName.trim() || !formData.customer_number.trim() || !formData.city_name.trim() || !formData.pincode.trim() || !formData.customer_type) {
            alert('Please fill in Name, Mobile, Customer Type, City and Pincode.');
            return;
        }
        if (formData.customer_number.length !== 10) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        setIsAddingCustomer(true);
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    customerNumber: formData.customer_number,
                    customerAddress: formData.customer_address,
                    customerTypeId: Number(formData.customer_type),
                    cityName: formData.city_name,
                    pincode: formData.pincode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create customer');
            }

            const data = await response.json();
            const newCustomerId = data.customerId;

            // Success Feedback
            setAddCustomerSuccess(true);

            // Auto-select after short delay
            setTimeout(() => {
                const newCustomer = {
                    Customer_ID: newCustomerId,
                    Customer_Name: formData.customerName,
                    Customer_Number: formData.customer_number,
                    Customer_Address: formData.customer_address,
                    Customer_Type_Name: customerTypes.find(c => c.Customer_Type_ID === Number(formData.customer_type))?.Customer_Type_Name || 'Unknown',
                    city_name: formData.city_name,
                    pincode: formData.pincode
                };
                selectCustomer(newCustomer);
                setAddCustomerSuccess(false);
            }, 1500);

        } catch (err: any) {
            console.error('Error adding customer:', err);
            alert(`Failed to add customer: ${err.message}`);
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else {
                setSearchResults([]);
                setHasSearched(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setHasSearched(true);
        try {
            const { gsheet } = await import('../lib/gsheet');
            // Path: src/components/CreateTicketForm.tsx
            // Search customers by name or number
            const sql = `SELECT * FROM customers_profile WHERE Customer_Name LIKE @q OR Customer_Number LIKE @q`;
            const result = await gsheet.query(sql, { q: `%${query}%` });
            setSearchResults(result.recordset || []);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) performSearch(searchQuery);
    };

    const selectCustomer = async (customer: any) => {
        setSelectedCustomer(customer);
        setShowNewCustomerForm(false);
        setSearchResults([]);

        setFormData(prev => ({
            ...prev,
            customerName: customer.Customer_Name,
            customer_number: customer.Customer_Number,
            customer_address: customer.Customer_Address,
            customer_type: customer.Customer_Type_Name || customer.Customer_Type_Name_Joined,
            customer_id: customer.Customer_ID,
            city_name: customer.city_name || '',
            pincode: customer.pincode || ''
        }));

        try {
            const { gsheet } = await import('../lib/gsheet');
            const sql = `SELECT * FROM Ticket_Master WHERE Customer_ID = @id ORDER BY Created_At DESC`;
            const result = await gsheet.query(sql, { id: customer.Customer_ID });
            setCustomerTickets(result.recordset || []);
        } catch (err) {
            console.error(err);
        }
    };

    const copyTicket = (ticket: any) => {
        setFormData(prev => ({
            ...prev,
            title: `Re: ${ticket.Subject}`,
            description: ticket.Description,
            priority: ticket.Priority as Priority,
            complaint_type: ticket.Complaint_Type,
            complaintTypeId: ticket.Complaint_Type_ID,
        }));
        ticketFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual Validation
        const errors: string[] = [];
        if (!selectedCustomer && !showNewCustomerForm) errors.push("Please select or create a customer.");
        if (!formData.title.trim()) errors.push("Subject is required.");
        if (!formData.complaintTypeId) errors.push("Complaint Type is required.");
        if (!formData.description.trim()) errors.push("Description is required.");

        if (errors.length > 0) {
            alert(errors.join("\n"));
            return;
        }

        setIsLoading(true);

        let finalCustomerId = selectedCustomer?.Customer_ID;

        if (!selectedCustomer && showNewCustomerForm) {
            try {
                if (formData.customer_number.length !== 10) {
                    alert('Please enter a valid 10-digit mobile number.');
                    setIsLoading(false);
                    return;
                }

                // Use backend API
                const response = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerName: formData.customerName,
                        customerNumber: formData.customer_number,
                        customerAddress: formData.customer_address,
                        customerTypeId: Number(formData.customer_type),
                        cityName: formData.city_name,
                        pincode: formData.pincode
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to create customer');
                }

                const data = await response.json();
                finalCustomerId = data.customerId;
            } catch (err: any) {
                console.error('Error creating customer:', err);
                alert(`Customer creation failed: ${err.message}`);
                setIsLoading(false);
                return;
            }
        }

        // Helper to find customer type name from ID
        const selectedType = customerTypes.find(ct => ct.Customer_Type_ID === Number(formData.customer_type));
        const customerTypeName = selectedType ? selectedType.Customer_Type_Name : 'Unknown';

        // Helper to find ASM/RSM mobile
        const selectedASM = asmList.find(asm => asm.ASM_Name === formData.asm_name);
        const asm_mobile = selectedASM ? selectedASM.Mobile : '';

        const selectedRSM = rsmList.find(rsm => rsm.RSM_Name === formData.rsm_name);
        const rsm_mobile = selectedRSM ? selectedRSM.Mobile : '';

        const payload = {
            ...formData,
            asm_mobile,
            rsm_mobile,
            customer_type: customerTypeName,
            customer_id: finalCustomerId,
            customerName: formData.customerName || selectedCustomer?.Customer_Name,
            customer: {
                id: finalCustomerId,
                name: formData.customerName || selectedCustomer?.Customer_Name,
                role: 'customer'
            }
        };

        try {
            await onSubmit(payload);
        } catch (error) {
            console.error("Error submitting ticket:", error);
            alert("Failed to submit ticket. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* 1. Sticky Search Header - Simplified */}
            <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white p-1 rounded-md"><Plus className="w-5 h-5" /></span> Create Ticket
                    </h2>

                    <div className="flex items-center gap-3">
                        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 font-medium text-sm">Cancel</button>
                        <button onClick={handleSubmit} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Ticket</>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="max-w-7xl mx-auto h-full flex gap-6 p-6 overflow-hidden relative transition-all duration-300">

                    {/* LEFT COLUMN: Customer & Ticket Details */}
                    <div className={`flex flex-col overflow-y-auto custom-scrollbar pr-2 pb-20 transition-all duration-300 ${isHistoryOpen ? 'w-full lg:w-2/3' : 'w-full'}`}>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Customer Section */}
                            <div className="p-5 border-b border-slate-100 relative">
                                <AnimatePresence mode="wait">
                                    {selectedCustomer ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="relative z-10"
                                            key="selected"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-6 -mt-6 opacity-50" />
                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-100">
                                                        {selectedCustomer.Customer_Name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.Customer_Name}</h2>
                                                        <div className="flex flex-wrap items-center gap-3 text-slate-500 mt-1">
                                                            <span className="flex items-center gap-1 text-xs group cursor-pointer" onClick={() => copyToClipboard(selectedCustomer.Customer_Number)} title="Click to copy">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                {selectedCustomer.Customer_Number}
                                                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs"><Briefcase className="w-3.5 h-3.5" /> {selectedCustomer.Customer_Type_Name || selectedCustomer.Customer_Type_Name_Joined}</span>
                                                            {selectedCustomer.Customer_Address && (
                                                                <span className="flex items-center gap-1 text-xs"><MapPin className="w-3.5 h-3.5" /> {selectedCustomer.Customer_Address}</span>
                                                            )}
                                                            {(selectedCustomer.city_name || selectedCustomer.pincode) && (
                                                                <span className="flex items-center gap-1 text-xs">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    {[selectedCustomer.city_name, selectedCustomer.pincode].filter(Boolean).join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${isHistoryOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                    >
                                                        <History className="w-3.5 h-3.5" />
                                                        {isHistoryOpen ? 'Hide History' : 'Show History'}
                                                    </button>
                                                    <button onClick={() => { setSelectedCustomer(null); setFormData(prev => ({ ...prev, customerName: '', customer_number: '', customer_address: '' })); }} className="text-xs text-slate-400 hover:text-red-500 font-medium bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-colors">
                                                        Change
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, height: 'auto' }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            key="search"
                                        >
                                            <div className="mb-6">
                                                <form onSubmit={handleManualSearch} className="relative w-full">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Enter Customer Mobile Number or Name..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                                                    />

                                                    {/* Search Results Dropdown */}
                                                    {hasSearched && searchResults.length > 0 && !selectedCustomer && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-30 max-h-60 overflow-y-auto custom-scrollbar">
                                                            {searchResults.map((customer) => (
                                                                <div
                                                                    key={customer.Customer_ID}
                                                                    onClick={() => selectCustomer(customer)}
                                                                    className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                                                                            {customer.Customer_Name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-slate-900 text-sm">{customer.Customer_Name}</h4>
                                                                            <p className="text-xs text-slate-500">{customer.Customer_Number} • {customer.Customer_Type_Name || customer.Customer_Type_Name_Joined}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Select</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {hasSearched && searchResults.length === 0 && !showNewCustomerForm && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white p-3 text-center rounded-lg shadow-xl border border-slate-100 z-30">
                                                            <p className="text-sm text-slate-500 mb-2">No customer found.</p>
                                                            <button onClick={() => { setShowNewCustomerForm(true); setFormData(prev => ({ ...prev, customer_number: searchQuery })); }} className="text-sm text-indigo-600 font-semibold hover:underline">
                                                                + Add New Customer
                                                            </button>
                                                        </div>
                                                    )}
                                                </form>
                                            </div>

                                            {!showNewCustomerForm ? (
                                                <div className="text-center py-2">
                                                    <p className="text-slate-500 text-sm mb-2">Or if the customer is not found</p>
                                                    <button
                                                        onClick={() => setShowNewCustomerForm(true)}
                                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
                                                    >
                                                        <Plus className="w-4 h-4" /> Create New Customer
                                                    </button>
                                                </div>
                                            ) : (
                                                // New Customer Form
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

                                                    <div className="flex items-start gap-3 relative z-10">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 mt-0.5">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 text-sm">New Customer</h3>
                                                            <p className="text-slate-500 text-xs mt-0.5">Enter details to register a new customer.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-0 relative z-10">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name <span className="text-red-500">*</span></label>
                                                            <div className="relative group">
                                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                                <input
                                                                    required
                                                                    placeholder="Enter full name"
                                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                                    value={formData.customerName}
                                                                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Mobile Number <span className="text-red-500">*</span></label>
                                                            <div className="relative group">
                                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                                <input
                                                                    required
                                                                    type="text"
                                                                    maxLength={10}
                                                                    placeholder="10-digit mobile number"
                                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                                    value={formData.customer_number}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                                        setFormData({ ...formData, customer_number: val });
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-2 space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Address</label>
                                                            <div className="relative group">
                                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                                <input
                                                                    placeholder="House No, Street, Landmark"
                                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                                    value={formData.customer_address}
                                                                    onChange={e => setFormData({ ...formData, customer_address: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">City</label>
                                                            <input
                                                                placeholder="City Name"
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                                value={formData.city_name}
                                                                onChange={e => setFormData({ ...formData, city_name: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pincode</label>
                                                            <input
                                                                placeholder="Pincode"
                                                                maxLength={6}
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                                value={formData.pincode}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                                    setFormData({ ...formData, pincode: val });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Customer Type</label>
                                                            <div className="relative group">
                                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                                                <select
                                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                                                                    value={formData.customer_type}
                                                                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                                                                >
                                                                    <option value="">Select Type</option>
                                                                    {customerTypes.length > 0 ? (
                                                                        customerTypes.map((type: any) => (
                                                                            <option key={type.Customer_Type_ID} value={type.Customer_Type_ID}>
                                                                                {type.Customer_Type_Name}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <>
                                                                            <option value="1">Retailer</option>
                                                                            <option value="2">Distributor</option>
                                                                            <option value="3">Farmer</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-2 pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddCustomer}
                                                                disabled={isAddingCustomer || addCustomerSuccess}
                                                                className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${addCustomerSuccess
                                                                    ? 'bg-green-600 text-white shadow-green-200 shadow-md'
                                                                    : 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200 shadow-md'
                                                                    } `}
                                                            >
                                                                {isAddingCustomer ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : addCustomerSuccess ? (
                                                                    <>
                                                                        <ThumbsUp className="w-5 h-5 animate-bounce" />
                                                                        Added Successfully
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus className="w-4 h-4" /> Add Customer
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Ticket Details Section - Moved Below Customer */}
                        <div ref={ticketFormRef} className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Briefcase className="w-4 h-4" /></span>
                                Ticket Details
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject / Issue Summary <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="Brief summary of the issue..."
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Complaint Type <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-colors cursor-pointer"
                                            value={formData.complaintTypeId}
                                            onChange={(e) => {
                                                const text = e.target.options[e.target.selectedIndex].text;
                                                setFormData(prev => ({ ...prev, complaintTypeId: Number(e.target.value), complaint_type: text }));
                                            }}
                                        >
                                            <option value="">Select Type</option>
                                            {complaintTypeList.length > 0 ? (
                                                complaintTypeList.map((type: any) => (
                                                    <option key={type.Complaint_Type_ID} value={type.Complaint_Type_ID}>
                                                        {type.Complaint_Name}
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="1">Internet Issue</option>
                                                    <option value="2">Hardware Failure</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Priority</label>
                                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                                            {['low', 'medium', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, priority: p as Priority }))}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${formData.priority === p
                                                        ? (p === 'high' ? 'bg-red-100 text-red-700 shadow-sm' : p === 'medium' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'bg-green-100 text-green-700 shadow-sm')
                                                        : 'text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Area Sales Manager (ASM)</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-colors cursor-pointer"
                                            value={formData.asm_name}
                                            onChange={e => setFormData({ ...formData, asm_name: e.target.value })}
                                            disabled={mastersLoading}
                                        >
                                            <option value="">Select ASM</option>
                                            {asmList.map(asm => <option key={asm.ASM_ID} value={asm.ASM_Name}>{asm.ASM_Name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Regional Sales Manager (RSM)</label>
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-colors cursor-pointer"
                                            value={formData.rsm_name}
                                            onChange={e => setFormData({ ...formData, rsm_name: e.target.value })}
                                            disabled={mastersLoading}
                                        >
                                            <option value="">Select RSM</option>
                                            {rsmList.map(rsm => <option key={rsm.RSM_ID} value={rsm.RSM_Name}>{rsm.RSM_Name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Detailed Description <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all h-32 resize-none"
                                        placeholder="Please describe the issue in detail..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: History - Conditional Rendering */}
                    <AnimatePresence>
                        {isHistoryOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0, x: 50 }}
                                animate={{ width: 350, opacity: 1, x: 0 }}
                                exit={{ width: 0, opacity: 0, x: 50 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="flex-shrink-0 flex flex-col gap-4 overflow-hidden h-full"
                            >
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden w-[350px]">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                            <History className="w-4 h-4 text-indigo-500" /> Ticket History
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {customerTickets.length > 0 && (
                                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{customerTickets.length}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                        {selectedCustomer ? (
                                            customerTickets.length > 0 ? (
                                                customerTickets.map(ticket => (
                                                    <div key={ticket.Ticket_ID} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all group relative cursor-pointer" onClick={() => copyTicket(ticket)}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-mono text-xs font-semibold text-slate-500">{ticket.Ticket_No || `#${ticket.Ticket_ID}`}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ticket.Status === 'Open' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                                {ticket.Status}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-medium text-slate-800 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">{ticket.Subject}</h4>
                                                        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                                                            <span>{new Date(ticket.Created_At).toLocaleDateString()}</span>
                                                            <span className="group-hover:opacity-100 opacity-0 transition-opacity text-indigo-600 font-medium flex items-center gap-1">
                                                                <Copy className="w-3 h-3" /> Clone
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center opacity-60">
                                                    <History className="w-8 h-8 mb-2" />
                                                    <p className="text-sm">No previous tickets</p>
                                                </div>
                                            )
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center opacity-60">
                                                <Search className="w-8 h-8 mb-2" />
                                                <p className="text-sm">Select a customer to view history</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

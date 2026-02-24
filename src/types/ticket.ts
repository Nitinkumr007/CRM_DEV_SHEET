export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'open' | 'in-progress' | 'resolved' | 'closed';

export interface User {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'agent' | 'customer';
    email?: string;
    loginId?: number;
    code?: string; // User Code
}

export interface Ticket {
    id: string; // Internal ID (Ticket_ID) or Display ID (Ticket_No) - Context handles this
    ticketNo: string; // Explicit display ID
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    customer: User; // Derived from Customer_Name/Customer_Type/etc
    assignedTo?: User;
    createdBy?: User;
    tags: string[]; // Frontend only for now
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    phoneNumber?: string; // Mapped from Customer_Number
    location?: string; // Mapped from Customer_Address
    customerName?: string; // Legacy/Flat mapping support

    // Schema Fields
    complaintTypeId?: number;
    complaintType?: string;

    // Expanded Schema Fields (Backend direct mapping)
    asm?: string;
    asm_name?: string;
    asm_mobile?: string;
    rsm?: string;
    rsm_name?: string;
    rsm_mobile?: string;
    customer_type?: string;
    customer_types?: string; // Duplicate column handling
    customer_number?: string;
    customer_address?: string;
    priority_level?: string;
    sla_hours?: number;
    customer_id?: number;
    pincode?: string;
    city_name?: string;

    // Closing Details
    closingRemarks?: string;
    closedBy?: string; // Name of the user who closed it
    closedAt?: string;
}

export const PRIORITY_STYLES: Record<Priority, string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
};

export const STATUS_STYLES: Record<Status, string> = {
    open: 'bg-slate-100 text-slate-700',
    'in-progress': 'bg-indigo-100 text-indigo-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-emerald-100 text-emerald-700',
};

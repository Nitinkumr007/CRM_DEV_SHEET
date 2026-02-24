/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ticket } from '../types/ticket';
import { gsheet } from '../lib/gsheet';

interface TicketContextType {
    tickets: Ticket[];
    loading: boolean;
    refreshTickets: () => void;
    addTicket: (ticket: Partial<Ticket>) => Promise<any>;
    updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
    deleteTicket: (id: string) => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            // 1. Fetch tables
            const [rawTickets, users, complaints, customers, asms, rsms] = await Promise.all([
                gsheet.read('Ticket_Master'),
                gsheet.read('User_Master'),
                gsheet.read('Complaint_Type_Master'),
                gsheet.read('customers_profile'),
                gsheet.read('ASM_Master'),
                gsheet.read('RSM_Master')
            ]);

            // 2. Create Maps for faster lookups O(1) instead of O(N)
            const userMap = new Map(users.map((u: any) => [String(u.User_ID), u]));
            const complaintMap = new Map(complaints.map((ct: any) => [String(ct.Complaint_Type_ID), ct]));
            const customerMap = new Map(customers.map((c: any) => [String(c.Customer_ID), c]));
            const asmMap = new Map(asms.map((a: any) => [a.ASM_Name, a]));
            const rsmMap = new Map(rsms.map((r: any) => [r.RSM_Name, r]));

            // 3. Perform Join
            const mappedTickets: Ticket[] = rawTickets.map((t: any): Ticket => {
                const assignedUser = userMap.get(String(t.Assigned_To));
                const creator = userMap.get(String(t.Created_By));
                const complaintType = complaintMap.get(String(t.Complaint_Type_ID));
                const customerProfile = customerMap.get(String(t.Customer_ID));

                const asm = asmMap.get(t.ASM_Name);
                const rsm = rsmMap.get(t.RSM_Name);

                const customerNum = t.customer_number || t.phoneNumber || t.Mobile || '';
                const customerName = customerProfile?.Customer_Name || t.customer_name || 'Unknown';

                // Safe date parsing helper
                const parseSafeDate = (val: any) => {
                    if (!val) return undefined;
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? undefined : d.toISOString();
                };

                const createdAt = parseSafeDate(t.Created_At) || new Date().toISOString();
                const updatedAt = parseSafeDate(t.Updated_At) || createdAt;
                const closedAt = parseSafeDate(t.Closed_At);

                const status = String(t.Status || 'open').toLowerCase().replace(' ', '-') as any;
                const priority = String(t.Priority || 'medium').toLowerCase() as any;

                return {
                    id: String(t.Ticket_ID || t.id || ''),
                    ticketNo: String(t.Ticket_No || t.ticketNo || `T-${String(t.Ticket_ID).slice(-5)}`),
                    title: String(t.Subject || t.title || 'No Subject'),
                    description: String(t.Description || t.description || ''),
                    status,
                    priority,
                    customer: {
                        id: String(t.Customer_ID || ''),
                        name: customerName,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random`,
                        role: 'customer'
                    },
                    assignedTo: assignedUser ? {
                        id: String(assignedUser.User_ID),
                        name: String(assignedUser.Full_Name),
                        role: (String(assignedUser.Role).toLowerCase() === 'admin' ? 'admin' : 'agent'),
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser.Full_Name)}&background=random`
                    } : undefined,
                    createdBy: creator ? {
                        id: String(creator.User_ID),
                        name: String(creator.Full_Name),
                        role: (String(creator.Role).toLowerCase() === 'admin' ? 'admin' : 'agent'),
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.Full_Name)}&background=random`
                    } : undefined,
                    createdAt,
                    updatedAt,
                    tags: complaintType ? [complaintType.Complaint_Name] : [],
                    complaintTypeId: t.Complaint_Type_ID,
                    complaintType: complaintType ? complaintType.Complaint_Name : t.Complaint_Type,
                    asm_name: t.ASM_Name,
                    rsm_name: t.RSM_Name,
                    asm_mobile: asm?.Mobile || t.asm_mobile || '',
                    rsm_mobile: rsm?.Mobile || t.rsm_mobile || '',
                    customer_number: String(t.Customer_Number || customerNum),
                    phoneNumber: String(customerNum),
                    customer_address: t.Customer_Address || customerProfile?.Customer_Address,
                    location: t.Customer_Address || customerProfile?.Customer_Address,
                    sla_hours: t.sla_hours,
                    customer_id: t.Customer_ID,
                    pincode: t.pincode,
                    city_name: t.city_name,
                    closingRemarks: t.Closing_Remarks,
                    closedBy: t.Closed_By_Name,
                    closedAt
                };
            }).filter(t => t.id);
            setTickets(mappedTickets);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const refreshTickets = () => fetchTickets();

    const addTicket = async (ticketData: any) => {
        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add ticket');
            }

            const data = await response.json();
            fetchTickets();
            return data;
        } catch (err: any) {
            console.error('Error adding ticket', err);
            throw err;
        }
    };

    const updateTicket = async (id: string, updates: any) => {
        try {
            const response = await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update ticket');
            }

            fetchTickets();
        } catch (err) {
            console.error('Error updating ticket', err);
        }
    };

    const deleteTicket = async (id: string) => {
        try {
            const query = 'DELETE FROM Ticket_Master WHERE Ticket_ID = @id';
            await gsheet.query(query, { id });
            fetchTickets();
        } catch (err) {
            console.error('Error deleting ticket', err);
        }
    };

    return (
        <TicketContext.Provider value={{ tickets, loading, refreshTickets, addTicket, updateTicket, deleteTicket }}>
            {children}
        </TicketContext.Provider>
    );
}

export function useTickets() {
    const context = useContext(TicketContext);
    if (context === undefined) {
        throw new Error('useTickets must be used within a TicketProvider');
    }
    return context;
}

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ticket } from '../types/ticket';

interface TicketContextType {
    tickets: Ticket[];
    loading: boolean;
    refreshTickets: () => void;
    addTicket: (ticket: any) => Promise<any>;
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
            const token = localStorage.getItem('token');
            const res = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Map DB fields to Frontend Type if needed, or adjust Type
            // Assuming DB returns compatible structure or we adjust here
            // Simple mapping for now:
            const mappedTickets: Ticket[] = data.map((t: any) => ({
                id: String(t.Ticket_ID), // Internal ID used for logic
                ticketNo: t.Ticket_No, // Display ID
                title: t.Subject,
                description: t.Description,
                status: (t.Status?.toLowerCase() || 'open') as any,
                priority: (t.Priority?.toLowerCase() || 'medium') as any,
                createdAt: t.Created_At,
                updatedAt: t.Updated_At || t.Created_At,
                customer: {
                    id: String(t.customer_id || t.Ticket_ID), // Fallback if customer_id missing
                    name: t.Customer_Name || 'Unknown Customer',
                    role: t.customer_type || t.customer_types || 'customer', // Map actual type
                    avatar: `https://ui-avatars.com/api/?name=${t.Customer_Name || 'User'}&background=random`
                },
                assignedTo: t.Assigned_To ? {
                    id: String(t.Assigned_To),
                    name: t.Assigned_User || 'Agent',
                    role: 'admin',
                    avatar: `https://ui-avatars.com/api/?name=${t.Assigned_User || 'Agent'}&background=random`
                } : undefined,
                createdBy: t.Created_By ? {
                    id: String(t.Created_By),
                    name: t.Creator_Name || 'Admin',
                    role: 'admin',
                    avatar: `https://ui-avatars.com/api/?name=${t.Creator_Name || 'Admin'}&background=random`
                } : undefined,
                tags: t.Complaint_Type ? [t.Complaint_Type] : [], // Use complaint type as a tag

                // Detailed Schema Fields
                complaintTypeId: t.Complaint_Type_ID,
                complaintType: t.Complaint_Type, // Joined name

                asm: t.asm || t.asm_name, // Handle possible duplicate columns
                asm_name: t.asm_name || t.asm,
                rsm: t.rsm || t.rsm_name,
                rsm_name: t.rsm_name || t.rsm,
                customer_type: t.customer_type || t.customer_types,
                customer_types: t.customer_types || t.customer_type,
                customer_number: t.customer_number || t.customer_numbers,
                phoneNumber: t.customer_number || t.customer_numbers, // Map to generic field
                customer_address: t.customer_address || t.customers_address,
                location: t.customer_address || t.customers_address, // Map to generic field
                priority_level: t.priority_level,
                sla_hours: t.sla_hours || t.sla_hour,
                customer_id: t.customer_id,
                pincode: t.pincode,
                city_name: t.city_name,

                // Closing Details
                closingRemarks: t.Closing_Remarks,
                closedBy: t.Closed_By_Name || t.Closed_By, // Assuming backend joins or we use ID for now. 
                // Wait, I need to check if backend joins Closed_By to get name.
                // In tickets.js GET /, I need to check if I joined Closed_By. 
                // Query was: 
                // LEFT JOIN User_Master u ON t.Assigned_To = u.User_ID
                // LEFT JOIN User_Master creator ON t.Created_By = creator.User_ID
                // It does NOT join Closed_By.
                // I should update backend to join Closed_By to get name, OR just show ID for now. 
                // User asked to show "Closed by [Name]".
                // So I should update backend GET / and GET /customer/:id to join for Closed_By_Name.
                // For now, I'll map what I can.
                closedAt: t.Closed_At
            }));
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
            const token = localStorage.getItem('token');
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(ticketData)
            });
            const data = await res.json();
            fetchTickets();
            return data;
        } catch (err) {
            console.error('Error adding ticket', err);
            return null;
        }
    };

    const updateTicket = async (id: string, updates: Partial<Ticket>) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/tickets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            fetchTickets();
        } catch (err) {
            console.error('Error updating ticket', err);
        }
    };

    const deleteTicket = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/tickets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
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

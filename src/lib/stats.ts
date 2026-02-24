import { gsheet } from './gsheet';

export interface DashboardStats {
    total: number;
    pending: number;
    resolved: number;
    activeCustomers: number;
    recent: any[];
    chart: any[];
    priority_counts: any[];
    type_counts: any[];
    avg_resolution_hours: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // 1. Fetch data
        const [tickets, complaints, users, customers] = await Promise.all([
            gsheet.read('Ticket_Master'),
            gsheet.read('Complaint_Type_Master'),
            gsheet.read('User_Master'),
            gsheet.read('customers_profile')
        ]);

        // 2. Compute basic counts
        const total = tickets.length;
        const pending = tickets.filter((t: any) => ['open', 'pending'].includes((t.Status || '').toLowerCase())).length;
        const resolved = tickets.filter((t: any) => ['resolved', 'closed'].includes((t.Status || '').toLowerCase())).length;

        // Handle column name mismatch (Customer_Status vs customer_statu)
        const activeCustomers = customers.filter((c: any) => {
            const status = (c.Customer_Status || c.customer_statu || '').toLowerCase();
            return status === 'active';
        }).length;

        // 3. Recently created
        const recent = [...tickets]
            .sort((a, b) => new Date(b.Created_At || 0).getTime() - new Date(a.Created_At || 0).getTime())
            .slice(0, 5)
            .map((t: any) => {
                const assignedUser = users.find((u: any) => u.User_ID == t.Assigned_To);
                const complaintType = complaints.find((ct: any) => ct.Complaint_Type_ID == t.Complaint_Type_ID);
                return {
                    ...t,
                    Complaint_Name: complaintType ? complaintType.Complaint_Name : (t.complaint_type || 'General'),
                    Assigned_User: assignedUser ? assignedUser.Full_Name : 'Unassigned'
                };
            });

        // 4. Priority Distribution
        const priorityMap: any = {};
        tickets.forEach((t: any) => {
            const p = t.Priority || 'Medium';
            priorityMap[p] = (priorityMap[p] || 0) + 1;
        });
        const priorityDist = Object.keys(priorityMap).map(k => ({ Priority: k, count: priorityMap[k] }));

        // 5. Complaint Type Distribution
        const typeMap: any = {};
        tickets.forEach((t: any) => {
            const ct = complaints.find((c: any) => c.Complaint_Type_ID == t.Complaint_Type_ID);
            const name = ct ? ct.Complaint_Name : (t.complaint_type || 'Unknown');
            typeMap[name] = (typeMap[name] || 0) + 1;
        });
        const typeDist = Object.keys(typeMap).map(k => ({ Complaint_Name: k, count: typeMap[k] }));

        // 6. Avg Resolution Time
        const resolvedTickets = tickets.filter((t: any) =>
            ['resolved', 'closed'].includes((t.Status || '').toLowerCase()) && t.Created_At && t.Updated_At
        );
        let avgRes = 0;
        if (resolvedTickets.length > 0) {
            const totalHours = resolvedTickets.reduce((sum: number, t: any) => {
                const diff = (new Date(t.Updated_At).getTime() - new Date(t.Created_At).getTime()) / (1000 * 60 * 60);
                return sum + (diff > 0 ? diff : 0);
            }, 0);
            avgRes = totalHours / resolvedTickets.length;
        }

        // 7. Chart Data (Last 7 Days)
        const last7Days: any = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last7Days[dateStr] = 0;
        }
        tickets.forEach((t: any) => {
            if (t.Created_At) {
                const date = new Date(t.Created_At);
                // Safe date check
                if (!isNaN(date.getTime())) {
                    const dateStr = date.toISOString().split('T')[0];
                    if (last7Days[dateStr] !== undefined) {
                        last7Days[dateStr]++;
                    }
                }
            }
        });
        const chart = Object.keys(last7Days).map(k => ({ date: k, count: last7Days[k] })).reverse();

        return {
            total,
            pending,
            resolved,
            activeCustomers,
            recent,
            chart,
            priority_counts: priorityDist,
            type_counts: typeDist,
            avg_resolution_hours: Math.round(avgRes * 10) / 10
        };
    } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        throw error;
    }
}

export async function getUserPerformance(): Promise<any[]> {
    const [users, tickets] = await Promise.all([
        gsheet.read('User_Master'),
        gsheet.read('Ticket_Master')
    ]);

    const performance = users.map((u: any) => {
        const userTickets = tickets.filter((t: any) => t.Assigned_To == u.User_ID);
        if (userTickets.length === 0) return null;

        const open = userTickets.filter((t: any) => (t.Status || '').toLowerCase() === 'open').length;
        const resolved = userTickets.filter((t: any) => ['resolved', 'closed'].includes((t.Status || '').toLowerCase()));

        let avgHours = 0;
        if (resolved.length > 0) {
            const totalHours = resolved.reduce((sum: number, t: any) => {
                const diff = (new Date(t.Updated_At).getTime() - new Date(t.Created_At).getTime()) / (1000 * 60 * 60);
                return sum + (diff > 0 ? diff : 0);
            }, 0);
            avgHours = totalHours / resolved.length;
        }

        return {
            Full_Name: u.Full_Name,
            Total_Assigned: userTickets.length,
            Open_Tickets: open,
            Resolved_Tickets: resolved.length,
            Avg_Resolution_Hours: Math.round(avgHours * 10) / 10
        };
    }).filter(p => p !== null);

    return performance.sort((a, b) => b!.Resolved_Tickets - a!.Resolved_Tickets);
}

export async function getSlaCompliance(): Promise<any[]> {
    const [tickets, users] = await Promise.all([
        gsheet.read('Ticket_Master'),
        gsheet.read('User_Master')
    ]);

    const now = new Date();
    const slaStatus = tickets
        .filter((t: any) => !['resolved', 'closed'].includes((t.Status || '').toLowerCase()) && t.sla_hours)
        .map((t: any) => {
            const hoursOpen = Math.round((now.getTime() - new Date(t.Created_At).getTime()) / (1000 * 60 * 60));
            const assignedUser = users.find((u: any) => u.User_ID == t.Assigned_To);

            return {
                Ticket_No: t.Ticket_No,
                Subject: t.Subject,
                Status: t.Status,
                Created_At: t.Created_At,
                sla_hours: t.sla_hours,
                Hours_Open: hoursOpen,
                SLA_Status: hoursOpen > t.sla_hours ? 'Breached' : 'Within SLA',
                Assigned_To: assignedUser ? assignedUser.Full_Name : 'Unassigned'
            };
        });

    return slaStatus.sort((a, b) => b.Hours_Open - a.Hours_Open);
}

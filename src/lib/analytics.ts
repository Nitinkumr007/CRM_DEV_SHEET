import type { Ticket } from '../types/ticket';

export const calculateTicketVolumeByDay = (tickets: Ticket[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const volume = new Array(7).fill(0);

    tickets.forEach(ticket => {
        const date = new Date(ticket.createdAt);
        const dayIndex = date.getDay();
        volume[dayIndex]++;
    });

    return days.map((day, index) => ({
        name: day,
        tickets: volume[index]
    }));
};

export const calculateStatusDistribution = (tickets: Ticket[]) => {
    const statusCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
        statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getColorForStatus(name)
    }));
};

export const calculatePriorityDistribution = (tickets: Ticket[]) => {
    const priorityCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
        priorityCounts[ticket.priority] = (priorityCounts[ticket.priority] || 0) + 1;
    });

    return Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: getColorForPriority(name)
    }));
};

export const calculateCategoryDistribution = (tickets: Ticket[]) => {
    const categoryCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
        const category = ticket.complaintType || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([name, value], index) => ({
        name,
        value,
        color: getSoftColor(index)
    }));
};

export const calculateLocationDistribution = (tickets: Ticket[]) => {
    const locationCounts: Record<string, number> = {};
    tickets.forEach(ticket => {
        const location = ticket.location || 'Unknown';
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    // Top 5 locations
    return Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({
            name,
            tickets: value
        }));
};

// Helpers for colors
const getColorForStatus = (status: string) => {
    switch (status) {
        case 'open': return '#6366f1'; // Indigo
        case 'in-progress': return '#ec4899'; // Pink
        case 'resolved': return '#10b981'; // Emerald
        case 'closed': return '#94a3b8'; // Slate
        default: return '#cbd5e1';
    }
};

const getColorForPriority = (priority: string) => {
    switch (priority) {
        case 'low': return '#3b82f6'; // Blue
        case 'medium': return '#f59e0b'; // Amber
        case 'high': return '#f97316'; // Orange
        case 'urgent': return '#ef4444'; // Red
        default: return '#cbd5e1';
    }
};

const getSoftColor = (index: number) => {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];
    return colors[index % colors.length];
};

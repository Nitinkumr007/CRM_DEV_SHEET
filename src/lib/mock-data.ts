import type { Ticket } from '../types/ticket';

export const MOCK_TICKETS: Ticket[] = [
    {
        id: 'T-1001',
        ticketNo: 'T-1001',
        title: 'Login authentication failing on mobile app',
        description: 'Users are reporting that they cannot log in using the iOS application after the latest update.',
        status: 'open',
        priority: 'urgent',
        customer: {
            id: 'u1',
            name: 'Alice Johnson',
            avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
            role: 'customer',
        },
        assignedTo: {
            id: 'a1',
            name: 'Nitin Kumar',
            avatar: 'https://ui-avatars.com/api/?name=Nitin+Kumar&background=random',
            role: 'admin'
        },
        tags: ['mobile', 'bug', 'auth'],
        createdAt: '2023-10-25T09:00:00Z',
        updatedAt: '2023-10-25T10:30:00Z',
        phoneNumber: '9876543210',
        location: 'Mumbai, MH',
        rsm: 'Rahul Singh',
        asm: 'Amit Kumar'
    },
    {
        id: 'T-1002',
        ticketNo: 'T-1002',
        title: 'Feature request: Dark mode',
        description: 'Many customers have requested a dark mode for the dashboard.',
        status: 'in-progress',
        priority: 'medium',
        customer: {
            id: 'u2',
            name: 'Bob Smith',
            avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=random',
            role: 'customer',
        },
        assignedTo: {
            id: 'a2',
            name: 'Sarah Lee',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Lee&background=random',
            role: 'agent'
        },
        tags: ['ui', 'feature'],
        createdAt: '2023-10-24T14:15:00Z',
        updatedAt: '2023-10-26T11:00:00Z',
        phoneNumber: '9123456780',
        location: 'Pune, MH'
    },
    {
        id: 'T-1003',
        ticketNo: 'T-1003',
        title: 'Billing statement incorrectly generated',
        description: 'The PDF generation for the October billing cycle has a layout issue.',
        status: 'open',
        priority: 'high',
        customer: {
            id: 'u3',
            name: 'Charlie Davis',
            avatar: 'https://ui-avatars.com/api/?name=Charlie+Davis&background=random',
            role: 'customer',
        },
        tags: ['billing', 'bug'],
        createdAt: '2023-10-26T08:45:00Z',
        updatedAt: '2023-10-26T08:45:00Z',
        phoneNumber: '8899776655',
        location: 'Delhi, DL'
    },
    {
        id: 'T-1004',
        ticketNo: 'T-1004',
        title: 'Update payment gateway integration',
        description: 'We need to update the Stripe API version to the latest one.',
        status: 'in-progress',
        priority: 'medium',
        customer: {
            id: 'u4',
            name: 'Diana Evans',
            avatar: 'https://ui-avatars.com/api/?name=Diana+Evans&background=random',
            role: 'customer',
        },
        tags: ['backend', 'maintenance'],
        createdAt: '2023-10-20T16:20:00Z',
        updatedAt: '2023-10-22T09:15:00Z',
    },
    {
        id: 'T-1005',
        ticketNo: 'T-1005',
        title: 'Slow dashboard loading times',
        description: 'The main dashboard takes over 5 seconds to load for large accounts.',
        status: 'open',
        priority: 'high',
        customer: {
            id: 'u5',
            name: 'Evan Wright',
            avatar: 'https://ui-avatars.com/api/?name=Evan+Wright&background=random',
            role: 'customer',
        },
        assignedTo: {
            id: 'a1',
            name: 'Nitin Kumar',
            avatar: 'https://ui-avatars.com/api/?name=Nitin+Kumar&background=random',
            role: 'admin'
        },
        tags: ['performance', 'optimization'],
        createdAt: '2023-10-27T10:00:00Z',
        updatedAt: '2023-10-27T10:00:00Z',
    },
];

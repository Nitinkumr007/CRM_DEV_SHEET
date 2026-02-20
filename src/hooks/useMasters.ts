import { useState, useEffect } from 'react';

export interface ASM {
    ASM_ID: number;
    ASM_Code: string;
    ASM_Name: string;
    District: string;
    RSM_ID: number;
}

export interface RSM {
    RSM_ID: number;
    RSM_Code: string;
    RSM_Name: string;
    Region: string;
}

export function useMasters() {
    const [asmList, setAsmList] = useState<ASM[]>([]);
    const [rsmList, setRsmList] = useState<RSM[]>([]);
    const [complaintTypeList, setComplaintTypeList] = useState<any[]>([]);
    const [customerTypes, setCustomerTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [asmRes, rsmRes, complaintRes, custTypeRes] = await Promise.all([
                    fetch('/api/masters/asm', { headers }),
                    fetch('/api/masters/rsm', { headers }),
                    fetch('/api/masters/complaint-type', { headers }),
                    fetch('/api/masters/customer-type', { headers })
                ]);

                if (asmRes.ok) setAsmList(await asmRes.json());
                if (rsmRes.ok) setRsmList(await rsmRes.json());
                if (complaintRes.ok) setComplaintTypeList(await complaintRes.json());
                if (custTypeRes.ok) setCustomerTypes(await custTypeRes.json());

            } catch (error) {
                console.error('Error fetching masters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { asmList, rsmList, complaintTypeList, customerTypes, loading };
}

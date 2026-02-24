import { useState, useEffect } from 'react';
import { gsheet } from '../lib/gsheet';

export interface ASM {
    ASM_ID: number;
    ASM_Code: string;
    ASM_Name: string;
    Mobile: string;
    District: string;
    RSM_ID: number;
}

export interface RSM {
    RSM_ID: number;
    RSM_Code: string;
    RSM_Name: string;
    Mobile: string;
    Region: string;
}

export function useMasters() {
    const [asmList, setAsmList] = useState<ASM[]>([]);
    const [rsmList, setRsmList] = useState<RSM[]>([]);
    const [complaintTypeList, setComplaintTypeList] = useState<any[]>([]);
    const [customerTypes, setCustomerTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [asm, rsm, complaints, custTypes] = await Promise.all([
                gsheet.read('ASM_Master'),
                gsheet.read('RSM_Master'),
                gsheet.read('Complaint_Type_Master'),
                gsheet.read('Customer_Type_Master')
            ]);

            setAsmList(asm);
            setRsmList(rsm);
            setComplaintTypeList(complaints);
            setCustomerTypes(custTypes);

        } catch (error) {
            console.error('Error fetching masters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { asmList, rsmList, complaintTypeList, customerTypes, loading, refreshMasters: fetchData };
}

export interface CustomerType {
    Customer_Type_ID: number;
    Customer_Type_Code: string;
    Customer_Type_Name: string;
    Description: string;
    Status_ID: number;
    Created_At?: string;
}

export interface Status {
    Status_ID: number;
    Status_Code: string;
    Status_Name: string;
    Status_Type: string;
}

export interface RSM {
    RSM_ID: number;
    RSM_Code: string;
    RSM_Name: string;
    Designation?: string;
    Mobile: string;
    Email: string;
    Region: string;
    Status_ID: number;
    Created_At?: string;
}

export interface ASM {
    ASM_ID: number;
    ASM_Code: string;
    ASM_Name: string;
    Mobile: string;
    Email: string;
    District: string;
    RSM_ID: number;
    RSM_NAME?: string;
    Status_ID: number;
    Created_At?: string;
}

export interface ComplaintType {
    Complaint_Type_ID: number;
    Complaint_Code: string;
    Complaint_Name: string;

    SLA_Hours: number;
    Status_ID: number;
    Complaint_Type_Status?: string;
    Created_At?: string;
}

export interface SystemUser {
    User_ID: number;
    User_Code: string;
    Full_Name: string;
    Email: string;
    Mobile: string;
    Role: string;
    Status_ID: number;
    Created_At?: string;
    // Password is only for sending, never receiving
}

export interface WhatsAppTemplate {
    Template_ID: number;
    Template_Name: string;
    Content: string;
    Category: string;
    Status_ID: number;
    Created_At?: string;
    Updated_At?: string;
}

-- Database Schema provided by User (UPDATED 2026-02-04)

USE [CRM_SW]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 7️⃣ APPLICATION LOGS
CREATE TABLE [dbo].[Application_Logs](
    [Log_ID] [int] IDENTITY(1,1) NOT NULL,
    [User_ID] [int] NULL,
    [User_Code] [varchar](50) NULL,
    [Action_Type] [varchar](50) NULL,      -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    [Module_Name] [varchar](50) NULL,      -- TICKET, MASTER, AUTH
    [Description] [nvarchar](max) NULL,    -- Detailed action description
    [IP_Address] [varchar](50) NULL,
    [Device_Info] [varchar](200) NULL,
    [Created_At] [datetime] DEFAULT (getdate()),
    CONSTRAINT PK_Application_Log PRIMARY KEY CLUSTERED ([Log_ID] ASC)
);
GO

-- 2️⃣ ASM MASTER
CREATE TABLE [dbo].[ASM_Master](
	[ASM_ID] [int] IDENTITY(1,1) NOT NULL,
	[ASM_Code] [varchar](20) NOT NULL,
	[ASM_Name] [varchar](100) NOT NULL,
	[Mobile] [varchar](15) NULL,
	[Email] [varchar](100) NULL,
	[District] [varchar](100) NULL,
	[RSM_ID] [int] NOT NULL,
	[Status_ID] [int] NULL,
	[Created_At] [datetime] DEFAULT (getdate()),
	[Updated_At] [datetime] NULL,
	[RSM_NAME] [varchar](100) NULL,
    PRIMARY KEY CLUSTERED ([ASM_ID] ASC),
    UNIQUE NONCLUSTERED ([ASM_Code] ASC)
);
GO

-- 3️⃣ CUSTOMER TYPE MASTER
CREATE TABLE [dbo].[Customer_Type_Master](
	[Customer_Type_ID] [int] IDENTITY(1,1) NOT NULL,
	[Customer_Type_Code] [varchar](20) NOT NULL,
	[Customer_Type_Name] [varchar](50) NOT NULL,
	[Description] [varchar](200) NULL,
	[Status_ID] [int] NULL,
	[Created_At] [datetime] DEFAULT (getdate()),
    PRIMARY KEY CLUSTERED ([Customer_Type_ID] ASC),
    UNIQUE NONCLUSTERED ([Customer_Type_Code] ASC)
);
GO

-- 1️⃣0️⃣ CUSTOMER PROFILE
CREATE TABLE [dbo].[customers_profile](
	[Customer_ID] [int] IDENTITY(1,1) NOT NULL,
	[Customer_Name] [varchar](255) NOT NULL,
	[Customer_type] [varchar](500) NOT NULL,
	[Customer_Number] [varchar](50) NOT NULL,
	[Customer_Address] [varchar](500) NOT NULL,
	[Customer_Type_ID] [int] NOT NULL,
	[tickets_count] [int] DEFAULT 0,
	[Created_At] [datetime] DEFAULT (getdate()),
	[Updated_At] [datetime] DEFAULT (getdate()),
	[customer_statu] [varchar](50) DEFAULT 'Active',
    PRIMARY KEY CLUSTERED ([Customer_ID] ASC)
);
GO

-- 8️⃣ LOGIN LOG
CREATE TABLE [dbo].[Login_Log](
	[Login_ID] [int] IDENTITY(1,1) NOT NULL,
	[User_ID] [int] NULL,
	[Login_Time] [datetime] DEFAULT (getdate()),
	[Logout_Time] [datetime] NULL,
	[Login_Status] [varchar](20) NULL,
	[IP_Address] [varchar](50) NULL,
	[Device_Info] [varchar](200) NULL,
    [User_Code] [varchar](50) NULL,
    PRIMARY KEY CLUSTERED ([Login_ID] ASC)
);
GO

-- 1️⃣ RSM MASTER
CREATE TABLE [dbo].[RSM_Master](
	[RSM_ID] [int] IDENTITY(1,1) NOT NULL,
	[RSM_Code] [varchar](20) NOT NULL,
	[RSM_Name] [varchar](100) NOT NULL,
	[Designation] [varchar](50) NULL,
	[Mobile] [varchar](15) NULL,
	[Email] [varchar](100) NULL,
	[Region] [varchar](100) NULL,
	[Status_ID] [int] NULL,
	[Created_At] [datetime] DEFAULT (getdate()),
	[Updated_At] [datetime] NULL,
    PRIMARY KEY CLUSTERED ([RSM_ID] ASC),
    UNIQUE NONCLUSTERED ([RSM_Code] ASC)
);
GO

-- 5️⃣ STATUS MASTER
CREATE TABLE [dbo].[Status_Master](
	[Status_ID] [int] IDENTITY(1,1) NOT NULL,
	[Status_Code] [varchar](20) NOT NULL,
	[Status_Name] [varchar](50) NOT NULL,
	[Description] [varchar](200) NULL,
	[Status_Master_Status] [varchar](50) DEFAULT 'Active',
    PRIMARY KEY CLUSTERED ([Status_ID] ASC),
    UNIQUE NONCLUSTERED ([Status_Code] ASC)
);
GO

-- 4️⃣ COMPLAINT TYPE MASTER (Added for FK reference)
CREATE TABLE [dbo].[Complaint_Type_Master](
    [Complaint_Type_ID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Complaint_Code] [varchar](20) NOT NULL,
    [Complaint_Name] [varchar](100) NOT NULL,
    [Priority_Level] [varchar](20),
    [SLA_Hours] [int],
    [Status_ID] [int],
    [Created_At] [datetime] DEFAULT getdate()
);
GO

-- 6️⃣ USER MASTER
CREATE TABLE [dbo].[User_Master](
	[User_ID] [int] IDENTITY(1,1) NOT NULL,
	[User_Code] [varchar](20) NOT NULL,
	[Full_Name] [varchar](100) NOT NULL,
	[Mobile] [varchar](15) NULL,
	[Email] [varchar](100) NULL,
	[Password_Hash] [varchar](255) NULL,
	[Role] [varchar](50) NULL,
	[RSM_ID] [int] NULL,
	[ASM_ID] [int] NULL,
	[Customer_Type_ID] [int] NULL,
	[Status_ID] [int] NULL,
	[Created_At] [datetime] DEFAULT (getdate()),
	[Last_Login] [datetime] NULL,
    PRIMARY KEY CLUSTERED ([User_ID] ASC),
    UNIQUE NONCLUSTERED ([User_Code] ASC)
);
GO

-- 9️⃣ TICKET MASTER
CREATE TABLE [dbo].[Ticket_Master](
	[Ticket_ID] [int] IDENTITY(1,1) NOT NULL,
	[Ticket_No] [varchar](20) NOT NULL,
	[Subject] [varchar](200) NOT NULL,
	[Description] [text] NULL,
	[Status] [varchar](20) DEFAULT 'Open',
	[Priority] [varchar](20) DEFAULT 'Medium',
	[Complaint_Type_ID] [int] NULL,
	[Customer_Name] [varchar](100) NULL,
	[Assigned_To] [int] NULL,
	[Created_By] [int] NULL,
	[Created_At] [datetime] DEFAULT (getdate()),
	[Updated_At] [datetime] NULL,
	[asm] [varchar](100) NULL,
	[rsm] [varchar](100) NULL,
	[customer_type] [varchar](100) NULL,
	[complaint_type] [varchar](100) NULL,
	[customer_number] [varchar](50) NULL,
	[customer_address] [varchar](255) NULL,
	[priority_level] [varchar](50) NULL,
	[sla_hours] [int] NULL,
	[customer_id] [int] NULL,
	[asm_name] [varchar](100) NULL,
	[rsm_name] [varchar](100) NULL,
	[customer_types] [varchar](100) NULL,
	[complaint_types] [varchar](100) NULL,
	[customer_numbers] [varchar](50) NULL,
	[customers_address] [varchar](255) NULL,
	[priority_levels] [varchar](50) NULL,
	[sla_hour] [int] NULL,
	[customer_ids] [int] NULL,
    PRIMARY KEY CLUSTERED ([Ticket_ID] ASC),
    UNIQUE NONCLUSTERED ([Ticket_No] ASC)
);
GO

-- Foreign Keys
ALTER TABLE [dbo].[Application_Log]  WITH CHECK ADD  CONSTRAINT [FK_AppLog_User] FOREIGN KEY([User_ID]) REFERENCES [dbo].[User_Master] ([User_ID]);
ALTER TABLE [dbo].[ASM_Master]  WITH CHECK ADD  CONSTRAINT [FK_ASM_RSM] FOREIGN KEY([RSM_ID]) REFERENCES [dbo].[RSM_Master] ([RSM_ID]);
ALTER TABLE [dbo].[customers_profile]  WITH CHECK ADD  CONSTRAINT [FK_customers_profile_Customer_Type_Master] FOREIGN KEY([Customer_Type_ID]) REFERENCES [dbo].[Customer_Type_Master] ([Customer_Type_ID]);
ALTER TABLE [dbo].[Login_Log]  WITH CHECK ADD  CONSTRAINT [FK_Login_User] FOREIGN KEY([User_ID]) REFERENCES [dbo].[User_Master] ([User_ID]);
ALTER TABLE [dbo].[Ticket_Master]  WITH CHECK ADD  CONSTRAINT [FK_Ticket_AssignedTo] FOREIGN KEY([Assigned_To]) REFERENCES [dbo].[User_Master] ([User_ID]);
ALTER TABLE [dbo].[Ticket_Master]  WITH CHECK ADD  CONSTRAINT [FK_Ticket_ComplaintType] FOREIGN KEY([Complaint_Type_ID]) REFERENCES [dbo].[Complaint_Type_Master] ([Complaint_Type_ID]);
ALTER TABLE [dbo].[Ticket_Master]  WITH CHECK ADD  CONSTRAINT [FK_Ticket_CreatedBy] FOREIGN KEY([Created_By]) REFERENCES [dbo].[User_Master] ([User_ID]);
ALTER TABLE [dbo].[User_Master]  WITH CHECK ADD  CONSTRAINT [FK_User_ASM] FOREIGN KEY([ASM_ID]) REFERENCES [dbo].[ASM_Master] ([ASM_ID]);
ALTER TABLE [dbo].[User_Master]  WITH CHECK ADD  CONSTRAINT [FK_User_CustomerType] FOREIGN KEY([Customer_Type_ID]) REFERENCES [dbo].[Customer_Type_Master] ([Customer_Type_ID]);
ALTER TABLE [dbo].[User_Master]  WITH CHECK ADD  CONSTRAINT [FK_User_RSM] FOREIGN KEY([RSM_ID]) REFERENCES [dbo].[RSM_Master] ([RSM_ID]);
GO

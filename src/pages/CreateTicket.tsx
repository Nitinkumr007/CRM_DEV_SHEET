import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateTicketForm } from '../components/CreateTicketForm';
import { useTickets } from '../context/TicketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
// import type { Ticket } from '../types/ticket'; // Import as type

export default function CreateTicket() {
    const navigate = useNavigate();
    const { addTicket } = useTickets();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdTicketNo, setCreatedTicketNo] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleCreateTicket = async (data: any) => {
        // Map form data to backend expected format
        const payload = {
            subject: data.title,
            description: data.description,
            priority: data.priority,
            customerName: data.customer.name,
            complaintTypeId: data.complaintTypeId,
            assignedTo: data.assignedTo,
            createdBy: 1, // Defaults to admin for now

            // New Schema Fields
            asm_name: data.asm_name,
            rsm_name: data.rsm_name,
            customer_type: data.customer_type,
            complaint_type: data.complaint_type,
            customer_number: data.customer_number,
            customer_address: data.customer_address,
            priority_level: data.priority_level,
            sla_hours: data.sla_hours,
            customer_id: data.customer_id || data.customer?.id || 0,
            customer: data.customer // Preserve the customer object too if needed by context
        };

        const result = await addTicket(payload);
        if (result && result.ticketNo) {
            setCreatedTicketNo(result.ticketNo);
            setShowSuccessModal(true);
        } else {
            // If result is null/false, showing error modal
            // We can enhance addTicket to return error message or just show generic
            setErrorMessage("Failed to create ticket. Please check your inputs or try again.");
            setShowErrorModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        navigate('/tickets');
    };

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
    };

    return (
        <div className="h-full bg-slate-50 relative">
            <CreateTicketForm
                onSubmit={handleCreateTicket}
                onCancel={() => navigate('/tickets')}
            />

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Ticket Created!</h3>
                                <p className="text-slate-500 mb-6">
                                    Your ticket has been successfully created with Ticket No:
                                    <span className="block text-xl font-mono font-bold text-indigo-600 mt-2">{createdTicketNo}</span>
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleCloseModal}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors w-full"
                                    >
                                        Go to Tickets
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Error Modal */}
            <AnimatePresence>
                {showErrorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Error!</h3>
                                <p className="text-slate-500 mb-6">
                                    {errorMessage}
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleCloseErrorModal}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors w-full"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

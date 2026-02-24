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
    const [submittedData, setSubmittedData] = useState<any>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleCreateTicket = async (data: any) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.User_ID || 1;

        // Map form data to gsheet query expected format (TicketContext.tsx @params)
        const payload = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            customer_id: data.customer_id || data.customer?.id || 0,
            complaintTypeId: data.complaintTypeId,
            asm_name: data.asm_name,
            rsm_name: data.rsm_name,

            // For whatsapp sharing/context
            customerName: data.customerName,
            customer_number: data.customer_number,
            asm_mobile: data.asm_mobile,
            rsm_mobile: data.rsm_mobile,
            subject: data.title,
            createdBy: userId
        };

        try {
            // We cast to any to bypass the strict Ticket interface mismatch (createdBy is User object in interface)
            const result = await addTicket(payload as any);

            // Result might have Ticket_No or ticketNo depending on normalization
            const ticketNo = result?.ticketNo || result?.Ticket_No;

            if (result && ticketNo) {
                setCreatedTicketNo(ticketNo);
                setSubmittedData(payload);
                setShowSuccessModal(true);
            } else {
                setErrorMessage("Failed to create ticket. The server didn't return a ticket number.");
                setShowErrorModal(true);
            }
        } catch (error: any) {
            console.error("Ticket creation failed:", error);
            setErrorMessage(error.message || "Failed to create ticket. Please check your inputs or try again.");
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

                                <div className="flex flex-col gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            const text = `Hi ${submittedData?.customerName || 'Customer'},\n\nYour ticket has been successfully created.\n\nTicket No: ${createdTicketNo}\nSubject: ${submittedData?.subject}\nPriority: ${submittedData?.priority}\n\nOur team will get back to you soon.\nThank you!`;
                                            const phone = submittedData?.customer_number || '';
                                            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors w-full flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                        Share with Customer
                                    </button>

                                    {(submittedData?.asm_name || submittedData?.rsm_name) && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2 space-y-3">
                                            {submittedData?.asm_name && submittedData?.asm_mobile && (
                                                <div className="flex items-center justify-between">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ASM: {submittedData.asm_name}</p>
                                                        <p className="text-xs text-slate-500">{submittedData.asm_mobile}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const text = `Hi ${submittedData?.asm_name},\n\nA new ticket has been created in your area.\n\nTicket No: ${createdTicketNo}\nCustomer: ${submittedData?.customerName}\nMobile: ${submittedData?.customer_number}\nSubject: ${submittedData?.subject}\nPriority: ${submittedData?.priority}\n\nPlease look into it.\nThank you!`;
                                                            const phone = submittedData?.asm_mobile || '';
                                                            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                                        Share to ASM
                                                    </button>
                                                </div>
                                            )}

                                            {submittedData?.rsm_name && submittedData?.rsm_mobile && (
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RSM: {submittedData.rsm_name}</p>
                                                        <p className="text-xs text-slate-500">{submittedData.rsm_mobile}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const text = `Hi ${submittedData?.rsm_name},\n\nA new ticket has been created.\n\nTicket No: ${createdTicketNo}\nASM: ${submittedData?.asm_name}\nCustomer: ${submittedData?.customerName}\nSubject: ${submittedData?.subject}\n\nThank you!`;
                                                            const phone = submittedData?.rsm_mobile || '';
                                                            const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
                                                            window.open(url, '_blank');
                                                        }}
                                                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.852.449-1.271.61-1.444.161-.173.351-.216.468-.216.117 0 .234 0 .334.004.106.004.249-.04.391.297.144.35.494 1.208.536 1.294.043.086.07.186.012.303-.058.116-.087.188-.173.289l-.26.303c-.087.101-.177.211-.077.382.1.171.445.733.955 1.187.656.584 1.209.765 1.381.85.171.085.271.07.371-.045.103-.116.438-.506.556-.68.117-.173.234-.144.39-.087.158.058 1.002.472 1.174.558.173.086.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.439 5.161L2 22l4.98-1.393C8.428 21.488 10.16 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.149-.49-4.421-1.332l-2.825.79.805-2.942C4.69 15.228 4 13.693 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" /></svg>
                                                        Share to RSM
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCloseModal}
                                        className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium transition-colors w-full mt-2"
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

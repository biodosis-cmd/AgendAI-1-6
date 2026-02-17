import React from 'react';
import { X, FileJson } from 'lucide-react';
import LicenseManager from '@/components/common/LicenseManager';

const ImportLicenseModal = ({ isOpen, onClose, userId, onSuccess }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f1221] rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <FileJson size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Gestionar Licencia</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <LicenseManager
                        userId={userId}
                        onImportSuccess={() => {
                            if (onSuccess) onSuccess();
                            onClose();
                        }}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default ImportLicenseModal;

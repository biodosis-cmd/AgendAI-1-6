import React from 'react';
import { useModal } from '@/context/ModalContext';

import EditClaseModal from '@/components/modals/EditClaseModal';
import AIGenerationModal from '@/components/modals/AIGenerationModal';
import ZenModeModal from '@/components/modals/ZenModeModal';
// import ScheduleEditorModal from '@/components/modals/ScheduleEditorModal'; // Moved to App.jsx
import ConfirmationModal from '@/components/common/ConfirmationModal';
import InfoModal from '@/components/common/InfoModal';
import UnitSelectionModal from '@/components/modals/UnitSelectionModal';

const ModalRoot = () => {
    const { activeModal, closeModal } = useModal();

    if (!activeModal) return null;

    const { type, props } = activeModal;

    // Common props for most modals
    const commonProps = {
        isOpen: true,
        onClose: closeModal,
        ...props
    };

    switch (type) {
        case 'editClase':
            return <EditClaseModal {...commonProps} />;
        case 'aiGeneration':
            return <AIGenerationModal {...commonProps} />;
        case 'zenMode':
            return <ZenModeModal {...commonProps} />;
        // ScheduleEditorModal is handled explicitly in App.jsx to inject isAdmin prop
        case 'confirmation':
            return <ConfirmationModal {...commonProps} />;
        case 'info':
            return <InfoModal {...commonProps} />;
        case 'unitSelection':
            return <UnitSelectionModal {...commonProps} />;
        default:
            return null;
    }
};

export default ModalRoot;

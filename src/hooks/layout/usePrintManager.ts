import { useState, useCallback } from 'react';
import { PrintSelection } from '../../types';

export const usePrintManager = (isLandscape: boolean) => {
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [pagesToPrint, setPagesToPrint] = useState<PrintSelection>({ p1: true, specs: false, p2: true, xp: false, inventaire: false, notes: false });

    const handlePrintConfirm = useCallback((selection: PrintSelection) => {
        setPagesToPrint(selection);
        setShowPrintModal(false);

        setTimeout(() => {
            const styleId = isLandscape ? 'print-landscape-style' : 'print-portrait-style';
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = isLandscape
                ? `@page { size: landscape; margin: 0; }`
                : `@page { size: A4 portrait; margin: 0; }`;

            document.head.appendChild(style);
            window.print();
            document.getElementById(styleId)?.remove();
        }, 500);
    }, [isLandscape]);

    return {
        showPrintModal, setShowPrintModal,
        pagesToPrint,
        handlePrintConfirm
    };
};

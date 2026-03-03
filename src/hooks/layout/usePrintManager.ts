import { useState, useCallback } from 'react';

export const usePrintManager = (isLandscape: boolean) => {
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [pagesToPrint, setPagesToPrint] = useState({ p1: true, specs: false, p2: true, xp: false, inventaire: false, notes: false });

    const handlePrintConfirm = useCallback((selection: { p1: boolean, specs: boolean, p2: boolean, xp: boolean, inventaire: boolean, notes: boolean }) => {
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

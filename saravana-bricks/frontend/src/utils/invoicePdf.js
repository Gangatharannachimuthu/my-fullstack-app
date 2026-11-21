import { useState } from 'react';

/** "Download PDF" for an A4 invoice sheet. Multi-page sheets break between table rows. */
export function useInvoicePdf(sheet, { multiPage = false } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const download = async (filename) => {
    setBusy(true);
    setError(null);
    sheet.current.classList.add('pdf-export');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: multiPage ? [10, 0, 10, 0] : 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: multiPage ? { mode: ['css', 'legacy'], avoid: ['tr', '.inv-bottom', '.inv-foot'] } : { mode: ['avoid-all'] },
        })
        .from(sheet.current)
        .save();
    } catch {
      setError('Could not create the PDF. You can use Print and choose "Save as PDF" instead.');
    } finally {
      sheet.current?.classList.remove('pdf-export');
      setBusy(false);
    }
  };

  return { busy, error, download };
}

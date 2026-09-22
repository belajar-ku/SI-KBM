import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads an HTML element as a clean, high-resolution multi-page PDF (A4 format).
 * Isolates only the target content without any browser or website chrome.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    title?: string;
    onProgress?: (progress: string) => void;
  }
): Promise<void> {
  const orientation = options?.orientation || 'portrait';
  const pdfWidth = orientation === 'portrait' ? 210 : 297; // mm
  const pdfHeight = orientation === 'portrait' ? 297 : 210; // mm

  options?.onProgress?.('Menyiapkan dokumen PDF...');

  // Clone element to an off-screen container with fixed width to ensure optimal print rendering
  const clone = element.cloneNode(true) as HTMLElement;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = orientation === 'portrait' ? '1000px' : '1400px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.padding = '20px';
  container.style.fontFamily = "'Times New Roman', Times, serif";
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    options?.onProgress?.('Mengonversi tampilan dokumen...');
    
    // Ensure all images in the clone are loaded
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const canvas = await html2canvas(clone, {
      scale: 2, // high DPI
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'portrait' ? 1000 : 1400,
    });

    options?.onProgress?.('Menyusun halaman PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const margin = 10; // 10mm margin
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;
    const pageContentHeight = pdfHeight - margin * 2;

    let heightLeft = contentHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, margin + position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= pageContentHeight;

    // Subsequent pages
    while (heightLeft > 0) {
      position = heightLeft - contentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, margin + position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= pageContentHeight;
    }

    options?.onProgress?.('Menyimpan berkas...');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Prints ONLY the content of an HTML element via an isolated print iframe,
 * completely stripping away all website navigation, sidebar, background, and URL headers.
 */
export function printCleanDocument(
  element: HTMLElement,
  documentTitle: string = 'Dokumen Laporan'
): void {
  // Remove existing print iframe if any
  const existingFrame = document.getElementById('si_kbm_clean_print_frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'si_kbm_clean_print_frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback
    window.print();
    return;
  }

  // Build clean HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          *, *:before, *:after {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px 6px;
            vertical-align: top;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold;
            text-align: center;
          }
          .kop-surat {
            border-bottom: 2.5px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .kop-surat img {
            height: 70px;
            width: auto;
          }
          .kop-text h1 {
            font-size: 14pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kop-text h2 {
            font-size: 12pt;
            font-weight: bold;
            margin: 3px 0 0 0;
          }
          .kop-text p {
            font-size: 10pt;
            margin: 3px 0 0 0;
            color: #333;
          }
          .signature-section {
            page-break-inside: avoid;
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            min-width: 200px;
          }
          .signature-box .signature-space {
            height: 60px;
          }
          .signature-box .name {
            font-weight: bold;
            text-decoration: underline;
          }
          .signature-box .nip {
            font-size: 10pt;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .nihil { font-style: italic; color: #555; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for all images in iframe to load
  const iframeImages = Array.from(doc.images);
  const triggerPrint = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up iframe after print dialog closes
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 250);
  };

  if (iframeImages.length === 0) {
    triggerPrint();
  } else {
    let loaded = 0;
    iframeImages.forEach(img => {
      if (img.complete) {
        loaded++;
        if (loaded === iframeImages.length) triggerPrint();
      } else {
        img.onload = () => {
          loaded++;
          if (loaded === iframeImages.length) triggerPrint();
        };
        img.onerror = () => {
          loaded++;
          if (loaded === iframeImages.length) triggerPrint();
        };
      }
    });
  }
}

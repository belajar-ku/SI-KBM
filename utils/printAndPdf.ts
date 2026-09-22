import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a multi-page table document (such as Laporan Jurnal or Rekap Kehadiran) as a clean A4 PDF.
 * - Rows that do not fit on the current page are neatly pushed to the next page without slicing text.
 * - Every subsequent page automatically includes the column headers (<thead>).
 * - The document signature section is kept intact.
 */
export async function downloadPaginatedTablePdf(
  element: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    title?: string;
    onProgress?: (progress: string) => void;
  }
): Promise<void> {
  const orientation = options?.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';

  // Standard A4 dimensions at 96 DPI: Portrait 794x1123, Landscape 1123x794
  const pageWidth = isLandscape ? 1123 : 794;
  const pageHeight = isLandscape ? 794 : 1123;
  // Maximum usable height for contentArea inside one A4 sheet
  const maxContentHeight = pageHeight - (isLandscape ? 85 : 95);

  options?.onProgress?.('Menganalisis konten dokumen...');

  // Identify document sections
  const headerNode = element.querySelector('[data-doc-header]') || element.firstElementChild;
  const tableNode = element.querySelector('table');
  const footerNode = element.querySelector('[data-doc-footer]') || element.lastElementChild;

  // Fallback to standard download if no table found
  if (!tableNode) {
    return downloadElementAsPdf(element, filename, options);
  }

  const theadNode = tableNode.querySelector('thead');
  const rowNodes = Array.from(tableNode.querySelectorAll('tbody tr')).filter(
    r => !r.classList.contains('print:hidden')
  );

  // Create isolated scratchpad container off-screen
  const scratchpad = document.createElement('div');
  scratchpad.id = 'si_kbm_pdf_scratchpad';
  scratchpad.style.position = 'fixed';
  scratchpad.style.left = '-99999px';
  scratchpad.style.top = '0';
  scratchpad.style.width = `${pageWidth}px`;
  scratchpad.style.backgroundColor = '#ffffff';
  scratchpad.style.color = '#000000';
  scratchpad.style.fontFamily = "'Times New Roman', Times, serif";
  document.body.appendChild(scratchpad);

  try {
    options?.onProgress?.('Menyusun halaman dokumen...');

    const pages: HTMLElement[] = [];

    // Helper to generate a single clean A4 page
    const createNewPage = (isFirstPage: boolean): { page: HTMLElement; tbody: HTMLElement; contentArea: HTMLElement } => {
      const page = document.createElement('div');
      page.className = 'pdf-page-sheet';
      page.style.width = `${pageWidth}px`;
      // DO NOT set fixed height during row calculation so contentArea.offsetHeight measures true content!
      page.style.boxSizing = 'border-box';
      page.style.padding = isLandscape ? '32px 40px 25px 40px' : '38px 38px 25px 38px';
      page.style.backgroundColor = '#ffffff';
      page.style.color = '#000000';
      page.style.position = 'relative';
      page.style.fontFamily = "'Times New Roman', Times, serif";

      const contentArea = document.createElement('div');
      contentArea.className = 'pdf-page-content';
      page.appendChild(contentArea);

      // Page 1 gets the official Kop Surat & Identity Block
      if (isFirstPage && headerNode) {
        contentArea.appendChild(headerNode.cloneNode(true));
      }

      // Every page gets a table with the identical column header (<thead>)
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontSize = '11px';
      table.style.color = '#000000';
      table.style.marginTop = isFirstPage ? '4px' : '0px';

      if (theadNode) {
        table.appendChild(theadNode.cloneNode(true));
      }

      const tbody = document.createElement('tbody');
      table.appendChild(tbody);
      contentArea.appendChild(table);

      // Page numbering footer placeholder
      const footerNum = document.createElement('div');
      footerNum.className = 'pdf-page-number';
      footerNum.style.position = 'absolute';
      footerNum.style.bottom = '10px';
      footerNum.style.right = isLandscape ? '40px' : '38px';
      footerNum.style.fontSize = '10px';
      footerNum.style.color = '#555555';
      page.appendChild(footerNum);

      scratchpad.appendChild(page);
      pages.push(page);

      return { page, tbody, contentArea };
    };

    // 1. Start with Page 1
    let current = createNewPage(true);

    // 2. Distribute rows sequentially. 
    // Fill as many rows as possible. ONLY when a row does not fit on the current page,
    // push that overflow row to the next page!
    for (let i = 0; i < rowNodes.length; i++) {
      const rowClone = rowNodes[i].cloneNode(true) as HTMLElement;
      // Strip any interactive elements marked print:hidden
      rowClone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
      
      current.tbody.appendChild(rowClone);

      // Check if contentArea exceeds max usable height on this page
      if (current.contentArea.offsetHeight > maxContentHeight && current.tbody.children.length > 1) {
        // This row does not fit on the current page, move it to the beginning of next page
        current.tbody.removeChild(rowClone);

        // Start next page with table headers intact
        current = createNewPage(false);

        // Insert row into new page
        current.tbody.appendChild(rowClone);
      }
    }

    // 3. Attach official signature / footer section
    if (footerNode) {
      const footerClone = footerNode.cloneNode(true) as HTMLElement;
      current.contentArea.appendChild(footerClone);

      // If signature block overflows current page, move it to a clean next page
      if (current.contentArea.offsetHeight > maxContentHeight && current.tbody.children.length > 0) {
        current.contentArea.removeChild(footerClone);
        current = createNewPage(false);
        current.contentArea.appendChild(footerClone);
      }
    }

    // 4. Lock each page height to exactly pageHeight for accurate PDF canvas capture
    pages.forEach(p => {
      p.style.height = `${pageHeight}px`;
      p.style.minHeight = `${pageHeight}px`;
      p.style.maxHeight = `${pageHeight}px`;
      p.style.overflow = 'hidden';
    });

    // 5. Update page numbers (Halaman X dari Y)
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      const numEl = p.querySelector('.pdf-page-number');
      if (numEl) {
        numEl.textContent = `Halaman ${idx + 1} dari ${totalPages}`;
      }
    });

    // 5. Render pages to jsPDF using high-DPI canvas
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfW = isLandscape ? 297 : 210;
    const pdfH = isLandscape ? 210 : 297;

    for (let i = 0; i < pages.length; i++) {
      options?.onProgress?.(`Memproses halaman ${i + 1} dari ${totalPages}...`);

      // Ensure all images are loaded
      const imgs = Array.from(pages[i].querySelectorAll('img'));
      await Promise.all(
        imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      const canvas = await html2canvas(pages[i], {
        scale: 2, // 192 DPI high resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: pageWidth,
        height: pageHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) {
        pdf.addPage('a4', orientation);
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }

    options?.onProgress?.('Menyimpan file PDF...');
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalFilename);

  } finally {
    if (scratchpad && scratchpad.parentNode) {
      scratchpad.parentNode.removeChild(scratchpad);
    }
  }
}

/**
 * Downloads any general HTML element as a PDF file.
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
  // If element has a table with many rows, route directly to paginated handler
  const table = element.querySelector('table');
  if (table && table.querySelectorAll('tbody tr').length > 5) {
    return downloadPaginatedTablePdf(element, filename, options);
  }

  const orientation = options?.orientation || 'portrait';
  const pdfWidth = orientation === 'portrait' ? 210 : 297;
  const pdfHeight = orientation === 'portrait' ? 297 : 210;

  options?.onProgress?.('Menyiapkan dokumen PDF...');

  const clone = element.cloneNode(true) as HTMLElement;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = orientation === 'portrait' ? '794px' : '1123px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.padding = '35px 30px';
  container.style.fontFamily = "'Times New Roman', Times, serif";
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    options?.onProgress?.('Mengonversi tampilan dokumen...');

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
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    options?.onProgress?.('Menyusun berkas PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const margin = 10;
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
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Prints ONLY the content of an HTML element via an isolated print iframe,
 * completely stripping away all website navigation, sidebar, background, and URL headers.
 * Matches 100% with the download PDF appearance.
 */
export function printCleanDocument(
  element: HTMLElement,
  documentTitle: string = 'Laporan Jurnal Guru'
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
    window.print();
    return;
  }

  // Self-contained document style ensuring 100% visual parity with PDF download
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${documentTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm 10mm;
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
            font-size: 11px;
            color: #000;
          }
          thead {
            display: table-header-group !important; /* Standar W3C: Mengulang judul kolom di setiap halaman baru */
          }
          tbody {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important; /* Baris tidak terpotong di tengah */
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
            border-bottom: 2px solid #000;
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
            font-size: 9.5pt;
            margin: 3px 0 0 0;
            color: #333;
          }
          .identity-box {
            margin-bottom: 12px;
            font-size: 11px;
            border: 1px solid #777;
            padding: 8px 12px;
            background-color: #fbfbfb !important;
          }
          .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 240px;
          }
          .signature-box .signature-space {
            height: 60px;
          }
          .signature-box .name {
            font-weight: bold;
            text-decoration: underline;
            font-size: 12px;
          }
          .signature-box .nip {
            font-size: 10px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
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

  // Wait for images to load before triggering print dialog
  const iframeImages = Array.from(doc.images);
  const triggerPrint = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 3000);
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

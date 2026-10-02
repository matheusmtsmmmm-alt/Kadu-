import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaintenanceReport, CompanySettings, ReportPhoto } from '../types';
import { DEFAULT_LOGO_BASE64 } from '../data/defaultLogo';

// Helper to convert any image URL or file to base64 Data URL for jsPDF
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Constrain max dimension to 1200px to maintain high clarity without bloating PDF
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Canvas conversion error for image:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load image for PDF:', imageUrl);
      resolve(null);
    };
    img.src = imageUrl;
  });
}

export async function generateReportPdf(report: MaintenanceReport, settings: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Colors
  const primaryNavy = [15, 23, 42]; // #0f172a
  const secondaryBlue = [30, 58, 138]; // #1e3a8a
  const slateGray = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc
  const borderColor = [226, 232, 240]; // #e2e8f0

  // Pre-fetch images
  let logoBase64: string | null = null;
  if (settings.logoUrl) {
    logoBase64 = await getBase64ImageFromUrl(settings.logoUrl);
  }
  if (!logoBase64) {
    logoBase64 = DEFAULT_LOGO_BASE64;
  }
  const techSigBase64 = report.signatures.technician.signatureImage
    ? await getBase64ImageFromUrl(report.signatures.technician.signatureImage)
    : null;
  const clientSigBase64 = report.signatures.clientResponsible.signatureImage
    ? await getBase64ImageFromUrl(report.signatures.clientResponsible.signatureImage)
    : null;

  // Pre-load photos
  const loadedBeforePhotos: Array<{ photo: ReportPhoto; base64: string | null }> = [];
  for (const photo of report.photosBefore || []) {
    const base64 = await getBase64ImageFromUrl(photo.url);
    if (base64) loadedBeforePhotos.push({ photo, base64 });
  }

  const loadedAfterPhotos: Array<{ photo: ReportPhoto; base64: string | null }> = [];
  for (const photo of report.photosAfter || []) {
    const base64 = await getBase64ImageFromUrl(photo.url);
    if (base64) loadedAfterPhotos.push({ photo, base64 });
  }

  // Helper function to check page overflow and add new page if needed
  function checkAddPage(requiredHeight: number) {
    if (currentY + requiredHeight > pageHeight - 18) {
      doc.addPage();
      currentY = margin;
      drawPageHeaderMini();
    }
  }

  function drawPageHeaderMini() {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('KADU MANUTENÇÕES', margin + 4, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    const cleanCodeMini = (report.code || '').replace(/^#/, '');
    doc.text(`Relatório ${cleanCodeMini} - ${report.machine.name}`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
    currentY += 12;
  }

  // --- 1. TOP HEADER ---
  const headerHeight = 35;
  // Header container background
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, currentY, contentWidth, headerHeight, 2, 2, 'F');

  // Logo (Left)
  if (logoBase64) {
    try {
      const format = logoBase64.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoBase64, format, margin + 4, currentY + 4.5, 26, 26);
    } catch {
      try {
        doc.addImage(DEFAULT_LOGO_BASE64, 'JPEG', margin + 4, currentY + 4.5, 26, 26);
      } catch {
        // Fallback text
      }
    }
  }

  // Report Badge Right (Dedicated space, no overlapping text)
  const badgeWidth = 42;
  const badgeHeight = 25;
  const badgeX = pageWidth - margin - badgeWidth - 4;
  const badgeY = currentY + 5;
  const badgeCenterX = badgeX + badgeWidth / 2;

  doc.setFillColor(2, 132, 199); // Sky blue accent
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RELATÓRIO TÉCNICO', badgeCenterX, badgeY + 6.5, { align: 'center' });

  // Code without '#' (e.g. '4732' instead of '#4732')
  const cleanCode = (report.code || '0000').replace(/^#/, '');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanCode, badgeCenterX, badgeY + 14, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${report.date || new Date().toLocaleDateString('pt-BR')}`, badgeCenterX, badgeY + 20.5, { align: 'center' });

  // Company Name & Info (Center-Left) - text width strictly constrained so it never goes under the badge
  const textLeft = logoBase64 ? margin + 34 : margin + 6;
  const maxCompanyTextWidth = badgeX - textLeft - 4; // Clear margin before the blue badge

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const compName = settings.companyName || 'KADU MANUTENÇÕES';
  doc.text(compName, textLeft, currentY + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const tradeLines = doc.splitTextToSize(settings.tradeName || 'Kadu Manutenções Industriais & Equipamentos', maxCompanyTextWidth);
  doc.text(tradeLines[0] || '', textLeft, currentY + 16.5);

  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240); // slate-200
  // Cleanly separate CNPJ/Phone from Email so they never touch or go under the badge
  doc.text(`CNPJ: ${settings.cnpj}   |   Tel: ${settings.phone}`, textLeft, currentY + 22.5);
  doc.text(`${settings.email}`, textLeft, currentY + 28);

  currentY += headerHeight + 4;

  // --- 2. DADOS PRINCIPAIS: CLIENTE & MÁQUINA (2 COLUNAS) ---
  const boxWidth = (contentWidth - 4) / 2;
  const boxHeight = 44;

  // Cliente Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
  doc.rect(margin, currentY, boxWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. DADOS DO CLIENTE', margin + 4, currentY + 5);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  let cy = currentY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Razão Social: ', margin + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(report.client.name || 'Não informado', boxWidth - 30), margin + 26, cy);
  cy += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('CNPJ/CPF: ', margin + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(report.client.document || '---', margin + 22, cy);
  cy += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Contato/Resp.: ', margin + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(report.client.contactPerson || report.client.phone || '---', margin + 27, cy);
  cy += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Endereço/Planta: ', margin + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(report.client.address || '---', boxWidth - 32), margin + 30, cy);

  // Máquina Box
  const machX = margin + boxWidth + 4;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(machX, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
  doc.rect(machX, currentY, boxWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. DADOS DO EQUIPAMENTO / MÁQUINA', machX + 4, currentY + 5);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  cy = currentY + 12;

  doc.setFont('helvetica', 'bold');
  doc.text('Máquina: ', machX + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(report.machine.name || 'Não informado', machX + 22, cy);
  cy += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Modelo / TAG: ', machX + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.machine.model || '---'} | TAG: ${report.machine.tag || '---'}`, machX + 28, cy);
  cy += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Tonelagem / Pav.: ', machX + 4, cy);
  doc.setFont('helvetica', 'normal');
  const tonText = report.machine.tonnage ? `${report.machine.tonnage}` : '---';
  const pavText = report.machine.pavilhao ? ` | ${report.machine.pavilhao}` : '';
  doc.text(`${tonText}${pavText} | Fabricante: ${report.machine.manufacturer || '---'}`, machX + 32, cy);
  cy += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Nº Série / Horím.: ', machX + 4, cy);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.machine.serialNumber || '---'} | Horímetro: ${report.machine.horometer || '---'}`, machX + 32, cy);

  currentY += boxHeight + 4;

  // --- 3. EQUIPE TÉCNICA E HORÁRIOS ---
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setTextColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EQUIPE & HORÁRIOS:', margin + 4, currentY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Técnico Resp.:', margin + 4, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(report.technician.name || 'Carlos Eduardo (Kadu)', margin + 28, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Auxiliares:', margin + 76, currentY + 13);
  doc.setFont('helvetica', 'normal');
  const auxText = report.assistants && report.assistants.length > 0 ? report.assistants.join(', ') : 'Nenhum';
  doc.text(auxText, margin + 95, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Horário:', margin + 140, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${report.times.startTime || '--:--'} às ${report.times.endTime || '--:--'}`, margin + 155, currentY + 13);

  currentY += 22;

  // --- 4. TIPO DE MANUTENÇÃO & STATUS DO EQUIPAMENTO ---
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TIPO DE INTERVENÇÃO: ', margin + 4, currentY + 9);
  doc.setTextColor(2, 132, 199);
  doc.text((report.maintenanceType || 'Preventiva').toUpperCase(), margin + 45, currentY + 9);

  doc.setTextColor(15, 23, 42);
  doc.text('STATUS DO EQUIPAMENTO: ', margin + 95, currentY + 9);
  const statusColor = report.equipmentStatus === 'Operacional' ? [22, 163, 74] : report.equipmentStatus === 'Parcial' ? [217, 119, 6] : [220, 38, 38];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text((report.equipmentStatus || 'Operacional').toUpperCase(), margin + 148, currentY + 9);

  currentY += 18;

  // --- 5. DESCRIÇÃO DA MANUTENÇÃO ---
  doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. DESCRIÇÃO DETALHADA DOS SERVIÇOS EXECUTADOS', margin + 4, currentY + 4.8);
  currentY += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  const descLines = doc.splitTextToSize(report.description || 'Nenhum detalhe informado.', contentWidth - 8);
  const descHeight = Math.max(16, descLines.length * 4.8 + 6);
  doc.rect(margin, currentY, contentWidth, descHeight, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(descLines, margin + 4, currentY + 5.5);
  currentY += descHeight + 4;

  // Peças substituídas
  if (report.partsReplaced && report.partsReplaced.trim()) {
    checkAddPage(20);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    const partsLines = doc.splitTextToSize(`Peças / Materiais Aplicados: ${report.partsReplaced}`, contentWidth - 8);
    const pHeight = partsLines.length * 4.5 + 5;
    doc.rect(margin, currentY, contentWidth, pHeight, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(partsLines, margin + 4, currentY + 4.5);
    currentY += pHeight + 4;
  }

  // --- 6. CHECKLIST DE INSPEÇÃO (AUTOTABLE) ---
  if (report.checklist && report.checklist.length > 0) {
    checkAddPage(35);
    doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('4. CHECKLIST DE CONFORMIDADE TÉCNICA', margin + 4, currentY + 4.8);
    currentY += 7;

    const checklistRows = report.checklist.map((item, idx) => [
      String(idx + 1).padStart(2, '0'),
      item.label,
      item.status === 'conforme'
        ? '[ CONFORME ]'
        : item.status === 'nao_conforme'
        ? '[ NÃO CONFORME ]'
        : '[ NÃO SE APLICA ]',
      item.notes || '---',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['#', 'Item Inspecionado', 'Situação', 'Observações / Ações']],
      body: checklistRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 85 },
        2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 52 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === '[ CONFORME ]') {
            data.cell.styles.textColor = [22, 163, 74];
          } else if (data.cell.raw === '[ NÃO CONFORME ]') {
            data.cell.styles.textColor = [220, 38, 38];
          } else {
            data.cell.styles.textColor = [100, 116, 139];
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- 7. OBSERVACÕES TÉCNICAS ---
  if (report.observations && report.observations.trim()) {
    checkAddPage(28);
    doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('5. OBSERVAÇÕES TÉCNICAS', margin + 4, currentY + 4.8);
    currentY += 6.5;

    const obsLines = doc.splitTextToSize(report.observations, contentWidth - 8);
    const obsHeight = Math.max(14, obsLines.length * 4.5 + 6);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(margin, currentY, contentWidth, obsHeight, 'FD');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(obsLines, margin + 4, currentY + 5.5);
    currentY += obsHeight + 4;
  }

  // --- 8. FOTOS NO PDF (FOTOS ANTES & FOTOS DEPOIS) ---
  // "ESTA É UMA FUNÇÃO OBRIGATÓRIA.
  // Ao gerar o relatório PDF, as fotos devem aparecer dentro do próprio PDF.
  // Organizar automaticamente as imagens para não deixar o relatório desorganizado:
  // FOTOS ANTES DA MANUTENÇÃO (2x2 grid)
  // FOTOS DEPOIS DA MANUTENÇÃO (2x2 grid)"

  async function renderPhotoSection(title: string, photos: Array<{ photo: ReportPhoto; base64: string | null }>) {
    if (!photos || photos.length === 0) return;

    // Check if we need a fresh page for the photos section
    checkAddPage(60);

    doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, margin + 4, currentY + 4.8);
    currentY += 8;

    // 2 columns grid
    const photoWidth = (contentWidth - 6) / 2; // ~88mm
    const photoHeight = 56; // nice 4:3 or standard proportion
    const rowHeight = photoHeight + 12; // with caption space

    for (let i = 0; i < photos.length; i += 2) {
      checkAddPage(rowHeight);

      // Photo 1 (Left)
      const p1 = photos[i];
      const x1 = margin;
      drawPhotoItem(p1, x1, currentY, photoWidth, photoHeight, i + 1);

      // Photo 2 (Right, if exists)
      if (i + 1 < photos.length) {
        const p2 = photos[i + 1];
        const x2 = margin + photoWidth + 6;
        drawPhotoItem(p2, x2, currentY, photoWidth, photoHeight, i + 2);
      }

      currentY += rowHeight;
    }

    currentY += 4;
  }

  function drawPhotoItem(
    item: { photo: ReportPhoto; base64: string | null },
    x: number,
    y: number,
    w: number,
    h: number,
    number: number
  ) {
    // Frame background
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(x, y, w, h + 10, 1.5, 1.5, 'FD');

    if (item.base64) {
      try {
        doc.addImage(item.base64, 'JPEG', x + 1.5, y + 1.5, w - 3, h - 3, undefined, 'FAST');
      } catch (e) {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text('Imagem indisponível', x + w / 2, y + h / 2, { align: 'center' });
      }
    }

    // Number tag badge
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.roundedRect(x + 3, y + 3, 14, 5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`#${number}`, x + 10, y + 6.5, { align: 'center' });

    // Caption
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const caption = item.photo.caption || `Registro fotográfico #${number}`;
    const cleanCap = doc.splitTextToSize(caption, w - 4);
    doc.text(cleanCap[0] || '', x + 2, y + h + 4.5);
    if (item.photo.timestamp) {
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(item.photo.timestamp, x + w - 2, y + h + 4.5, { align: 'right' });
    }
  }

  // Render before & after photos
  await renderPhotoSection('6. REGISTRO FOTOGRÁFICO — ANTES DA MANUTENÇÃO', loadedBeforePhotos);
  await renderPhotoSection('7. REGISTRO FOTOGRÁFICO — DEPOIS DA MANUTENÇÃO', loadedAfterPhotos);

  // --- 9. ASSINATURA DO TÉCNICO RESPONSÁVEL ---
  checkAddPage(48);

  doc.setFillColor(secondaryBlue[0], secondaryBlue[1], secondaryBlue[2]);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('8. TERMO DE CONFORMIDADE E ASSINATURA DO TÉCNICO', margin + 4, currentY + 4.8);
  currentY += 8;

  const sigBoxW = 120;
  const sigBoxH = 34;
  const sigBoxX = margin + (contentWidth - sigBoxW) / 2;

  // Box Técnico (Centralizado)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(sigBoxX, currentY, sigBoxW, sigBoxH, 1.5, 1.5, 'FD');

  if (techSigBase64) {
    try {
      doc.addImage(techSigBase64, 'PNG', sigBoxX + (sigBoxW - 46) / 2, currentY + 3, 46, 16);
    } catch {
      // ignore
    }
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(sigBoxX + 12, currentY + 22, sigBoxX + sigBoxW - 12, currentY + 22);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(report.signatures?.technician?.name || report.technician?.name || 'Carlos Eduardo (Kadu)', sigBoxX + sigBoxW / 2, currentY + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Técnico Responsável  •  ${report.signatures?.technician?.date || report.date}`, sigBoxX + sigBoxW / 2, currentY + 30, { align: 'center' });

  currentY += sigBoxH + 6;

  // --- FOOTER FOR ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
    doc.text('KADU MANUTENÇÕES  |  Sistema de Gestão Técnica e Relatórios de Campo', margin, pageHeight - 6);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

export async function downloadReportPdf(report: MaintenanceReport, settings: CompanySettings) {
  const doc = await generateReportPdf(report, settings);
  const cleanCode = (report.code || '0000').replace(/[^a-zA-Z0-9]/g, '');
  const cleanMach = (report.machine.tag || report.machine.name || 'equipamento').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Relatorio_Manutencao_${cleanCode}_${cleanMach}.pdf`;
  doc.save(filename);
}

export async function getReportPdfBlob(report: MaintenanceReport, settings: CompanySettings): Promise<Blob> {
  const doc = await generateReportPdf(report, settings);
  return doc.output('blob');
}

export async function shareReportPdf(report: MaintenanceReport, settings: CompanySettings) {
  const cleanCode = (report.code || '0000').replace(/[^a-zA-Z0-9]/g, '');
  const cleanMach = (report.machine.tag || report.machine.name || 'equipamento').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Relatorio_Manutencao_${cleanCode}_${cleanMach}.pdf`;

  try {
    const blob = await getReportPdfBlob(report, settings);
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Relatório de Manutenção ${report.code} - ${report.machine.name}`,
        text: `Segue o relatório de manutenção da máquina ${report.machine.name}, realizado em ${report.date}.`,
        files: [file]
      });
      return true;
    }
  } catch (err) {
    console.warn('Web Share with file not supported or cancelled:', err);
  }

  // Fallback to standard share or download
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Relatório de Manutenção ${report.code} - ${report.machine.name}`,
        text: `Segue o relatório de manutenção da máquina ${report.machine.name}, realizado em ${report.date}.`,
        url: window.location.href
      });
      return true;
    } catch {
      // ignore
    }
  }

  // If sharing is not supported, download automatically
  await downloadReportPdf(report, settings);
  return false;
}

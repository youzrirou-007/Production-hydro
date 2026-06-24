import React from 'react';
import ExcelJS from 'exceljs';
import { FileSpreadsheet } from 'lucide-react';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

interface ExcelMinage {
  chantierId: string;
  chiefMatricule: string;
  chiefName: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  gallerySize: 9 | 12;
  plannedHoles: number;
  realHoles: number;
  plannedRounds: number;
  realRounds: number;
  barType?: '1.8m' | '2.4m';
  meterage: number;
  anfo: number;
  tovex: number;
  ammorces: number;
  remarks: string;
  sectorGroup?: string;
}

interface ExcelDeblayage {
  chantierId: string;
  driverMatricule: string;
  driverName: string;
  engineId: string;
  engineCode: string;
  godets: number;
  volumeEstimated: number;
  hoursWorked: number;
  remarks: string;
  sectorGroup?: string;
}

interface ExcelExtraction {
  chantierName: string;
  treuilliste: string;
  equipier1: string;
  equipier2: string;
  equipier3: string;
  equipier4: string;
  wagonsTarget: number;
  wagonsActual: number;
  sterileBureImiterEst: number;
  startTime: string;
  endTime: string;
  remarks: string;
}

interface ExcelMaintenance {
  roleLabel: string;
  agentMatricule: string;
  agentName: string;
  engineId: string;
  engineCode: string;
  hoursSpent: number;
  workDescription: string;
}

interface ExcelExportButtonProps {
  selectedDate: string;
  minageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]>;
  deblayageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]>;
  extractionRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]>;
  maintenanceRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]>;
  sectorChiefs: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>;
  chantiers: any[];
  employees: any[];
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  selectedDate,
  minageRowsByPost,
  deblayageRowsByPost,
  extractionRowsByPost,
  maintenanceRowsByPost,
  sectorChiefs,
  chantiers,
  employees
}) => {

  const getChantierName = (id: string) => {
    if (id && id.startsWith('stock_')) {
      return id.replace('stock_', 'STOCK : ');
    }
    const ch = chantiers.find(c => c.id === id);
    return ch ? ch.name : id || 'N/A';
  };

  const getEmployeeName = (matricule: string) => {
    if (!matricule) return '';
    const emp = employees.find(e => e.matricule?.toUpperCase() === matricule.toUpperCase());
    return emp ? `${emp.nom} ${emp.prenom}` : matricule;
  };

  const resolveAndParseChantierExcel = (id: string, defaultName?: string) => {
    const name = defaultName || getChantierName(id);
    const trimmed = (name || '').trim();
    if (trimmed && /^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    if (trimmed && /^\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    return name || '';
  };

  const createCorpHeader = (
    sheet: ExcelJS.Worksheet, 
    title: string, 
    themeColor: string, 
    maxColLetter: string, 
    imageId?: number | null
  ) => {
    // Add row 1 with empty cells so we can merge manually
    const logoRow = sheet.addRow(['', '', '', '', '', '', '', '', '']);
    logoRow.height = 60; // Expanded height for row 1
    
    if (imageId !== undefined && imageId !== null) {
      sheet.addImage(imageId, {
        tl: { col: 0.1, row: logoRow.number - 1 + 0.1 },
        ext: { width: 140, height: 60 } // Better visibility
      });
    } else {
      // Direct text fallback for logo
      logoRow.getCell('A').value = '🏗️ HYDROMINES';
      sheet.mergeCells(`A${logoRow.number}:C${logoRow.number}`);
      const logoCell = logoRow.getCell('A');
      logoCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '00BFFF' } };
      logoCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    const titleCell = logoRow.getCell('D');
    
    // Parse date components
    const [year, month, day] = selectedDate.split('-');
    const dateStr = (year && month && day) ? `${day} - ${month} - ${year}` : selectedDate;

    titleCell.value = {
      richText: [
        {
          text: 'PLANIFICATION - ',
          font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'B8860B' } } // GOLD
        },
        {
          text: `${dateStr} - `,
          font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: '0F172A' } } // DARK SLATE
        },
        {
          text: 'HYDRO',
          font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: '00BFFF' } } // BLEU CIEL (Sky Blue)
        },
        {
          text: 'MINES',
          font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: '9E1A1A' } } // ROUGE FONCE (Dark Red)
        }
      ]
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const sepRow = sheet.addRow([]);
    sepRow.height = 4;
    sheet.mergeCells(`A${sepRow.number}:${maxColLetter}${sepRow.number}`);
    const sepCell = sepRow.getCell('A');
    sepCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'B8860B' } // Premium brand Gold
    };

    const titleRow = sheet.addRow([title]);
    titleRow.height = 24;
    sheet.mergeCells(`A${titleRow.number}:${maxColLetter}${titleRow.number}`);
    const sectionTitleCell = titleRow.getCell('A');
    sectionTitleCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    sectionTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: themeColor } // Colored according to the sheet type
    };
    sectionTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]); // Blank spacer line
  };

  const exportToExcel = async () => {
    try {
      // 1. Check if the entire daily planning sheet is empty across all posts and activities
      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

      const hasMinageEntries = posts.some(post =>
        minageRowsByPost[post]?.some(r => r.chantierId?.trim() || r.minerMatricule?.trim() || r.assistantMatricule?.trim())
      );
      const hasDeblayageEntries = posts.some(post =>
        deblayageRowsByPost[post]?.some(r => r.driverMatricule?.trim() || r.chantierId?.trim() || r.engineId?.trim())
      );
      const hasExtractionEntries = posts.some(post =>
        extractionRowsByPost[post]?.some(r => r.treuilliste?.trim() || r.equipier1?.trim() || r.chantierName?.trim())
      );
      const hasMaintenanceEntries = posts.some(post =>
        maintenanceRowsByPost[post]?.some(r => r.agentMatricule?.trim() || r.engineId?.trim() || r.roleLabel?.trim())
      );

      const isReportEmpty = !hasMinageEntries && !hasDeblayageEntries && !hasExtractionEntries && !hasMaintenanceEntries;

      if (isReportEmpty) {
        alert(`⚠️ Le rapport de planification pour le ${selectedDate} est entièrement vide !\n\nAucune affectation n'a été planifiée ou enregistrée. Le fichier Excel ne peut pas être généré.`);
        return;
      }

      const workbook = new ExcelJS.Workbook();

      let imageId: number | null = null;
      try {
        const response = await fetch(logoImg);
        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          imageId = workbook.addImage({
            buffer: arrayBuffer,
            extension: 'jpeg',
          });
        }
      } catch (e) {
        console.warn('Could not load logo image for Excel export:', e);
      }

      const borderThin = { style: 'thin' as const, color: { argb: 'D1D5DB' } };
      const borderMedium = { style: 'medium' as const, color: { argb: '475569' } };

      const fontBold = { name: 'Segoe UI', size: 8, bold: true, color: { argb: '0F172A' } };
      const fontNormal = { name: 'Segoe UI', size: 7.5, color: { argb: '334155' } };

      const themeColors = {
        minage: {
          headerBg: '9E1A1A', // Rouge foncé (as requested)
          accentLight: 'FEF2F2'
        },
        deblayage: {
          headerBg: '00BFFF', // Sky Blue (identical to planning color)
          accentLight: 'F0F9FF'
        },
        extraction: {
          headerBg: '10B981', // Emerald Green 
          accentLight: 'F0FDF4'
        },
        maintenance: {
          headerBg: '8B5CF6', // Purple-500
          accentLight: 'FAF5FF'
        }
      };

      // ==========================================
      // SHEET 1: BLASTING & MINAGE
      // ==========================================
      const sheetMinage = workbook.addWorksheet('🔨 MINAGE');
      sheetMinage.views = [{ showGridLines: false }];
      sheetMinage.properties.tabColor = { argb: '9E1A1A' }; // Colored tab: Rouge foncé

      sheetMinage.columns = [
        { key: 'colA', width: 14 }, // Secteur
        { key: 'colB', width: 22 }, // Chantier (Number or Text)
        { key: 'colC', width: 26 }, // Responsable de secteur
        { key: 'colD', width: 22 }, // Mineur
        { key: 'colE', width: 22 }, // Aide Mineur
        { key: 'colF', width: 18 }, // Dimensions / Forage
        { key: 'colG', width: 45 }  // Explosifs d'allocation
      ];
      createCorpHeader(sheetMinage, 'ORDRE DE SERVICE JOURNALIER - TRAVAUX DE MINAGE (TIRS & PERFORATION)', '00BFFF', 'G', imageId);

      posts.forEach(post => {
        const validRows = minageRowsByPost[post].filter(r => 
          (r.chantierId && r.chantierId.trim() !== '') || 
          (r.minerMatricule && r.minerMatricule.trim() !== '') || 
          (r.assistantMatricule && r.assistantMatricule.trim() !== '')
        );

        const postBar = sheetMinage.addRow([`🔨 ${post.toUpperCase()} - FORAGE & MINAGE`]);
        postBar.height = 26; // Generous height
        sheetMinage.mergeCells(`A${postBar.number}:G${postBar.number}`);
        for (let cIdx = 1; cIdx <= 7; cIdx++) {
          const cell = postBar.getCell(cIdx);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; // White arriere plan
          cell.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
        }
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'B8860B' } }; // Gold and larger text
        pCell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centered

        if (validRows.length === 0) {
          const noValRow = sheetMinage.addRow(['ℹ️ Aucun chantier de minage planifié pour ce poste.']);
          noValRow.height = 20;
          sheetMinage.mergeCells(noValRow.number, 1, noValRow.number, 7);
          const cellNo = noValRow.getCell(1);
          cellNo.font = { name: 'Segoe UI', size: 7.5, color: { argb: '64748B' } }; // Normal (no italic)
          cellNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          cellNo.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
          cellNo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          sheetMinage.addRow([]);
          return;
        }

        const hRow = sheetMinage.addRow(['Secteur', 'Chantier', 'Responsable de secteur', 'Mineur', 'Aide Mineur', 'Dimensions', 'Remarques / Explosifs Alloués']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.minage.headerBg } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        const sectorMap: Record<string, ExcelMinage[]> = {};
        validRows.forEach(r => {
          const sec = r.sectorGroup || 'Hydromines Fond';
          if (!sectorMap[sec]) sectorMap[sec] = [];
          sectorMap[sec].push(r);
        });

        const activeSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'].filter(sec => sectorMap[sec] && sectorMap[sec].length > 0);
        Object.keys(sectorMap).forEach(sec => {
          if (!activeSectors.includes(sec)) activeSectors.push(sec);
        });

        activeSectors.forEach(sec => {
          const rows = sectorMap[sec];
          const startRowIdx = sheetMinage.rowCount + 1;

          rows.forEach(r => {
            const supervisorName = getEmployeeName(sectorChiefs[post][sec as any] || r.chiefMatricule);
            const rowData = [
              sec,
              resolveAndParseChantierExcel(r.chantierId),
              supervisorName,
              getEmployeeName(r.minerMatricule),
              getEmployeeName(r.assistantMatricule),
              `${r.gallerySize} m² (M: ${r.plannedRounds}v)`,
              `ANFO: ${r.anfo} kg | TOVEX: ${r.tovex} kg | AMORCES: ${r.ammorces} pcs ${r.remarks ? `[${r.remarks}]` : ''}`
            ];
            const added = sheetMinage.addRow(rowData);
            added.height = 18;
            added.eachCell((c, colIdx) => {
              c.font = fontNormal;
              c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              c.alignment = { vertical: 'middle', horizontal: (colIdx === 7) ? 'left' : 'center' };
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
            });
          });

          const endRowIdx = sheetMinage.rowCount;

          if (endRowIdx >= startRowIdx) {
            sheetMinage.mergeCells(startRowIdx, 1, endRowIdx, 1);
            sheetMinage.mergeCells(startRowIdx, 3, endRowIdx, 3);

            for (let rIdx = startRowIdx; rIdx <= endRowIdx; rIdx++) {
              const cellA = sheetMinage.getCell(rIdx, 1);
              const cellC = sheetMinage.getCell(rIdx, 3);

              cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
              cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
              cellA.font = fontBold;
              cellC.font = fontBold;
              cellA.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              cellC.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              cellA.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              cellC.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
          }
        });

        sheetMinage.addRow([]);
      });

      // ==========================================
      // SHEET 2: CHARGEMENT & DEBLAYAGE
      // ==========================================
      const sheetDeblayage = workbook.addWorksheet('🚜 DEBLAYAGE');
      sheetDeblayage.views = [{ showGridLines: false }];
      sheetDeblayage.properties.tabColor = { argb: '00BFFF' }; // Colored tab: Bleu ciel (Sky Blue)

      sheetDeblayage.columns = [
        { key: 'colA', width: 14 }, // Secteur
        { key: 'colB', width: 22 }, // Chantier (Number or Text)
        { key: 'colC', width: 26 }, // Responsable de secteur
        { key: 'colD', width: 22 }, // Conducteur/Chauffeur
        { key: 'colE', width: 20 }, // Engin Affecté
        { key: 'colF', width: 18 }, // Target Godets
        { key: 'colG', width: 16 }, // Durée Estimée
        { key: 'colH', width: 45 }  // Remarques Terrain
      ];
      createCorpHeader(sheetDeblayage, 'ORDRE DE SERVICE JOURNALIER - DEBLAYAGE (CHARGEMENT & VOL)', themeColors.deblayage.headerBg, 'H', imageId);

      posts.forEach(post => {
        const validRows = deblayageRowsByPost[post].filter(r => 
          (r.chantierId && r.chantierId.trim() !== '') || 
          (r.driverMatricule && r.driverMatricule.trim() !== '') || 
          (r.engineId && r.engineId.trim() !== '')
        );

        const postBar = sheetDeblayage.addRow([`🚜 ${post.toUpperCase()} - CHARGEMENT & DEBLAYAGE`]);
        postBar.height = 26; // Generous height
        sheetDeblayage.mergeCells(`A${postBar.number}:H${postBar.number}`);
        for (let cIdx = 1; cIdx <= 8; cIdx++) {
          const cell = postBar.getCell(cIdx);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; // White background
          cell.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
        }
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'B8860B' } }; // Gold and larger text
        pCell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centered

        if (validRows.length === 0) {
          const noValRow = sheetDeblayage.addRow(['ℹ️ Aucun déblayage planifié pour ce poste.']);
          noValRow.height = 20;
          sheetDeblayage.mergeCells(noValRow.number, 1, noValRow.number, 8);
          const cellNo = noValRow.getCell(1);
          cellNo.font = { name: 'Segoe UI', size: 7.5, color: { argb: '64748B' } }; // Normal font (no italic)
          cellNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          cellNo.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
          cellNo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          sheetDeblayage.addRow([]);
          return;
        }

        const hRow = sheetDeblayage.addRow(['Secteur', 'Chantier', 'Responsable de secteur', 'Conducteur', 'Engin Affecté', 'Target Godets', 'Durée Estimée', 'Remarques Terrain / Instructions']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.deblayage.headerBg } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        const sectorMap: Record<string, ExcelDeblayage[]> = {};
        validRows.forEach(r => {
          const sec = r.sectorGroup || 'Hydromines Fond';
          if (!sectorMap[sec]) sectorMap[sec] = [];
          sectorMap[sec].push(r);
        });

        const activeSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'].filter(sec => sectorMap[sec] && sectorMap[sec].length > 0);
        Object.keys(sectorMap).forEach(sec => {
          if (!activeSectors.includes(sec)) activeSectors.push(sec);
        });

        activeSectors.forEach(sec => {
          const rows = sectorMap[sec];
          const startRowIdx = sheetDeblayage.rowCount + 1;

          rows.forEach(r => {
            const supervisorName = getEmployeeName(sectorChiefs[post][sec as any] || '');
            const rowData = [
              sec,
              resolveAndParseChantierExcel(r.chantierId), // Numeric formatting where applicable
              supervisorName,
              getEmployeeName(r.driverMatricule),
              r.engineCode || r.engineId || 'LHD',
              `${r.godets} godets (${(r.volumeEstimated || 0).toFixed(1)} m³)`,
              `${r.hoursWorked} heures`,
              r.remarks || 'Nettoyage de front systématique et chargement'
            ];
            const added = sheetDeblayage.addRow(rowData);
            added.height = 18;
            added.eachCell((c, colIdx) => {
              c.font = fontNormal;
              c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              c.alignment = { vertical: 'middle', horizontal: (colIdx === 8) ? 'left' : 'center' };
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
            });
          });

          const endRowIdx = sheetDeblayage.rowCount;

          if (endRowIdx >= startRowIdx) {
            sheetDeblayage.mergeCells(startRowIdx, 1, endRowIdx, 1);
            sheetDeblayage.mergeCells(startRowIdx, 3, endRowIdx, 3);

            for (let rIdx = startRowIdx; rIdx <= endRowIdx; rIdx++) {
              const cellA = sheetDeblayage.getCell(rIdx, 1);
              const cellC = sheetDeblayage.getCell(rIdx, 3);

              cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
              cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
              cellA.font = fontBold;
              cellC.font = fontBold;
              cellA.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              cellC.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
              cellA.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              cellC.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
          }
        });

        sheetDeblayage.addRow([]);
      });

      // ==========================================
      // SHEET 3: EXTRACTION
      // ==========================================
      const sheetExtraction = workbook.addWorksheet('🚃 EXTRACTION');
      sheetExtraction.views = [{ showGridLines: false }];
      sheetExtraction.properties.tabColor = { argb: '00BFFF' }; // Colored tab: Bleu ciel (Sky Blue)

      sheetExtraction.columns = [
        { key: 'colA', width: 24 }, // Installation
        { key: 'colB', width: 22 }, // Treuilliste Principal
        { key: 'colC', width: 22 }, // Équipier 1
        { key: 'colD', width: 22 }, // Équipier 2
        { key: 'colE', width: 26 }, // Équipiers Secondaires
        { key: 'colF', width: 18 }, // Objectif Wagons
        { key: 'colG', width: 45 }  // Directives
      ];
      createCorpHeader(sheetExtraction, 'ORDRE DE SERVICE JOURNALIER - BURES & LOGISTIQUE EXTRACTION UNITE HYDROMINES', themeColors.extraction.headerBg, 'G', imageId);

      posts.forEach(post => {
        const validRows = extractionRowsByPost[post].filter(r => 
          (r.chantierName && r.chantierName.trim() !== '') || 
          (r.treuilliste && r.treuilliste.trim() !== '') || 
          (r.equipier1 && r.equipier1.trim() !== '')
        );

        const postBar = sheetExtraction.addRow([`🚃 ${post.toUpperCase()} - EXTRACTION & TREUIL`]);
        postBar.height = 26; // Generous height
        sheetExtraction.mergeCells(`A${postBar.number}:G${postBar.number}`);
        for (let cIdx = 1; cIdx <= 7; cIdx++) {
          const cell = postBar.getCell(cIdx);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; // White arriere plan
          cell.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
        }
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'B8860B' } }; // Gold and larger text
        pCell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centered

        if (validRows.length === 0) {
          const noValRow = sheetExtraction.addRow(['ℹ️ Aucune extraction planifiée pour ce poste.']);
          noValRow.height = 20;
          sheetExtraction.mergeCells(noValRow.number, 1, noValRow.number, 7);
          const cellNo = noValRow.getCell(1);
          cellNo.font = { name: 'Segoe UI', size: 7.5, color: { argb: '64748B' } }; // Normal font (no italic)
          cellNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          cellNo.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
          cellNo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          sheetExtraction.addRow([]);
          return;
        }

        const hRow = sheetExtraction.addRow(['Installation / Bure', 'Treuilliste Principal', 'Équipier 1', 'Équipier 2', 'Équipiers Secondaires', 'Target Wagons', 'Remarques / Directives']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.extraction.headerBg } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        validRows.forEach(r => {
          const added = sheetExtraction.addRow([
            resolveAndParseChantierExcel('', r.chantierName || 'Bure'), // Numeric formatting for chantiers inside extraction
            getEmployeeName(r.treuilliste),
            getEmployeeName(r.equipier1),
            getEmployeeName(r.equipier2),
            [getEmployeeName(r.equipier3), getEmployeeName(r.equipier4)].filter(Boolean).join(', ') || 'N/A',
            `${r.wagonsTarget} wagons`,
            r.remarks || 'Extraction minerai prioritaire HYDROMINES'
          ]);
          added.height = 18;
          added.eachCell((c, colIdx) => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle', horizontal: (colIdx === 7) ? 'left' : 'center' };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
          });
        });

        sheetExtraction.addRow([]);
      });

      // ==========================================
      // SHEET 4: MAINTENANCE
      // ==========================================
      const sheetMaint = workbook.addWorksheet('🔧 MAINTENANCE');
      sheetMaint.views = [{ showGridLines: false }];
      sheetMaint.properties.tabColor = { argb: '9E1A1A' }; // Colored tab: Rouge foncé

      sheetMaint.columns = [
        { key: 'colA', width: 22 }, // Rôle Affecté
        { key: 'colB', width: 24 }, // Agent Technique
        { key: 'colC', width: 14 }, // Matricule
        { key: 'colD', width: 22 }, // Engin
        { key: 'colE', width: 14 }, // Durée Estimée
        { key: 'colF', width: 45 }, // Intervention
        { key: 'colG', width: 25 }  // Priorité / Sceau
      ];
      createCorpHeader(sheetMaint, 'ORDRE DE SERVICE JOURNALIER - BRIGADE MAINTENANCE PROGRAMMEE ATELIER', themeColors.maintenance.headerBg, 'G', imageId);

      posts.forEach(post => {
        const validRows = maintenanceRowsByPost[post].filter(r => 
          (r.agentMatricule && r.agentMatricule.trim() !== '') || 
          (r.engineId && r.engineId.trim() !== '') || 
          (r.roleLabel && r.roleLabel.trim() !== '')
        );

        const postBar = sheetMaint.addRow([`🔧 ${post.toUpperCase()} - BRIGADE MAINTENANCE TECHNIQUE`]);
        postBar.height = 26; // Generous height
        sheetMaint.mergeCells(`A${postBar.number}:G${postBar.number}`);
        for (let cIdx = 1; cIdx <= 7; cIdx++) {
          const cell = postBar.getCell(cIdx);
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; // White arriere plan
          cell.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
        }
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'B8860B' } }; // Gold and larger text
        pCell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centered

        if (validRows.length === 0) {
          const noValRow = sheetMaint.addRow(['ℹ️ Aucun maintenance planifiée pour ce poste.']);
          noValRow.height = 20;
          sheetMaint.mergeCells(noValRow.number, 1, noValRow.number, 7);
          const cellNo = noValRow.getCell(1);
          cellNo.font = { name: 'Segoe UI', size: 7.5, color: { argb: '64748B' } }; // Normal font (no italic)
          cellNo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          cellNo.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
          cellNo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
          sheetMaint.addRow([]);
          return;
        }

        const hRow = sheetMaint.addRow(['Rôle Affecté', 'Agent Technique', 'Matricule', 'Engin Pris en charge', 'Durée Estimée', 'Description des Réparations / Directives', 'Priorité / Niveau']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: themeColors.maintenance.headerBg } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });

        validRows.forEach(r => {
          const added = sheetMaint.addRow([
            r.roleLabel,
            getEmployeeName(r.agentMatricule),
            r.agentMatricule,
            r.engineCode || r.engineId || 'ST2G 4',
            `${r.hoursSpent} heures`,
            r.workDescription || 'Maintenance préventive systématique de niveau 1-2',
            'HYDROMINES PRIORITAIRE'
          ]);
          added.height = 18;
          added.eachCell((c, colIdx) => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle', horizontal: (colIdx === 6) ? 'left' : 'center' };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
          });
        });

        sheetMaint.addRow([]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HYDROMINES-planification_${selectedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error('Failed to export Excel report:', e);
      alert('Une erreur est survenue lors de la génération du fichier Excel.');
    }
  };

  return (
    <button
      onClick={exportToExcel}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:translate-y-px cursor-pointer border border-emerald-500/30"
      title="Exporter la planification au format excel sans grille pour HYDROMINES"
    >
      <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
      <span>Exporter Planning</span>
    </button>
  );
};

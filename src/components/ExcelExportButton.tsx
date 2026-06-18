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

  const createCorpHeader = (sheet: ExcelJS.Worksheet, title: string, imageId?: number | null) => {
    // 1. Title bar with premium theme colors
    const logoRow = sheet.addRow(['', '', '', '', 'EXPLOITATION MINIERE SMI', '', `DATE : ${selectedDate}`]);
    logoRow.height = 54; // spacious height for 1.68cm height logo (approx 64 pixels)
    sheet.mergeCells(`E${logoRow.number}:F${logoRow.number}`);
    
    if (imageId !== undefined && imageId !== null) {
      sheet.addImage(imageId, {
        tl: { col: 0.1, row: logoRow.number - 1 + 0.1 },
        ext: { width: 138, height: 64 }
      });
    } else {
      // Fallback text if image wasn't loaded
      logoRow.getCell('A').value = '🏗️ HYDRO-MINES';
      sheet.mergeCells(`A${logoRow.number}:C${logoRow.number}`);
      const logoCell = logoRow.getCell('A');
      logoCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '0F172A' } };
      logoCell.alignment = { vertical: 'middle' };
    }

    // Style Unit Section (E)
    const unitCell = logoRow.getCell('E');
    unitCell.font = { name: 'Segoe UI', size: 10, bold: true, italic: true, color: { argb: '475569' } };
    unitCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Style Date (G)
    const dateCell = logoRow.getCell('G');
    dateCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0284C7' } }; // Sky premium blue
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };

    const sepRow = sheet.addRow([]);
    sepRow.height = 5;
    sheet.mergeCells(`A${sepRow.number}:G${sepRow.number}`);
    const sepCell = sepRow.getCell('A');
    sepCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0284C7' } // Sky Blue Divider
    };

    const titleRow = sheet.addRow([title]);
    titleRow.height = 32;
    sheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
    const titleCell = titleRow.getCell('A');
    titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' } // Deep slate header
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.addRow([]); // Blank spacer line
  };

  const createSignatures = (sheet: ExcelJS.Worksheet) => {
    sheet.addRow([]);
    sheet.addRow([]);

    const sigTitleRow = sheet.addRow(['', '', 'SIGNATURES DE RECONNAISSANCE ET APPROBATION']);
    sheet.mergeCells(`C${sigTitleRow.number}:E${sigTitleRow.number}`);
    sigTitleRow.getCell('C').font = { name: 'Arial', size: 10, bold: true, underline: true, color: { argb: '1E3A8A' } };
    sigTitleRow.getCell('C').alignment = { horizontal: 'center' };

    sheet.addRow([]);

    const sigNamesRow = sheet.addRow([
      '   Le Secrétaire de Planification (SMI Mine)',
      '',
      '',
      '',
      '   Le Représentant de l\'Ingénierie HydroMines',
      '',
      ''
    ]);
    sheet.mergeCells(`A${sigNamesRow.number}:B${sigNamesRow.number}`);
    sheet.mergeCells(`E${sigNamesRow.number}:G${sigNamesRow.number}`);
    sigNamesRow.getCell('A').font = { name: 'Arial', size: 9, bold: true };
    sigNamesRow.getCell('E').font = { name: 'Arial', size: 9, bold: true };

    sheet.addRow([]);
    sheet.addRow([]);

    const spaceRow = sheet.addRow([
      '   Sceau & Visa : ______________________',
      '',
      '',
      '',
      '   Sceau & Visa : ______________________',
      '',
      ''
    ]);
    sheet.mergeCells(`A${spaceRow.number}:B${spaceRow.number}`);
    sheet.mergeCells(`E${spaceRow.number}:G${spaceRow.number}`);
    spaceRow.getCell('A').font = { name: 'Arial', size: 9, italic: true };
    spaceRow.getCell('E').font = { name: 'Arial', size: 9, italic: true };
  };

  const exportToExcel = async () => {
    try {
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
      const borderMedium = { style: 'medium' as const, color: { argb: '0F172A' } }; // Sleek Slate

      const fontBold = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '1E293B' } };
      const fontNormal = { name: 'Segoe UI', size: 9, color: { argb: '334155' } };
      const colorGrayLight = 'F8FAFC'; // Extra clean slate-white for headers
      const colorShiftHeader = '0F172A'; // Dark slate for shifts
      const sectorColors: Record<string, string> = {
        'Imiter 2': 'EFF6FF',   // Subtle blue accent
        'Imiter 1': 'FEF3C7',   // Subtle amber accent
        'Imiter Est': 'ECFDF5', // Subtle emerald accent
      };

      const sectorOrder = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
      const getSectorSortingIndex = (sector: string) => {
        const index = sectorOrder.findIndex(s => s.toLowerCase() === (sector || '').trim().toLowerCase());
        return index === -1 ? 999 : index;
      };

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

      // ==========================================
      // SHEET 1: BLASTING & MINAGE
      // ==========================================
      const sheetMinage = workbook.addWorksheet('🔨 MINAGE');
      sheetMinage.views = [{ showGridLines: false }]; // Turn off default grid lines
      sheetMinage.columns = [
        { key: 'colA', width: 14 }, // Secteur
        { key: 'colB', width: 22 }, // Chantier
        { key: 'colC', width: 24 }, // Responsable de secteur
        { key: 'colD', width: 22 }, // Mineur
        { key: 'colE', width: 22 }, // Aide Mineur
        { key: 'colF', width: 16 }, // Dimensions / Forage
        { key: 'colG', width: 45 }  // Explosifs d'allocation
      ];
      createCorpHeader(sheetMinage, 'ORDRE DE SERVICE JOURNALIER - TRAVAUX DE MINAGE (TIRS & PERFORATION)', imageId);

      posts.forEach(post => {
        const validRows = minageRowsByPost[post].filter(r => r.chantierId !== '');
        if (validRows.length === 0) return;

        // Sort by 'Imiter 2', 'Imiter 1', 'Imiter Est'
        const sortedMinage = [...validRows].sort((a, b) => {
          return getSectorSortingIndex(a.sectorGroup || '') - getSectorSortingIndex(b.sectorGroup || '');
        });

        const postBar = sheetMinage.addRow([`🔵 ${post.toUpperCase()}`]);
        postBar.height = 26;
        sheetMinage.mergeCells(`A${postBar.number}:G${postBar.number}`);
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorShiftHeader } };
        pCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        // Headers
        const hRow = sheetMinage.addRow(['Secteur', 'Chantier', 'Responsable de secteur', 'Mineur', 'Aide Mineur', 'Dimensions', 'Remarques / Explosifs Alloués']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = fontBold;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrayLight } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Rows
        sortedMinage.forEach(r => {
          const rowData = [
            r.sectorGroup || 'SMI Fond',
            getChantierName(r.chantierId),
            getEmployeeName(sectorChiefs[post][r.sectorGroup as any] || r.chiefMatricule),
            getEmployeeName(r.minerMatricule),
            getEmployeeName(r.assistantMatricule),
            `${r.gallerySize} m² (M: ${r.plannedRounds}v)`,
            `ANFO: ${r.anfo} kg | TOVEX: ${r.tovex} kg | AMORCES: ${r.ammorces} pcs ${r.remarks ? `[${r.remarks}]` : ''}`
          ];
          const added = sheetMinage.addRow(rowData);
          added.height = 20;
          added.eachCell((c, colIdx) => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle' };
            
            // Custom sector coloration
            const bgColor = sectorColors[r.sectorGroup || ''];
            if (bgColor) {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            } else {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; // pure white
            }
          });
        });
        sheetMinage.addRow([]); // Blank spacer
      });

      // ==========================================
      // SHEET 2: CHARGEMENT & DEBLAYAGE
      // ==========================================
      const sheetDeblayage = workbook.addWorksheet('🚜 DEBLAYAGE');
      sheetDeblayage.views = [{ showGridLines: false }];
      sheetDeblayage.columns = [
        { key: 'colA', width: 14 }, // Secteur
        { key: 'colB', width: 22 }, // Chantier
        { key: 'colC', width: 24 }, // Chauffeur / Conducteur
        { key: 'colD', width: 20 }, // Code Engin Affecté
        { key: 'colE', width: 18 }, // Target Godets
        { key: 'colF', width: 16 }, // Durée Poste
        { key: 'colG', width: 45 }  // Remarques Terrain
      ];
      createCorpHeader(sheetDeblayage, 'ORDRE DE SERVICE JOURNALIER - DEBLAYAGE (CHARGEMENT & VOL)', imageId);

      posts.forEach(post => {
        const validRows = deblayageRowsByPost[post].filter(r => r.driverMatricule !== '');
        if (validRows.length === 0) return;

        // Sort by sector Order
        const sortedDeblayage = [...validRows].sort((a, b) => {
          return getSectorSortingIndex(a.sectorGroup || '') - getSectorSortingIndex(b.sectorGroup || '');
        });

        const postBar = sheetDeblayage.addRow([`🔵 ${post.toUpperCase()}`]);
        postBar.height = 26;
        sheetDeblayage.mergeCells(`A${postBar.number}:G${postBar.number}`);
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorShiftHeader } };
        pCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        // Headers
        const hRow = sheetDeblayage.addRow(['Secteur', 'Chantier', 'Conducteur', 'Engin Affecté', 'Target Godets', 'Durée Estimée', 'Remarques Terrain / Instructions']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = fontBold;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrayLight } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Rows
        sortedDeblayage.forEach(r => {
          const rowData = [
            r.sectorGroup || 'SMI Fond',
            getChantierName(r.chantierId),
            getEmployeeName(r.driverMatricule),
            r.engineCode || r.engineId || 'ST2D',
            `${r.godets} godets (${(r.volumeEstimated || 0).toFixed(1)} m³)`,
            `${r.hoursWorked} heures`,
            r.remarks || 'Nettoyage systématique du front et transport stérile'
          ];
          const added = sheetDeblayage.addRow(rowData);
          added.height = 20;
          added.eachCell(c => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle' };
            
            const bgColor = sectorColors[r.sectorGroup || ''];
            if (bgColor) {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            } else {
              c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
            }
          });
        });
        sheetDeblayage.addRow([]); // Blank spacer
      });

      // ==========================================
      // SHEET 3: EXTRACTION
      // ==========================================
      const sheetExtraction = workbook.addWorksheet('🚃 EXTRACTION');
      sheetExtraction.views = [{ showGridLines: false }];
      sheetExtraction.columns = [
        { key: 'colA', width: 22 }, // Installation
        { key: 'colB', width: 22 }, // Treuilliste Principal
        { key: 'colC', width: 22 }, // Équipier 1
        { key: 'colD', width: 22 }, // Équipier 2
        { key: 'colE', width: 26 }, // Équipiers 3/4
        { key: 'colF', width: 18 }, // Objectif Wagons / Cible
        { key: 'colG', width: 33 }  // Remarques Extraction
      ];
      createCorpHeader(sheetExtraction, 'ORDRE DE SERVICE JOURNALIER - BURES & LOGISTIQUE EXTRACTION UNITE SMI', imageId);

      posts.forEach(post => {
        const validRows = extractionRowsByPost[post].filter(r => r.treuilliste !== '' || r.equipier1 !== '');
        if (validRows.length === 0) return;

        const postBar = sheetExtraction.addRow([`🔵 ${post.toUpperCase()}`]);
        postBar.height = 26;
        sheetExtraction.mergeCells(`A${postBar.number}:G${postBar.number}`);
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorShiftHeader } };
        pCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        // Headers
        const hRow = sheetExtraction.addRow(['Installation', 'Treuilliste Principal', 'Équipier 1', 'Équipier 2', 'Équipiers Secondaires', 'Target Wagons', 'Remarques / Directives']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = fontBold;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrayLight } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Rows
        validRows.forEach(r => {
          const added = sheetExtraction.addRow([
            r.chantierName || 'Bure N340 Imiter Est',
            getEmployeeName(r.treuilliste),
            getEmployeeName(r.equipier1),
            getEmployeeName(r.equipier2),
            [getEmployeeName(r.equipier3), getEmployeeName(r.equipier4)].filter(Boolean).join(', ') || 'N/A',
            `${r.wagonsTarget} wagons`,
            r.remarks || 'Extraction minerai prioritaire SMI, cadence maximale requise'
          ]);
          added.height = 20;
          added.eachCell(c => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle' };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
          });
        });
        sheetExtraction.addRow([]); // Blank spacer
      });

      // ==========================================
      // SHEET 4: MAINTENANCE
      // ==========================================
      const sheetMaint = workbook.addWorksheet('🔧 MAINTENANCE');
      sheetMaint.views = [{ showGridLines: false }];
      sheetMaint.columns = [
        { key: 'colA', width: 16 }, // Rôle Affecté
        { key: 'colB', width: 22 }, // Agent Tech
        { key: 'colC', width: 16 }, // Matricule
        { key: 'colD', width: 22 }, // Engin en charge
        { key: 'colE', width: 14 }, // Durée Estimée
        { key: 'colF', width: 45 }, // Description Intervention
        { key: 'colG', width: 25 }  // Sceau / statut
      ];
      createCorpHeader(sheetMaint, 'ORDRE DE SERVICE JOURNALIER - BRIGADE MAINTENANCE PROGRAMMEE ATELIER', imageId);

      posts.forEach(post => {
        const validRows = maintenanceRowsByPost[post].filter(r => r.agentMatricule !== '');
        if (validRows.length === 0) return;

        const postBar = sheetMaint.addRow([`🔵 ${post.toUpperCase()}`]);
        postBar.height = 26;
        sheetMaint.mergeCells(`A${postBar.number}:G${postBar.number}`);
        const pCell = postBar.getCell('A');
        pCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorShiftHeader } };
        pCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

        // Headers
        const hRow = sheetMaint.addRow(['Rôle Affecté', 'Agent Technique', 'Matricule', 'Engin Pris en charge', 'Durée Estimée', 'Description des Réparations / Directives', 'Urgences / Niveau']);
        hRow.height = 20;
        hRow.eachCell(c => {
          c.font = fontBold;
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGrayLight } };
          c.border = { top: borderThin, bottom: borderMedium, left: borderThin, right: borderThin };
          c.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Rows
        validRows.forEach(r => {
          const added = sheetMaint.addRow([
            r.roleLabel,
            getEmployeeName(r.agentMatricule),
            r.agentMatricule,
            r.engineCode || r.engineId || 'ST2G 4',
            `${r.hoursSpent} heures`,
            r.workDescription || 'Maintenance préventive systématique de niveau 1-2',
            'SMI PRIORITAIRE'
          ]);
          added.height = 20;
          added.eachCell(c => {
            c.font = fontNormal;
            c.border = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
            c.alignment = { vertical: 'middle' };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
          });
        });
        sheetMaint.addRow([]); // Blank spacer
      });
      // Trigger workbook download in browser
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HydroMines_Planification_SMI_${selectedDate}.xlsx`;
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
      title="Exporter la planification avec 4 onglets distincts correspondant aux grilles de la page planification"
    >
      <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
      <span>Export Excel Client</span>
    </button>
  );
};

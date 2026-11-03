/**
 * src/utils/excelExport.ts
 * Multi-sheet Excel workbook generator using SheetJS (xlsx).
 */

import * as XLSX from 'xlsx';
import { ProjectEstimateState } from '../types/estimate';
import { calculateConsolidatedSummary, calculateTradeTotal } from './calculations';
import { round2 } from './calculations';

export function exportToExcel(state: ProjectEstimateState): void {
  const wb = XLSX.utils.book_new();
  const summary = calculateConsolidatedSummary(
    state.trades,
    state.markups,
    state.metadata.totalFloorArea
  );
  const curr = state.metadata.currency || '$';

  // Sheet 1: Consolidated Summary
  const summaryData: (string | number)[][] = [
    ['CONSOLIDATED MASTER SUMMARY'],
    [],
    ['Project:', state.metadata.projectName],
    ['Client:', state.metadata.clientName],
    ['Location:', state.metadata.location],
    ['Estimator:', state.metadata.estimator],
    ['Date:', state.metadata.date],
    ['Floor Area:', state.metadata.totalFloorArea, state.metadata.floorAreaUnit],
    ['Currency:', curr],
    ['Status:', state.metadata.status],
    [],
    ['TRADE BREAKDOWN'],
    ['#', 'Trade', 'Material', 'Labor', 'Equipment', 'Direct Total', '% Share'],
  ];

  summary.tradeRollups.forEach((r, i) => {
    summaryData.push([
      i + 1,
      r.name || r.tradeName || '',
      r.materialTotal,
      r.laborTotal,
      r.equipmentTotal,
      r.directTotal,
      r.percentageShare,
    ]);
  });

  summaryData.push([]);
  summaryData.push(['', 'TOTAL DIRECT COST', summary.materialTotal, summary.laborTotal, summary.equipmentTotal, summary.directCost, 100]);
  summaryData.push([]);
  summaryData.push(['PROJECT MARKUPS']);
  summaryData.push(['Overhead / OCM (%)', summary.ocmPercent, '', 'Amount:', summary.ocmAmount]);
  summaryData.push(['Subtotal after OCM', '', '', '', summary.subtotalAfterOCM]);
  summaryData.push(["Contractor's Profit (%)", summary.profitPercent, '', 'Amount:', summary.profitAmount]);
  summaryData.push(['Subtotal before Tax', '', '', '', summary.subtotalBeforeTax]);
  summaryData.push(['Tax / VAT (%)', summary.taxPercent, '', 'Amount:', summary.taxAmount]);
  summaryData.push([]);
  summaryData.push(['GRAND TOTAL PROJECT COST', '', '', '', summary.grandTotal]);
  summaryData.push([]);
  summaryData.push(['Cost per Floor Area', `${curr}${round2(summary.costPerFloorArea).toLocaleString()} / ${state.metadata.floorAreaUnit}`]);

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [
    { wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Consolidated Summary');

  // Sheets 2-11: Individual Trade Sheets
  state.trades.forEach((trade, tIdx) => {
    const tradeTotal = calculateTradeTotal(trade);
    const rows: (string | number)[][] = [
      [`Trade ${tIdx + 1}: ${trade.name}`],
      [],
      ['Code', 'Description', 'Specification', 'Unit', 'Qty', 'Mat/Unit', 'Lab/Unit', 'Equip/Unit', 'Unit Cost', 'Material Total', 'Labor Total', 'Equip Total', 'Direct Total'],
    ];

    trade.subScopes.forEach((scope) => {
      rows.push([]);
      rows.push([`▸ ${scope.code} ${scope.name}`]);

      scope.items.forEach((item) => {
        const uc = round2((item.materialRate || 0) + (item.laborRate || 0) + (item.equipmentRate || 0));
        const mt = round2((item.quantity || 0) * (item.materialRate || 0));
        const lt = round2((item.quantity || 0) * (item.laborRate || 0));
        const et = round2((item.quantity || 0) * (item.equipmentRate || 0));
        const dt = round2(mt + lt + et);
        rows.push([
          item.itemCode,
          item.description,
          item.specification,
          item.unit,
          item.quantity,
          item.materialRate,
          item.laborRate,
          item.equipmentRate,
          uc, mt, lt, et, dt,
        ]);
      });
    });

    rows.push([]);
    rows.push(['', 'TRADE TOTAL', '', '', '', '', '', '', '', tradeTotal.materialTotal, tradeTotal.laborTotal, tradeTotal.equipmentTotal, tradeTotal.directTotal]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 }, { wch: 45 }, { wch: 30 }, { wch: 8 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    ];

    // Sheet name max 31 chars
    const sheetName = `${String(tIdx + 1).padStart(2, '0')}-${trade.shortName}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `${state.metadata.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_BOQ.xlsx`;
  XLSX.writeFile(wb, fileName);
}

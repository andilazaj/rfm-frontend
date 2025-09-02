import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

export function exportToExcel(
  data: any[],
  filename: string = 'export',
  sheetName: string = 'Sheet1'
): void {
  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
  const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob: Blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });
  FileSaver.saveAs(blob, `${filename}.xlsx`);
}

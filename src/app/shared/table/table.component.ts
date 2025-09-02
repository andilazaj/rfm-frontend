import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent {
  @Input() columnDefs: { key: string; label: string; transform?: (value: any) => string }[] = [];
  @Input() data: any[] = [];
  @Input() showActions = false;
  @Input() emptyMessage = 'No data available.';
  @Input() canDelete = true;
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();

  handleEdit(item: any): void {
    this.onEdit.emit(item);
  }

  handleDelete(item: any): void {
    this.onDelete.emit(item);
  }

  formatValue(value: any): string {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'object' ? v.name : v)).join(', ');
    }
    return value ?? '-';
  }
}

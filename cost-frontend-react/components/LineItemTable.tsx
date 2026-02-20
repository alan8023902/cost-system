import React, { useState, useRef, useEffect, useMemo } from 'react';
import { lineItemApi } from '../services/apiService';
import { Plus, Trash2, Pencil, CircleAlert } from 'lucide-react';
import { useToast } from './ToastProvider';


interface LineItem {
  id?: number;
  itemName: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  preTaxAmount: number;
  remarks?: string;
  category?: string;
  brand?: string;
  contractorName?: string;
  workType?: string;
}

interface ColumnConfig {
  field: string;
  label: string;
  type?: 'string' | 'number';
  editable?: boolean;
  required?: boolean;
  visible?: boolean;
  width?: number;
  precision?: number;
}

interface DisplayColumn extends ColumnConfig {
  key: string;
}

interface LineItemTableProps {
  versionId: number;
  module: 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE';
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  onRecalculate: () => void;
  columns?: ColumnConfig[];
  defaultCategory?: string;
}

const FIELD_KEY_MAP: Record<string, string> = {
  name: 'itemName',
  item_name: 'itemName',
  itemName: 'itemName',
  spec: 'specification',
  specification: 'specification',
  unit: 'unit',
  qty: 'quantity',
  quantity: 'quantity',
  price_tax: 'unitPrice',
  unit_price: 'unitPrice',
  amount_tax: 'totalAmount',
  total_amount: 'totalAmount',
  tax_rate: 'taxRate',
  tax_amount: 'taxAmount',
  pre_tax_amount: 'preTaxAmount',
  remark: 'remarks',
  remarks: 'remarks',
  category: 'category',
  brand: 'brand',
  contractor_name: 'contractorName',
  work_type: 'workType',
};

const DEFAULT_COLUMNS: DisplayColumn[] = [
  { field: 'itemName', key: 'itemName', label: '项目名称', type: 'string', editable: true, visible: true, width: 200 },
  { field: 'specification', key: 'specification', label: '规格型号', type: 'string', editable: true, visible: true, width: 150 },
  { field: 'unit', key: 'unit', label: '单位', type: 'string', editable: true, visible: true, width: 80 },
  { field: 'quantity', key: 'quantity', label: '数量', type: 'number', editable: true, visible: true, width: 90, precision: 4 },
  { field: 'unitPrice', key: 'unitPrice', label: '含税单价', type: 'number', editable: true, visible: true, width: 110, precision: 6 },
  { field: 'taxRate', key: 'taxRate', label: '税率', type: 'number', editable: true, visible: true, width: 80, precision: 4 },
  { field: 'totalAmount', key: 'totalAmount', label: '含税金额', type: 'number', editable: false, visible: true, width: 110, precision: 2 },
  { field: 'taxAmount', key: 'taxAmount', label: '税额', type: 'number', editable: false, visible: true, width: 90, precision: 2 },
  { field: 'preTaxAmount', key: 'preTaxAmount', label: '不含税', type: 'number', editable: false, visible: true, width: 100, precision: 2 },
  { field: 'remarks', key: 'remarks', label: '备注', type: 'string', editable: true, visible: true, width: 160 },
];

const normalizeColumns = (columns?: ColumnConfig[]): DisplayColumn[] => {
  if (!columns || columns.length === 0) {
    return DEFAULT_COLUMNS;
  }
  return columns
    .filter((col) => col.visible !== false)
    .map((col) => {
      const key = FIELD_KEY_MAP[col.field] || col.field;
      return {
        ...col,
        key,
        label: col.label || col.field,
        editable: col.editable !== false,
        visible: col.visible !== false,
      };
    });
};

export const LineItemTable: React.FC<LineItemTableProps> = ({
  versionId,
  module,
  items,
  onItemsChange,
  onRecalculate,
  columns,
  defaultCategory,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const toast = useToast();


  const displayColumns = useMemo(() => normalizeColumns(columns), [columns]);
  const editableColumns = useMemo(
    () => displayColumns.filter((col) => col.editable && !['totalAmount', 'taxAmount', 'preTaxAmount'].includes(col.key)),
    [displayColumns]
  );

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (rowIndex: number, colKey: string, editable?: boolean) => {
    if (!editable) return;
    setEditingCell({ row: rowIndex, col: colKey });
  };

  const toNumberValue = (value: string) => {
    if (value === '' || value === '-') return 0;
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  };

  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    const newItems = [...items];
    const item = newItems[rowIndex];
    (item as any)[colKey] = toNumberValue(value);

    if (['quantity', 'unitPrice', 'taxRate'].includes(colKey)) {
      item.totalAmount = item.quantity * item.unitPrice;
      item.taxAmount = item.totalAmount * (item.taxRate / 100);
      item.preTaxAmount = item.totalAmount - item.taxAmount;
    }

    onItemsChange(newItems);
  };

  const handleCellBlur = async () => {
    setEditingCell(null);
    try {
      await lineItemApi.batchUpdate(versionId, module, items);
      onRecalculate();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colKey: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const columns = editableColumns.map((col) => col.key);
      const currentColIndex = columns.indexOf(colKey);
      if (columns.length === 0) return;

      if (e.key === 'Enter') {
        if (rowIndex < items.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: colKey });
        } else {
          handleAddRow();
          setTimeout(() => {
            setEditingCell({ row: items.length, col: columns[0] });
          }, 100);
        }
      } else if (e.key === 'Tab') {
        if (currentColIndex < columns.length - 1) {
          setEditingCell({ row: rowIndex, col: columns[currentColIndex + 1] });
        } else if (rowIndex < items.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: columns[0] });
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split('\n').filter(row => row.trim());

    if (rows.length === 0) return;

    const targetColumns = editableColumns.length > 0 ? editableColumns : displayColumns;
    const newItems: LineItem[] = [];

    rows.forEach(row => {
      const cols = row.split('\t');
      const item: LineItem = {
        itemName: '',
        specification: '',
        unit: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 9,
        totalAmount: 0,
        taxAmount: 0,
        preTaxAmount: 0,
        remarks: '',
        category: defaultCategory || '',
      };

      cols.forEach((value, idx) => {
        const col = targetColumns[idx];
        if (!col) return;
        const key = col.key as keyof LineItem;
        (item as any)[key] = col.type === 'number' ? toNumberValue(value) : value;
      });

      item.totalAmount = item.quantity * item.unitPrice;
      item.taxAmount = item.totalAmount * (item.taxRate / 100);
      item.preTaxAmount = item.totalAmount - item.taxAmount;

      newItems.push(item);
    });

    if (newItems.length > 0) {
      const updatedItems = [...items, ...newItems];
      onItemsChange(updatedItems);

      try {
        await lineItemApi.batchUpdate(versionId, module, updatedItems);
        onRecalculate();
        toast.success(`成功粘贴 ${newItems.length} 行数据`);
      } catch (error: any) {
        toast.error(error?.message || '保存失败');
      }

    }
  };

  const handleAddRow = () => {
    const newItem: LineItem = {
      itemName: '',
      specification: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      taxRate: 9,
      totalAmount: 0,
      taxAmount: 0,
      preTaxAmount: 0,
      remarks: '',
      category: defaultCategory || '',
    };
    onItemsChange([...items, newItem]);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;

    if (confirm(`确定删除选中的 ${selectedRows.size} 行吗？`)) {
      const newItems = items.filter((_, index) => !selectedRows.has(index));
      onItemsChange(newItems);
      setSelectedRows(new Set());

      try {
        await lineItemApi.batchUpdate(versionId, module, newItems);
        onRecalculate();
        toast.success('删除成功');
      } catch (error: any) {
        toast.error(error?.message || '删除失败');
      }

    }
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const formatValue = (value: any, precision?: number) => {
    if (typeof value === 'number') {
      if (typeof precision === 'number') return value.toFixed(precision);
      return value.toFixed(2);
    }
    return value || '—';
  };

  const renderCell = (item: LineItem, rowIndex: number, col: DisplayColumn) => {
    const colKey = col.key;
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colKey;
    const value = (item as any)[colKey];
    const isEditable = col.editable && !['totalAmount', 'taxAmount', 'preTaxAmount'].includes(colKey);

    if (isEditing && isEditable) {
      return (
        <input
          ref={inputRef}
          type={col.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => handleCellChange(rowIndex, colKey, e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colKey)}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          step={col.precision ? Math.pow(10, -col.precision) : undefined}
        />
      );
    }

    if (!isEditable && ['totalAmount', 'taxAmount', 'preTaxAmount'].includes(colKey)) {
      return (
        <span className="text-slate-700 font-mono">
          {formatValue(value, col.precision ?? 2)}
        </span>
      );
    }

    return (
      <div
        onDoubleClick={() => handleCellDoubleClick(rowIndex, colKey, isEditable)}
        className={`px-2 py-1 rounded transition-colors ${
          isEditable
            ? 'cursor-text bg-blue-50/50 text-blue-900 hover:bg-blue-100 border border-blue-100'
            : 'text-slate-600'
        }`}
      >
        {formatValue(value, col.precision)}
      </div>
    );
  };

  const columnCount = displayColumns.length + 2;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddRow}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus size={14} className="mr-1" />
            新增行
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedRows.size === 0}
            className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} className="mr-1" />
            删除选中 ({selectedRows.size})
          </button>
        </div>

        <div className="text-xs text-slate-500">
          提示：双击单元格编辑 | Tab/Enter切换 | Ctrl+V批量粘贴Excel数据
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-100 bg-blue-50/60 text-xs text-blue-700 flex items-center gap-2">
        <CircleAlert size={14} />
        <span>蓝色单元格支持编辑，金额和税额会自动重算。</span>
      </div>

      <div ref={tableRef} className="overflow-auto max-h-[600px]" onPaste={handlePaste}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-200">
              <th className="w-10 px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedRows.size === items.length && items.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(items.map((_, i) => i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">序号</th>
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-xs font-medium text-slate-500 uppercase ${col.type === 'number' ? 'text-right' : 'text-left'}`}
                  style={col.width ? { minWidth: col.width } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.editable && !['totalAmount', 'taxAmount', 'preTaxAmount'].includes(col.key) && (
                      <Pencil size={12} className="text-blue-500" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center text-slate-400">
                  <div>暂无数据</div>
                  <div className="text-xs mt-2">点击"新增行"或粘贴Excel数据开始录入</div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedRows.has(index) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => handleSelectRow(index)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                  {displayColumns.map((col) => (
                    <td key={`${index}-${col.key}`} className={`px-3 py-2 ${col.type === 'number' ? 'text-right' : 'text-left'}`}>
                      {renderCell(item, index, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">共 {items.length} 行</span>
          <div className="flex items-center space-x-6">
            <span className="text-slate-600">
              总金额: <span className="font-bold text-slate-900">
                ¥{items.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
              </span>
            </span>
            <span className="text-slate-600">
              税额: <span className="font-bold text-orange-600">
                ¥{items.reduce((sum, item) => sum + item.taxAmount, 0).toFixed(2)}
              </span>
            </span>
            <span className="text-slate-600">
              不含税: <span className="font-bold text-green-600">
                ¥{items.reduce((sum, item) => sum + item.preTaxAmount, 0).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


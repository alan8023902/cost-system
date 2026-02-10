import React, { useState, useRef, useEffect } from 'react';
import { lineItemApi } from '../services/apiService';
import { Plus, Trash2, Upload, Download } from 'lucide-react';

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
}

interface LineItemTableProps {
  versionId: number;
  module: 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE';
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  onRecalculate: () => void;
}

export const LineItemTable: React.FC<LineItemTableProps> = ({
  versionId,
  module,
  items,
  onItemsChange,
  onRecalculate,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (rowIndex: number, colKey: string) => {
    setEditingCell({ row: rowIndex, col: colKey });
  };

  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    const newItems = [...items];
    const item = newItems[rowIndex];
    
    // 更新单元格值
    (item as any)[colKey] = isNaN(Number(value)) ? value : Number(value);
    
    // 自动计算相关字段
    if (['quantity', 'unitPrice', 'taxRate'].includes(colKey)) {
      item.totalAmount = item.quantity * item.unitPrice;
      item.taxAmount = item.totalAmount * (item.taxRate / 100);
      item.preTaxAmount = item.totalAmount - item.taxAmount;
    }
    
    onItemsChange(newItems);
  };

  const handleCellBlur = async () => {
    setEditingCell(null);
    // 保存到后端
    try {
      await lineItemApi.batchUpdate(versionId, items);
      onRecalculate();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colKey: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const columns = ['itemName', 'specification', 'unit', 'quantity', 'unitPrice', 'taxRate', 'remarks'];
      const currentColIndex = columns.indexOf(colKey);
      
      if (e.key === 'Enter') {
        // Enter: 移动到下一行同一列
        if (rowIndex < items.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: colKey });
        } else {
          handleAddRow();
          setTimeout(() => {
            setEditingCell({ row: items.length, col: columns[0] });
          }, 100);
        }
      } else if (e.key === 'Tab') {
        // Tab: 移动到下一列
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
    
    const newItems: LineItem[] = [];
    
    rows.forEach(row => {
      const cols = row.split('\t');
      if (cols.length >= 6) {
        const item: LineItem = {
          itemName: cols[0] || '',
          specification: cols[1] || '',
          unit: cols[2] || '',
          quantity: parseFloat(cols[3]) || 0,
          unitPrice: parseFloat(cols[4]) || 0,
          taxRate: parseFloat(cols[5]) || 9,
          totalAmount: 0,
          taxAmount: 0,
          preTaxAmount: 0,
          remarks: cols[6] || '',
        };
        
        // 自动计算
        item.totalAmount = item.quantity * item.unitPrice;
        item.taxAmount = item.totalAmount * (item.taxRate / 100);
        item.preTaxAmount = item.totalAmount - item.taxAmount;
        
        newItems.push(item);
      }
    });
    
    if (newItems.length > 0) {
      const updatedItems = [...items, ...newItems];
      onItemsChange(updatedItems);
      
      // 保存到后端
      try {
        await lineItemApi.batchUpdate(versionId, updatedItems);
        onRecalculate();
        alert(`成功粘贴 ${newItems.length} 行数据`);
      } catch (error) {
        alert('保存失败：' + error);
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
    };
    onItemsChange([...items, newItem]);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    
    if (confirm(`确定删除选中的 ${selectedRows.size} 行吗？`)) {
      const newItems = items.filter((_, index) => !selectedRows.has(index));
      onItemsChange(newItems);
      setSelectedRows(new Set());
      
      // 保存到后端
      try {
        await lineItemApi.batchUpdate(versionId, newItems);
        onRecalculate();
      } catch (error) {
        alert('删除失败：' + error);
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

  const renderCell = (item: LineItem, rowIndex: number, colKey: string) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colKey;
    const value = (item as any)[colKey];
    
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type={['quantity', 'unitPrice', 'taxRate'].includes(colKey) ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleCellChange(rowIndex, colKey, e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colKey)}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          step={colKey === 'unitPrice' ? '0.01' : '1'}
        />
      );
    }
    
    // 只读显示（计算字段）
    if (['totalAmount', 'taxAmount', 'preTaxAmount'].includes(colKey)) {
      return (
        <span className="text-slate-700 font-mono">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      );
    }
    
    return (
      <div
        onDoubleClick={() => handleCellDoubleClick(rowIndex, colKey)}
        className="px-2 py-1 cursor-text hover:bg-blue-50 rounded transition-colors"
      >
        {typeof value === 'number' ? value.toFixed(2) : value || '—'}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* Toolbar */}
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

      {/* Table */}
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
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase min-w-[200px]">项目名称</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase min-w-[150px]">规格型号</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">单位</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">数量</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">单价</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">税率%</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase bg-blue-50">总金额</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase bg-blue-50">税额</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase bg-blue-50">不含税</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
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
                  <td className="px-3 py-2">{renderCell(item, index, 'itemName')}</td>
                  <td className="px-3 py-2">{renderCell(item, index, 'specification')}</td>
                  <td className="px-3 py-2">{renderCell(item, index, 'unit')}</td>
                  <td className="px-3 py-2 text-right">{renderCell(item, index, 'quantity')}</td>
                  <td className="px-3 py-2 text-right">{renderCell(item, index, 'unitPrice')}</td>
                  <td className="px-3 py-2 text-right">{renderCell(item, index, 'taxRate')}</td>
                  <td className="px-3 py-2 text-right bg-blue-50 font-medium">{renderCell(item, index, 'totalAmount')}</td>
                  <td className="px-3 py-2 text-right bg-blue-50">{renderCell(item, index, 'taxAmount')}</td>
                  <td className="px-3 py-2 text-right bg-blue-50">{renderCell(item, index, 'preTaxAmount')}</td>
                  <td className="px-3 py-2">{renderCell(item, index, 'remarks')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
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

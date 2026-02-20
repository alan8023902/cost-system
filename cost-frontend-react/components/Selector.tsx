import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
  subtitle?: string;
}

interface SelectorProps {
  value?: string | number;
  options: Option[];
  placeholder?: string;
  onChange: (value: string | number) => void;
  loading?: boolean;
  searchable?: boolean;
}

const Selector: React.FC<SelectorProps> = ({
  value,
  options,
  placeholder = '请选择',
  onChange,
  loading = false,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = searchable && searchTerm
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string | number) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full h-9 px-3 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900
                   hover:border-brand-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100
                   transition-all duration-200 flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex-1 text-left truncate">
          {loading ? (
            <span className="text-neutral-400">加载中...</span>
          ) : selectedOption ? (
            <div>
              <div className="font-medium text-neutral-900">{selectedOption.label}</div>
              {selectedOption.subtitle && (
                <div className="text-xs text-neutral-500">{selectedOption.subtitle}</div>
              )}
            </div>
          ) : (
            <span className="text-neutral-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-soft-lg animate-fade-in">
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-neutral-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索..."
                  className="w-full h-8 pl-8 pr-2 bg-neutral-50 border border-neutral-200 rounded text-sm
                           focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-neutral-400">
                {searchTerm ? '未找到匹配项' : '暂无选项'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between gap-2
                    ${value === option.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-xs text-neutral-500 truncate">{option.subtitle}</div>
                    )}
                  </div>
                  {value === option.id && (
                    <Check size={16} className="text-brand-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Selector;

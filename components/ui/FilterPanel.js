// components/ui/FilterPanel.js - 필터 패널
import React, { useState } from 'react';
import { Button, Select, Input, Card } from './DesignSystem';

export default function FilterPanel({ 
  filters = [], 
  onFilterChange,
  onReset,
  className = ""
}) {
  const [filterValues, setFilterValues] = useState({});

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    setFilterValues({});
    onReset?.();
  };

  const hasActiveFilters = Object.values(filterValues).some(value => 
    value !== '' && value !== undefined && value !== null
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">필터</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            초기화
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            
            {filter.type === 'select' && (
              <Select
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                options={[
                  { value: '', label: `모든 ${filter.label}` },
                  ...filter.options
                ]}
              />
            )}

            {filter.type === 'text' && (
              <Input
                value={filterValues[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
              />
            )}

            {filter.type === 'number' && (
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={filterValues[`${filter.key}_min`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                  placeholder="최소값"
                />
                <Input
                  type="number"
                  value={filterValues[`${filter.key}_max`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                  placeholder="최대값"
                />
              </div>
            )}

            {filter.type === 'date' && (
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={filterValues[`${filter.key}_start`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_start`, e.target.value)}
                />
                <Input
                  type="date"
                  value={filterValues[`${filter.key}_end`] || ''}
                  onChange={(e) => handleFilterChange(`${filter.key}_end`, e.target.value)}
                />
              </div>
            )}

            {filter.type === 'checkbox' && (
              <div className="space-y-2">
                {filter.options.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filterValues[filter.key] || []).includes(option.value)}
                      onChange={(e) => {
                        const currentValues = filterValues[filter.key] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter(v => v !== option.value);
                        handleFilterChange(filter.key, newValues);
                      }}
                      className="rounded mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            활성 필터: {Object.keys(filterValues).filter(key => 
              filterValues[key] !== '' && filterValues[key] !== undefined
            ).length}개
          </div>
        </div>
      )}
    </Card>
  );
}
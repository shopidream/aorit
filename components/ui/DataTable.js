// components/ui/DataTable.js - 데이터 테이블
import React, { useState } from 'react';
import { Button } from './DesignSystem';
import Pagination from './Pagination';
import SearchBox from './SearchBox';

export default function DataTable({ 
  data = [], 
  columns = [], 
  itemsPerPage = 10,
  searchable = true,
  sortable = true,
  className = ""
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 필터링
  const filteredData = searchable && searchTerm
    ? data.filter(item => 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // 정렬
  const sortedData = sortable && sortField
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // 페이지네이션
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="테이블 검색..."
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border border-gray-200 px-4 py-3 text-left font-medium text-gray-700 ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
                    {sortable && column.sortable !== false && (
                      <span className="ml-2 text-gray-400">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="border border-gray-200 px-4 py-3">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginatedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다' : '데이터가 없습니다'}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <div className="text-sm text-gray-600">
        총 {sortedData.length}개 항목 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)}개 표시
      </div>
    </div>
  );
}
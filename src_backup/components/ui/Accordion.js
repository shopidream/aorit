import React, { useState } from 'react';
import { designSystem } from '../../styles/designSystem.js';

const AccordionItem = ({ 
  title, 
  children, 
  isOpen, 
  onToggle, 
  icon, 
  badge,
  summary 
}) => {
  return (
    <div className={`${designSystem.gradients.card} border ${designSystem.colors.neutral.border} ${designSystem.radius.card} ${designSystem.shadows.card} overflow-hidden mb-4`}>
      {/* 헤더 */}
      <button
        className={`w-full p-6 text-left ${designSystem.transitions.base} hover:bg-gray-50/50 focus:outline-none focus:bg-gray-50/50`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 p-2 bg-white/80 rounded-lg">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {title}
              </h3>
              {summary && (
                <p className={`text-sm ${designSystem.colors.neutral.textLight}`}>
                  {summary}
                </p>
              )}
            </div>
            {badge && (
              <div className="flex-shrink-0">
                {badge}
              </div>
            )}
          </div>
          
          {/* 토글 화살표 */}
          <div className={`ml-4 transform ${designSystem.transitions.fast} ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* 내용 */}
      <div 
        className={`overflow-hidden ${designSystem.transitions.slow} ${
          isOpen 
            ? 'max-h-[3000px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 border-t border-gray-200/50">
          {children}
        </div>
      </div>
    </div>
  );
};

const Accordion = ({ 
  items = [], 
  allowMultiple = false, 
  defaultOpenItems = [] 
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpenItems));

  const handleToggle = (index) => {
    const newOpenItems = new Set(openItems);
    
    if (allowMultiple) {
      // 다중 선택 허용
      if (newOpenItems.has(index)) {
        newOpenItems.delete(index);
      } else {
        newOpenItems.add(index);
      }
    } else {
      // 단일 선택만 허용
      if (newOpenItems.has(index)) {
        newOpenItems.clear();
      } else {
        newOpenItems.clear();
        newOpenItems.add(index);
      }
    }
    
    setOpenItems(newOpenItems);
  };

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id || index}
          title={item.title}
          icon={item.icon}
          badge={item.badge}
          summary={item.summary}
          isOpen={openItems.has(index)}
          onToggle={() => handleToggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

// 개별 아코디언 아이템 컴포넌트 (독립적으로 사용 가능)
const SimpleAccordion = ({ 
  title, 
  children, 
  defaultOpen = false, 
  icon,
  badge,
  summary,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <AccordionItem
        title={title}
        icon={icon}
        badge={badge}
        summary={summary}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      >
        {children}
      </AccordionItem>
    </div>
  );
};

export default Accordion;
export { SimpleAccordion, AccordionItem };
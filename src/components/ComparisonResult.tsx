import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface ComparisonItem {
  menu_html: string;
  caption_html: string;
  price_html: string;
  menuid_html: string;
  tax_html?: string;
  is_same_set: boolean;
  diff_menu: number;
  diff_caption: number;
  diff_price: number;
  diff_menuid: number;
}

interface ComparisonResultProps {
  result: ComparisonItem[];
}

export const ComparisonResult: React.FC<ComparisonResultProps> = ({ result }) => {
  if (result.length === 0) return null;

  const columns = ['menu_html', 'caption_html', 'price_html', 'menuid_html', 'tax_html'];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead key={column}>
              {column === 'tax_html' ? (
                <div className="flex items-center space-x-1">
                  <span>{column.replace('_html', '')}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>テレシスはプログラムで全て税込表示になってるので赤でも気にしないでください</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                column.replace('_html', '')
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.map((item, index) => (
          <TableRow key={index}>
            {columns.map(column => {
              const diffColumn = `diff_${column.replace('_html', '')}` as keyof ComparisonItem;
              let isDifferent = item[diffColumn] !== 0;
              
              if (column === 'menuid_html') {
                isDifferent = item.diff_menuid !== 0;
              } else if (column === 'tax_html') {
                isDifferent = item.tax_html !== '税込';
              }

              const cellContent = item[column as keyof ComparisonItem];
              const displayContent = cellContent !== undefined && cellContent !== null ? cellContent : '';

              return (
                <TableCell 
                  key={column} 
                  className={isDifferent ? 'bg-red-100' : 'bg-green-100'}
                >
                  <div 
                    className={isDifferent ? 'text-red-800' : 'text-green-800'}
                    dangerouslySetInnerHTML={{ __html: displayContent as string }}
                  />
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
'use client'

import React, { useState } from 'react';
import { ComparisonForm } from '@/components/ComparisonForm';
import { ComparisonResult } from '@/components/ComparisonResult';

type ComparisonItem = {
  menu_html: string;
  caption_html: string;
  price_html: string;
  diff_menu: number;
  diff_caption: number;
  diff_price: number;
};

type ComparisonResultType = ComparisonItem[];

export default function CheckCSV() {
  const [results, setResults] = useState<Record<string, ComparisonResultType | null>>({
    toppage: null,
    supervisor: null,
    astrology: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (company: string, htmls: Record<string, string>, csv: File) => {
    setIsLoading(true);
    const newResults: Record<string, ComparisonResultType | null> = { ...results };

    for (const [type, html] of Object.entries(htmls)) {
      if (html) {
        const formData = new FormData();
        formData.append('company', company);
        formData.append('html', html);
        formData.append('csv', csv);

        try {
          const response = await fetch(`/api/compare/${type}`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            throw new Error(`An error occurred while processing the ${type} request.`);
          }
          const data = await response.json();
          newResults[type] = data;
        } catch (error) {
          console.error(`Error in ${type}:`, error);
          newResults[type] = null;
        }
      } else {
        newResults[type] = null;
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const handleReset = () => {
    setResults({
      toppage: null,
      supervisor: null,
      astrology: null,
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">CSV Comparison Tool</h1>
      <ComparisonForm onSubmit={handleSubmit} onReset={handleReset} isLoading={isLoading} />
      {Object.entries(results).map(([type, result]) => (
        result && (
          <div key={type} className="mt-8">
            <h2 className="text-2xl font-bold mb-4">{type.charAt(0).toUpperCase() + type.slice(1)} Comparison Result:</h2>
            <ComparisonResult result={result} />
          </div>
        )
      ))}
    </div>
  );
}
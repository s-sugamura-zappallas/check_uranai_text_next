// app/check-toppage/page.tsx
'use client'

import React, { useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ComparisonItem {
  menu_html: string;
  caption_html: string;
  price_html: number;
  is_same_set: boolean;
  diff_menu: number;
  diff_caption: number;
  diff_price: number;
}

type ComparisonResult = ComparisonItem[];

const companies = ['rsa', 'zap']; // 会社名の配列

export default function CheckToppage() {
  const [selectedCompany, setSelectedCompany] = useState<string | undefined>(companies[0]);
  const [html, setHtml] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
  };

  const handleHtmlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtml(event.target.value);
  };

  const handleCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCsvFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !html || !csvFile) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append('company', selectedCompany);
    formData.append('html', html);
    formData.append('csv', csvFile);

    try {
      const response = await fetch('/api/compare/toppage', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error("An error occurred while processing the request.");
      }
      const data = await response.json();
      setResult(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  const handleReset = () => {
    setSelectedCompany(companies[0]);
    setHtml('');
    setCsvFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Top Page Comparison</h1>

      <div className="space-y-6">
        <div>
          <label htmlFor="company" className="block mb-2 font-bold">Company:</label>
          <Select onValueChange={handleCompanyChange} value={selectedCompany}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="html" className="block mb-2 font-bold">HTML:</label>
          <Textarea
            id="html"
            value={html}
            onChange={handleHtmlChange}
            className="w-full"
            rows={6}
          />
        </div>

        <div>
          <label htmlFor="csv" className="block mb-2 font-bold">CSV File:</label>
          <Input
            type="file"
            id="csv"
            accept=".csv"
            onChange={handleCsvChange}
            ref={fileInputRef}
          />
        </div>

        <div className="flex space-x-4">
          <Button onClick={handleSubmit}>Compare</Button>
          <Button onClick={handleReset} variant="outline">Reset</Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Comparison Result:</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>menu_html</TableHead>
                  <TableHead>caption_html</TableHead>
                  <TableHead>price_html</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className={item.diff_menu === 0 ? 'bg-green-100' : 'bg-red-100'}>
                      <div className={item.diff_menu === 0 ? 'text-green-800' : 'text-red-800'}>
                        {item.menu_html}
                      </div>
                    </TableCell>
                    <TableCell className={item.diff_caption === 0 ? 'bg-green-100' : 'bg-red-100'}>
                      <div className={item.diff_caption === 0 ? 'text-green-800' : 'text-red-800'}>
                        {item.caption_html}
                      </div>
                    </TableCell>
                    <TableCell className={item.diff_price === 0 ? 'bg-green-100' : 'bg-red-100'}>
                      <div className={item.diff_price === 0 ? 'text-green-800' : 'text-red-800'}>
                        {item.price_html}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
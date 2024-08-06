"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react"; // Lucideアイコンを使用
import { cn } from "@/lib/utils"; // tailwind-mergeを使用するためのユーティリティ関数

type Company = 'rsa' | 'zap' | 'tel' | 'com';

interface CheckResult {
  title: string;
  text: string;
  duplication: string;
  relevance: string;
  relevanceReason: string;
}

interface ApiResult {
  smallMenu: string;
  content: string;
  duplication: string;
  relevance: string;
  relevanceReason: string;
}

const CheckResultPage: React.FC = () => {
  const [html, setHtml] = useState<string>('');
  const [company, setCompany] = useState<Company>('rsa');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCheck = async () => {
    if (!html.trim()) {
      setError('HTMLを入力してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compare/resultpage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, company }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const data = await response.json();
      if (!data || !data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format');
      }
      
      const formattedResults = data.results.map((item: ApiResult) => ({
        title: item.smallMenu,
        text: item.content,
        duplication: item.duplication,
        relevance: item.relevance,
        relevanceReason: item.relevanceReason
      }));
      
      setResults(formattedResults);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setHtml('');
    setResults([]);
    setError(null);
  };

  const getCellStyle = (type: 'duplication' | 'relevance', value: string) => {
    if (type === 'duplication') {
      return value === '重複あり' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    } else if (type === 'relevance') {
      switch (value.toLowerCase()) {
        case 'high': return 'bg-green-100 text-green-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-red-100 text-red-800';
        default: return '';
      }
    }
    return '';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">チェック結果ページ</h1>
      <div className="mb-4">
        <Select onValueChange={(value) => setCompany(value as Company)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="会社を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rsa">RSA</SelectItem>
            <SelectItem value="zap">ZAP</SelectItem>
            <SelectItem value="tel">TEL</SelectItem>
            <SelectItem value="com">COM</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        className="w-full h-40 mb-4"
        placeholder="HTMLを入力してください"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex space-x-2 mb-4">
        <Button onClick={handleCheck} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            'チェック'
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>リセット</Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">データを取得中...</span>
        </div>
      )}
      {!isLoading && results.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>テキスト</TableHead>
              <TableHead>重複</TableHead>
              <TableHead>関連性</TableHead>
              <TableHead>理由</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{result.title}</TableCell>
                <TableCell>{result.text}</TableCell>
                <TableCell className={cn(getCellStyle('duplication', result.duplication))}>
                  {result.duplication}
                </TableCell>
                <TableCell className={cn(getCellStyle('relevance', result.relevance))}>
                  {result.relevance}
                </TableCell>
                <TableCell className={cn(getCellStyle('relevance', result.relevance))}>
                  {result.relevanceReason}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CheckResultPage;
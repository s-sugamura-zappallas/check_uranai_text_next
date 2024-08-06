// app/check-inputpage/page.tsx
'use client'

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CompareResult {
    index_input: number;
    sub_title_input: string;
    check_order: string;
    check_text: boolean;
}

interface PageDataComparison {
  input: {
    main_title: { value: string; matchesNavText: boolean; matchesBreadcrumb: boolean };
    nav_text: { value: string; matchesMainTitle: boolean; matchesBreadcrumb: boolean };
    breadcrumb: { value: string; matchesMainTitle: boolean; matchesNavText: boolean };
  };
  result: {
    main_title: { value: string; matchesNavText: boolean; matchesBreadcrumb: boolean };
    nav_text: { value: string; matchesMainTitle: boolean; matchesBreadcrumb: boolean };
    breadcrumb: { value: string; matchesMainTitle: boolean; matchesNavText: boolean };
  };
  matches: {
    main_title: boolean;
    nav_text: boolean;
    breadcrumb: boolean;
  };
}

export default function CheckInputPage() {
    const [inputHtml, setInputHtml] = useState('');
    const [resultHtml, setResultHtml] = useState('');
    const [company, setCompany] = useState('rsa');
    const [subTitleComparison, setSubTitleComparison] = useState<CompareResult[]>([]);
    const [pageDataComparison, setPageDataComparison] = useState<PageDataComparison | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('company', company);
            formData.append('input_html', inputHtml);
            formData.append('result_html', resultHtml);

            const response = await fetch('/api/compare/inputpage', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error("An error occurred while processing the request.");
            }
            const data = await response.json();
            setSubTitleComparison(data.subTitleComparison);
            setPageDataComparison(data.pageDataComparison);
        } catch (error) {
            console.error('Error comparing input pages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderCell = (value: string, isMatch: boolean | null) => (
        <TableCell className={isMatch === null ? '' : isMatch ? 'bg-green-200' : 'bg-red-200'}>
            {value}
        </TableCell>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Input Page Comparison</h1>
            <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                <div>
                    <label htmlFor="company" className="block mb-2 font-bold">Company:</label>
                    <Select onValueChange={setCompany} value={company}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rsa">rsa</SelectItem>
                            <SelectItem value="zap">zap</SelectItem>
                            <SelectItem value="tel">tel</SelectItem>
                            <SelectItem value="com">com</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="inputHtml" className="block mb-2 font-bold">Input HTML:</label>
                    <Textarea
                        id="inputHtml"
                        value={inputHtml}
                        onChange={(e) => setInputHtml(e.target.value)}
                        className="w-full"
                        rows={5}
                    />
                </div>
                <div>
                    <label htmlFor="resultHtml" className="block mb-2 font-bold">Result HTML:</label>
                    <Textarea
                        id="resultHtml"
                        value={resultHtml}
                        onChange={(e) => setResultHtml(e.target.value)}
                        className="w-full"
                        rows={5}
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Comparing...
                        </>
                    ) : (
                        'Compare'
                    )}
                </Button>
            </form>
            {isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {pageDataComparison && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Page Data Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead></TableHead>
                                            <TableHead>Main Title</TableHead>
                                            <TableHead>Nav Text</TableHead>
                                            <TableHead>Breadcrumb</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-semibold">Input</TableCell>
                                            {renderCell(pageDataComparison.input.main_title.value, null)}
                                            {renderCell(pageDataComparison.input.nav_text.value, pageDataComparison.input.nav_text.matchesMainTitle)}
                                            {renderCell(pageDataComparison.input.breadcrumb.value, pageDataComparison.input.breadcrumb.matchesMainTitle)}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-semibold">Result</TableCell>
                                            {renderCell(pageDataComparison.result.main_title.value, null)}
                                            {renderCell(pageDataComparison.result.nav_text.value, pageDataComparison.result.nav_text.matchesMainTitle)}
                                            {renderCell(pageDataComparison.result.breadcrumb.value, pageDataComparison.result.breadcrumb.matchesMainTitle)}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                    {subTitleComparison.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sub Title Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sub Title Input</TableHead>
                                            <TableHead>Check Order</TableHead>
                                            <TableHead>Check Text</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subTitleComparison.map((item, index) => (
                                            <TableRow
                                                key={index}
                                                className={`${item.check_order === 'Item Missing or Created with Image' ||
                                                    item.check_text === false
                                                    ? 'bg-red-200'
                                                    : item.check_order === 'Next Item Missing or Created with Image'
                                                        ? 'bg-yellow-200'
                                                        : 'bg-green-200'
                                                    }`}
                                            >
                                                <TableCell>{item.sub_title_input}</TableCell>
                                                <TableCell>{item.check_order}</TableCell>
                                                <TableCell>{item.check_text ? 'True' : 'False'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
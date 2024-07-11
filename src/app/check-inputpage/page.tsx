// app/check-inputpage/page.tsx
'use client'

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CompareResult {
    index_input: number;
    sub_title_input: string;
    check_order: string;
    check_text: boolean;
}

export default function CheckInputPage() {
    const [inputHtml, setInputHtml] = useState('');
    const [resultHtml, setResultHtml] = useState('');
    const [company, setCompany] = useState('rsa');
    const [compareResult, setCompareResult] = useState<CompareResult[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setCompareResult(data);
        } catch (error) {
            console.error('Error comparing input pages:', error);
        }
    };

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
                <Button type="submit">Compare</Button>
            </form>
            {compareResult.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sub Title Input</TableHead>
                            <TableHead>Check Order</TableHead>
                            <TableHead>Check Text</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {compareResult.map((item, index) => (
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
            )}
        </div>
    );
}
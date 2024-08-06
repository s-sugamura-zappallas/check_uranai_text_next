import React, { useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface ComparisonFormProps {
  onSubmit: (company: string, htmls: Record<string, string>, csv: File) => void;
  onReset: () => void;
  isLoading: boolean;
}

const companies = ['rsa', 'zap', 'tel', 'com'];
const htmlTypes = ['toppage', 'supervisor', 'astrology'];

export const ComparisonForm: React.FC<ComparisonFormProps> = ({ onSubmit, onReset, isLoading }) => {
  const [selectedCompany, setSelectedCompany] = useState<string>(companies[0]);
  const [htmls, setHtmls] = useState<Record<string, string>>({
    toppage: '',
    supervisor: '',
    astrology: '',
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHtmlChange = (type: string, value: string) => {
    setHtmls(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = () => {
    if (!selectedCompany || !csvFile || Object.values(htmls).every(html => !html)) {
      setError("Please select a company, upload a CSV file, and fill in at least one HTML field.");
      return;
    }
    setError(null);
    onSubmit(selectedCompany, htmls, csvFile);
  };

  const handleReset = () => {
    setSelectedCompany(companies[0]);
    setHtmls({ toppage: '', supervisor: '', astrology: '' });
    setCsvFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="company" className="block mb-2 font-bold">Company:</label>
        <Select onValueChange={setSelectedCompany} value={selectedCompany}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>{company}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {htmlTypes.map((type) => (
          <div key={type}>
            <label htmlFor={type} className="block mb-2 font-bold">{type.charAt(0).toUpperCase() + type.slice(1)} HTML:</label>
            <Textarea
              id={type}
              value={htmls[type]}
              onChange={(e) => handleHtmlChange(type, e.target.value)}
              className="w-full"
              rows={6}
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="csv" className="block mb-2 font-bold">CSV File:</label>
        <Input
          type="file"
          id="csv"
          accept=".csv"
          onChange={(e) => e.target.files && setCsvFile(e.target.files[0])}
          ref={fileInputRef}
        />
      </div>

      <div className="flex space-x-4">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            'Compare'
          )}
        </Button>
        <Button onClick={handleReset} variant="outline" disabled={isLoading}>Reset</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
// app/api/compare/toppage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { csvToDataFrame } from '@/utils/dataFrameUtils';
import { htmlToDataFrameRsa, htmlToDataFrameZap, htmlToDataFrameTel, htmlToDataFrameCom } from '@/utils/htmlToDataFrame';
import { compareToppage } from '@/utils/compareLogic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const html = formData.get('html') as string;
    const csvFile = formData.get('csv') as File;

    const htmlToDataFrameFunctions = {
      rsa: htmlToDataFrameRsa,
      zap: htmlToDataFrameZap,
      tel: htmlToDataFrameTel,
      com: htmlToDataFrameCom
    };

    const htmlToDataFrameFunction = htmlToDataFrameFunctions[company as keyof typeof htmlToDataFrameFunctions];
    
    if (!htmlToDataFrameFunction) {
      throw new Error(`Unsupported company: ${company}`);
    }

    const htmlDf = htmlToDataFrameFunction(html);

    const csvContent = await csvFile.text();
    const csvDf = csvToDataFrame(csvContent);

    const comparisonResult = compareToppage(htmlDf, csvDf);

    return NextResponse.json(comparisonResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
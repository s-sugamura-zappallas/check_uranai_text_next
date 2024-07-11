// app/api/compare/inputpage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface SubTitle {
  index: number;
  subTitle: string;
}

function inputHtmlToDfRsa(htmlStr: string): SubTitle[] {
  const $ = cheerio.load(htmlStr);
  const subTitles: SubTitle[] = [];
  
  $('section#subMenuTitleLists div.submenu_title > p').each((index, element) => {
    subTitles.push({
      index: index + 1,
      subTitle: $(element).text().trim()
    });
  });

  return subTitles;
}

function resultHtmlToDfRsa(htmlStr: string): SubTitle[] {
  const $ = cheerio.load(htmlStr);
  const subTitles: SubTitle[] = [];
  
  $('div[class^="result_subheading"]').each((index, element) => {
    const pText = $(element).find('p').text().trim();
    subTitles.push({
      index: index + 1,
      subTitle: pText
    });
  });

  return subTitles;
}

function compareInputpage(inputDf: SubTitle[], resultDf: SubTitle[]) {
  const result = inputDf.map((input, index) => {
    let checkOrder = '';
    let checkText = false;

    const inputSubtitle = input.subTitle;
    const nextInputSubtitle = index < inputDf.length - 1 ? inputDf[index + 1].subTitle : null;

    const resultIndex = resultDf.findIndex(result => result.subTitle === inputSubtitle);
    const nextResultIndex = nextInputSubtitle ? resultDf.findIndex(result => result.subTitle === nextInputSubtitle) : -1;

    if (resultIndex === -1) {
      checkOrder = 'Item Missing or Created with Image';
    } else if (nextInputSubtitle && nextResultIndex === -1) {
      checkOrder = 'Next Item Missing or Created with Image';
    } else if (nextInputSubtitle && resultIndex > nextResultIndex) {
      checkOrder = 'Mismatched Items';
    }

    checkText = resultDf.some(result => result.subTitle === inputSubtitle);

    return {
      index_input: input.index,
      sub_title_input: inputSubtitle,
      check_order: checkOrder,
      check_text: checkText
    };
  });

  return result;
}

export async function POST(request: NextRequest) {
  console.log("Received POST request to /api/compare/inputpage");
  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const inputHtml = formData.get('input_html') as string;
    const resultHtml = formData.get('result_html') as string;

    console.log(`Received data: company=${company}, input_html=${inputHtml.substring(0, 50)}, result_html=${resultHtml.substring(0, 50)}`);

    let inputDf: SubTitle[];
    let resultDf: SubTitle[];

    if (company === 'rsa') {
      inputDf = inputHtmlToDfRsa(inputHtml);
      resultDf = resultHtmlToDfRsa(resultHtml);
    } else if (company === 'zap') {
      // Implement ZAP logic here
      throw new Error('ZAP company not implemented yet');
    } else {
      throw new Error(`Unsupported company: ${company}`);
    }

    const comparisonResult = compareInputpage(inputDf, resultDf);
    return NextResponse.json(comparisonResult);
  } catch (error) {
    console.error('Error in compare_inputpage_endpoint:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
import { DataFrame as ImportedDataFrame } from '@/utils/dataFrameUtils';
import { DataFrame } from '@/utils/htmlToDataFrame';

interface HtmlItem {
  menu: string;
  caption: string;
  price: number;
  menuid: string;
  isTax: boolean;
}

interface ComparisonResult {
  menu_html: string;
  caption_html: string;
  price_html: number;
  menuid_html: string;
  is_same_set: boolean;
  diff_menu: number;
  diff_caption: number;
  diff_price: number;
  diff_menuid: number;
  tax_html?: string;
}

function parsePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const cleaned = price.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  console.log(`parsePrice: ${price} -> ${parsed}`);
  return isNaN(parsed) ? 0 : parsed;
}

function isSameSet(htmlItem: HtmlItem, csvDf: ImportedDataFrame): boolean {
  const combinedHtml = `${htmlItem.menu}${htmlItem.caption}${htmlItem.price}`;
  const result = csvDf['menu_csv'].some((menu, j) => 
    `${menu}${csvDf['caption_csv']?.[j] || ''}${parsePrice(csvDf['price_csv']?.[j] || 0)}` === combinedHtml
  );
  console.log(`isSameSet: ${JSON.stringify(htmlItem)} -> ${result}`);
  return result;
}

function compareFields(htmlItem: HtmlItem, csvDf: ImportedDataFrame): { [key: string]: number } {
  const diffs = {
    menu: 1,
    caption: 1,
    price: 1,
    menuid: 1
  };

  for (let j = 0; j < csvDf['menu_csv'].length; j++) {
    if (htmlItem.menu === csvDf['menu_csv'][j]) diffs.menu = 0;
    if (htmlItem.caption === (csvDf['caption_csv']?.[j] || '')) diffs.caption = 0;
    if (htmlItem.menu === csvDf['menu_csv'][j] || htmlItem.caption === (csvDf['caption_csv']?.[j] || '')) {
      if (htmlItem.price === parsePrice(csvDf['price_csv']?.[j] || 0)) diffs.price = 0;
    }
    if (htmlItem.menuid === (csvDf['menu_id_csv']?.[j] || '')) diffs.menuid = 0;
  }

  console.log(`compareFields: ${JSON.stringify(htmlItem)} -> ${JSON.stringify(diffs)}`);
  return diffs;
}

export function compareToppage(htmlDf: DataFrame, csvDf: ImportedDataFrame): ComparisonResult[] {
  console.log('compareToppage: Starting comparison');
  if (!htmlDf || !csvDf || !Array.isArray(htmlDf['menu_html']) || !Array.isArray(csvDf['menu_csv'])) {
    console.error('compareToppage: Invalid input data structure');
    throw new Error('Invalid input data structure');
  }

  const results = htmlDf['menu_html'].map((menu, i) => {
    const htmlItem: HtmlItem = {
      menu: menu || '',
      caption: htmlDf['caption_html']?.[i] || '',
      price: parsePrice(htmlDf['price_html']?.[i] as string | number),
      menuid: htmlDf['menuid_html']?.[i] || '',
      isTax: htmlDf['is_tax']?.[i] || false
    } as HtmlItem;
    
    console.log(`Processing item: ${JSON.stringify(htmlItem)}`);

    const isSameSetResult = isSameSet(htmlItem, csvDf);
    const diffs = isSameSetResult ? { menu: 0, caption: 0, price: 0, menuid: 0 } : compareFields(htmlItem, csvDf);

    const resultItem: ComparisonResult = {
      menu_html: htmlItem.menu,
      caption_html: htmlItem.caption,
      price_html: htmlItem.price,
      menuid_html: htmlItem.menuid,
      is_same_set: isSameSetResult,
      diff_menu: diffs.menu,
      diff_caption: diffs.caption,
      diff_price: diffs.price,
      diff_menuid: diffs.menuid
    };

    if (htmlItem.isTax) {
      resultItem.tax_html = '税込';
    }

    console.log(`Comparison result: ${JSON.stringify(resultItem)}`);
    return resultItem;
  });

  console.log(`compareToppage: Completed comparison, ${results.length} items processed`);
  return results;
}
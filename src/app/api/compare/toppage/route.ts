// app/api/compare/toppage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'papaparse';
import * as cheerio from 'cheerio';

// 必要な型定義
type DataFrame = {
  [key: string]: any[];
};

// CSVをDataFrameに変換する関数
function csvToDataFrame(csvContent: string): DataFrame {
  const { data } = parse(csvContent, { header: true });
  const df: DataFrame = {
    'menu_csv': [],
    'caption_csv': [],
    'price_csv': []
  };

  data.forEach((row: any) => {
    df['menu_csv'].push(row['メニュー名']);
    df['caption_csv'].push(row['キャプション']);
    df['price_csv'].push(row['金額(税込)']);
  });

  return df;
}

// HTMLをDataFrameに変換する関数 (RSA版)
function htmlToDataFrameRsa(htmlStr: string): DataFrame {
  const $ = cheerio.load(htmlStr);
  const df: DataFrame = {
    'menu_html': [],
    'caption_html': [],
    'price_html': []
  };

  $('.appraisal_menu').each((_, elem) => {
    const menuName = $(elem).find('a p').text().trim();
    const caption = $(elem).find('p.description').text().trim();
    const priceStr = $(elem).find('p.price span').text().trim();
    const price = parseInt(priceStr.replace(/[^\d]/g, ''));

    df['menu_html'].push(menuName);
    df['caption_html'].push(caption);
    df['price_html'].push(price);
  });

  return df;
}

// HTMLをDataFrameに変換する関数 (ZAP版)
function htmlToDataFrameZap(htmlStr: string): DataFrame {
  const $ = cheerio.load(htmlStr);
  const df: DataFrame = {
    'menu_html': [],
    'caption_html': [],
    'price_html': []
  };

  $('.severalmenu').each((_, elem) => {
    const menuName = $(elem).find('.menu_info h3').text().trim();
    const caption = $(elem).find('p.caption').text().trim();
    let price = 0;
    const priceInfo = $(elem).find('p.price_info, div.price_info, div.price_normal').first();
    if (priceInfo.length) {
      const priceStr = priceInfo.text().trim();
      price = parseInt(priceStr.replace(/[^\d]/g, ''));
    }

    df['menu_html'].push(menuName);
    df['caption_html'].push(caption);
    df['price_html'].push(price);
  });

  return df;
}

// 比較ロジック
function compareToppage(htmlDf: DataFrame, csvDf: DataFrame) {
  const result: any[] = [];

  for (let i = 0; i < htmlDf['menu_html'].length; i++) {
    const menuHtml = htmlDf['menu_html'][i];
    const captionHtml = htmlDf['caption_html'][i];
    const priceHtml = htmlDf['price_html'][i];

    const combinedHtml = `${menuHtml}${captionHtml}${priceHtml}`;
    const isSameSet = csvDf['menu_csv'].some((menu, j) => 
      `${menu}${csvDf['caption_csv'][j]}${csvDf['price_csv'][j]}` === combinedHtml
    );

    let diffMenu = 1;
    let diffCaption = 1;
    let diffPrice = 1;

    if (!isSameSet) {
      for (let j = 0; j < csvDf['menu_csv'].length; j++) {
        if (menuHtml === csvDf['menu_csv'][j]) diffMenu = 0;
        if (captionHtml === csvDf['caption_csv'][j]) diffCaption = 0;
        if (menuHtml === csvDf['menu_csv'][j] || captionHtml === csvDf['caption_csv'][j]) {
          if (parseFloat(priceHtml) === parseFloat(csvDf['price_csv'][j])) diffPrice = 0;
        }
      }
    } else {
      diffMenu = 0;
      diffCaption = 0;
      diffPrice = 0;
    }

    result.push({
      menu_html: menuHtml,
      caption_html: captionHtml,
      price_html: priceHtml,
      is_same_set: isSameSet,
      diff_menu: diffMenu,
      diff_caption: diffCaption,
      diff_price: diffPrice
    });
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const html = formData.get('html') as string;
    const csvFile = formData.get('csv') as File;

    let htmlDf;
    if (company === 'rsa') {
      htmlDf = htmlToDataFrameRsa(html);
    } else if (company === 'zap') {
      htmlDf = htmlToDataFrameZap(html);
    } else {
      throw new Error(`Unsupported company: ${company}`);
    }

    const csvContent = await csvFile.text();
    const csvDf = csvToDataFrame(csvContent);

    const comparisonResult = compareToppage(htmlDf, csvDf);

    return NextResponse.json(comparisonResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
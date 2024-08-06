import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Anthropic from "@anthropic-ai/sdk";
import { LRUCache } from 'lru-cache';

// TextBlock型の定義
type TextBlock = {
  type: 'text';
  text: string;
};

type ExtractionStrategy = {
  sectionSelector: string;
  titleSelector: string;
  textSelector: string;
  clientSelector: string;
  partnerSelector: string;
  titleProcessor: (element: cheerio.Cheerio<cheerio.Element>) => string;
  contentValidator: (content: string, $element: cheerio.Cheerio<cheerio.Element>) => boolean;
  clientProcessor?: (text: string) => string;
  partnerProcessor?: (text: string) => string;
};

const extractionStrategies: Record<string, ExtractionStrategy> = {
  zap: {
    sectionSelector: '.section_bdy, .article_bdy',
    titleSelector: 'h1, h2, h3, h4, h5, h6',
    textSelector: '.detail_txt p:first-child',
    clientSelector: '.basic_info p',
    partnerSelector: '.info_other p',
    titleProcessor: (element: cheerio.Cheerio<cheerio.Element>) => {
      let title = element.text().trim();
      const imgInTitle = element.find('img');
      if (imgInTitle.length > 0) {
        const altText = imgInTitle.attr('alt');
        title = altText?.trim() || title;
      }
      return title;
    },
    contentValidator: (content: string) => !content.endsWith('……'),
  },
  rsa: {
    sectionSelector: 'section',
    titleSelector: 'div.result_subheading_background_center p',
    textSelector: 'div.result_description_background_center',
    clientSelector: '#profileDisplaySection > div:first-child > p',
    partnerSelector: '#profileDisplaySection > div:nth-child(2) > p',
    titleProcessor: (element: cheerio.Cheerio<cheerio.Element>) => element.text().trim(),
    contentValidator: (content: string, $element: cheerio.Cheerio<cheerio.Element>) => 
      !content.endsWith('……') && $element.find('style, script').length === 0,
    clientProcessor: (text: string) => text.split('&emsp;')[0].trim(),
    partnerProcessor: (text: string) => text.split('&emsp;')[0].trim(),
  },
  tel: {
    sectionSelector: 'div.res_bg.clearfix',
    titleSelector: 'div#komidashi',
    textSelector: 'div.res_sub_box p',
    clientSelector: 'div.my_name span#nickname',
    partnerSelector: 'div.you_name span#nickname2',
    titleProcessor: (element: cheerio.Cheerio<cheerio.Element>) => element.text().trim(),
    contentValidator: (content: string) => !content.endsWith('……'),
    clientProcessor: (text: string) => text.trim(),
    partnerProcessor: (text: string) => text.trim(),
  },
  com: {
    sectionSelector: 'div.result_content[class*="frame"]',
    titleSelector: 'div.result_cont_ttl span',
    textSelector: 'div.center',
    clientSelector: '', // クライアント名のセレクターを追加する必要があります
    partnerSelector: '', // パートナー名のセレクターを追加する必要があります
    titleProcessor: (element: cheerio.Cheerio<cheerio.Element>) => element.text().trim(),
    contentValidator: (content: string) => !content.endsWith('……'),
    // クライアントとパートナーの名前を抽出する処理を追加する必要があります
  },
};

const extractDataFromHTML = (html: string, company: string): { title: string; content: string; clientName: string; partnerName: string }[] => {
  const $ = cheerio.load(html);

  const strategy = extractionStrategies[company as keyof typeof extractionStrategies];
  if (!strategy) {
    throw new Error(`Unsupported company: ${company}`);
  }

  // クライアントとパートナーの名前を抽出
  const clientElement = $(strategy.clientSelector).first();
  const partnerElement = $(strategy.partnerSelector).first();

  const clientName = strategy.clientProcessor ? 
    strategy.clientProcessor(clientElement.text()) : 
    clientElement.text().trim().split(/\s+/)[0]; // 最初の単語（名前）のみを取得

  const partnerName = strategy.partnerProcessor ? 
    strategy.partnerProcessor(partnerElement.text()) : 
    partnerElement.text().trim().split(/\s+/)[0]; // 最初の単語（名前）のみを取得

  console.log('Extracted client and partner names:', { clientName, partnerName });

  const result: { title: string; content: string; clientName: string; partnerName: string }[] = [];

  $(strategy.sectionSelector).each((_, section) => {
    const $section = $(section);
    const titleElement = $section.find(strategy.titleSelector);
    const contentElement = $section.find(strategy.textSelector);

    const title = strategy.titleProcessor(titleElement);
    const content = contentElement.text().trim();

    if (title && content && strategy.contentValidator(content, contentElement)) {
      result.push({ title, content, clientName, partnerName });
    }
  });

  console.log(`Extracted data for ${company}:`, result);
  return result;
};

const checkDuplication = (data: { title: string; content: string; clientName: string; partnerName: string }[]): { title: string; content: string; clientName: string; partnerName: string; duplication: string }[] => {
  const contentSet = new Set<string>();
  return data.map(item => ({
    ...item,
    duplication: contentSet.has(item.content) ? '重複あり' : '重複なし'
  }));
};

// キャッシュの設定
const relevanceCache = new LRUCache<string, { title_content_relevance: string; reason: string }>({
  max: 100, // キャッシュするアイテムの最大数
  ttl: 1000 * 60 * 60, // キャッシュの有効期限（1時間）
});

const analyzeRelevance = async (title: string, content: string, clientName: string, partnerName: string): Promise<{ title_content_relevance: string; reason: string }> => {
  const cacheKey = `${title}:${content}:${clientName}:${partnerName}`;
  const cachedResult = relevanceCache.get(cacheKey);
  
  if (cachedResult) {
    console.log('Using cached relevance analysis');
    return cachedResult;
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `<instruction>
あなたのタスクはtitleとcontentの関連度が高いか確認することです
関連度はtitleの内���がcontentにちゃんと記載されていれば高くなります。
ユーザーに出す本番用の文章なので少しでも違和感を感じたら忌憚なく厳しく判断してください
</instruction>

<attention>
 - 渡される文章は占いのテキストです
${clientName ? ` - 相談者は${clientName}` : ''}
${partnerName ? ` - 相性を占う相手は${partnerName}` : ''}
${clientName ? ` - 文章中に出てくる「あなた」は${clientName}のことを指しています` : ''}
${partnerName ? ` - 文章中に出てくる「あの人」は${partnerName}のことを指しています` : ''}
</attention>

<output>
json形式で下記のフォーマットで出力して
 - title_content_relevance(high、medium、low)
 - reason(そう判断した理由。箇条書きにしない)
</output>`;

  const userPrompt = `title: ${title}\ncontent: ${content}`;

  console.log('AI Prompt:', { systemPrompt, userPrompt });

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1000,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt
          }
        ]
      }
    ]
  });

  const responseText = msg.content
    .filter((block): block is TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  let response;
  try {
    response = JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('Invalid AI response format');
  }

  if (!response.title_content_relevance || !response.reason) {
    console.error('Invalid AI response structure:', response);
    throw new Error('Invalid AI response structure');
  }

  const result = {
    title_content_relevance: response.title_content_relevance,
    reason: response.reason
  };

  relevanceCache.set(cacheKey, result);
  return result;
};

export async function POST(request: NextRequest) {
  try {
    const { html, company } = await request.json();

    if (!html || !company) {
      return NextResponse.json({ error: 'Missing html or company in request body' }, { status: 400 });
    }

    const extractedData = extractDataFromHTML(html, company);
    const dataWithDuplication = checkDuplication(extractedData);

    const resultsWithAnalysis = await Promise.all(dataWithDuplication.map(async item => {
      try {
        const analysis = await analyzeRelevance(item.title, item.content, item.clientName, item.partnerName);
        return {
          smallMenu: item.title,
          content: item.content,
          duplication: item.duplication,
          relevance: analysis.title_content_relevance,
          relevanceReason: analysis.reason,
          clientName: item.clientName,
          partnerName: item.partnerName,
        };
      } catch (error) {
        console.error(`Error analyzing relevance for item: ${item.title}`, error);
        return {
          smallMenu: item.title,
          content: item.content,
          duplication: item.duplication,
          relevance: 'error',
          relevanceReason: 'Failed to analyze relevance',
          clientName: item.clientName,
          partnerName: item.partnerName,
        };
      }
    }));

    console.log('Data sent to frontend:', JSON.stringify(resultsWithAnalysis, null, 2));

    return NextResponse.json({ results: resultsWithAnalysis });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
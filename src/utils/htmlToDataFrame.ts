import * as cheerio from 'cheerio';

export interface DataFrame {
  [key: string]: (string | number | boolean)[];
}

interface HtmlToDataFrameOptions {
  menuSelector: string;
  menuNameSelector: string;
  captionSelector: string;
  priceSelector: string;
  menuIdExtractor: (elem: cheerio.Cheerio<cheerio.Element>) => string;
  priceMultiplier?: number;
}

export function createHtmlToDataFrame(options: HtmlToDataFrameOptions) {
  return function(htmlStr: string): DataFrame {
    const $ = cheerio.load(htmlStr);
    const df: DataFrame = {
      'menu_html': [],
      'caption_html': [],
      'price_html': [],
      'menuid_html': [],
      'is_tax': []
    };

    console.log(`Total menu items found: ${$(options.menuSelector).length}`);

    $(options.menuSelector).each((index, elem) => {
      const $elem = $(elem);
      const menuName = $elem.find(options.menuNameSelector).text().trim();
      const caption = $elem.find(options.captionSelector).text().trim();
      const priceStr = $elem.find(options.priceSelector).text().trim();
      let price = priceStr ? parseInt(priceStr.replace(/[^\d]/g, '')) : 0;

      if (options.priceMultiplier) {
        price = Math.round(price * options.priceMultiplier);
      }

      const isTaxIncluded = priceStr.includes('税込');
      const menuId = options.menuIdExtractor($elem as cheerio.Cheerio<cheerio.Element>);

      // デバッグ情報を出力
      console.log(`Item ${index + 1}:`);
      console.log(`  Menu Name: ${menuName}`);
      console.log(`  Caption: ${caption}`);
      console.log(`  Price: ${price} (Original: ${priceStr})`);
      console.log(`  Menu ID: ${menuId}`);
      console.log(`  Tax Included: ${isTaxIncluded}`);
      console.log('---');

      df['menu_html'].push(menuName);
      df['caption_html'].push(caption);
      df['price_html'].push(price);
      df['menuid_html'].push(menuId);
      df['is_tax'].push(isTaxIncluded);
    });

    console.log('DataFrame summary:');
    for (const key in df) {
      console.log(`  ${key}: ${df[key].length} items`);
    }

    return df;
  };
}

// 各会社用のhtmlToDataFrame関数を作成
export const htmlToDataFrameRsa = createHtmlToDataFrame({
  menuSelector: '.appraisal_menu, .appraisal-menu',
  menuNameSelector: 'a p',
  captionSelector: 'p.description',
  priceSelector: 'p.price span',
  menuIdExtractor: ($elem) => {
    const menuLink = $elem.find('a').attr('href') || '';
    return menuLink.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  }
});

export const htmlToDataFrameZap = createHtmlToDataFrame({
  menuSelector: '.severalmenu',
  menuNameSelector: '.menu_info h1, .menu_info h2, .menu_info h3, .menu_info h4, .menu_info h5, .menu_info h6',
  captionSelector: 'p.caption',
  priceSelector: 'p.price_info, div.price_info, div.price_normal',
  menuIdExtractor: ($elem) => {
    // .severalmenu 内または親要素のリンクを探す
    const menuLink = $elem.find('a').first().attr('href') || $elem.closest('a').attr('href') || '';
    
    // リンクからIDを抽出、リンクがない場合は空文字列を返す
    return menuLink.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  }
});

export const htmlToDataFrameTel = createHtmlToDataFrame({
    menuSelector: '#HEAD .new_box',
    menuNameSelector: 'a.menu_title_text',
    captionSelector: 'p.text2',
    priceSelector: 'div.price_box p.price_non',
    menuIdExtractor: ($elem) => {
      const menuLink = $elem.find('a.menu_title_text').attr('href') || '';
      return menuLink.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    },
    priceMultiplier: 1.1
  });

export const htmlToDataFrameCom = createHtmlToDataFrame({
  menuSelector: '.inbox, .listbox',
  menuNameSelector: '.top_menu_name a, p.ttl a',
  captionSelector: 'p.list_text',
  priceSelector: '.price span, div.list_price span',
  menuIdExtractor: ($elem) => {
    const menuUrl = $elem.find('a').attr('href') || '';
    return menuUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  }
});
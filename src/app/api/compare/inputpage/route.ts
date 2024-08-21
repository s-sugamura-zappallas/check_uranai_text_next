// app/api/compare/inputpage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface SubTitle {
  index: number;
  subTitle: string;
}

interface PageData {
  nav_text: string;
  breadcrumb: string;
  main_title: string;
}

interface CompanyConfig {
  inputExtractor: (htmlStr: string) => SubTitle[];
  resultExtractor: (htmlStr: string) => SubTitle[];
  inputPageDataExtractor: (htmlStr: string) => PageData;
  resultPageDataExtractor: (htmlStr: string) => PageData;
}

const companyConfigs: Record<string, CompanyConfig> = {
  rsa: {
    inputExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('section#subMenuTitleLists div.submenu_title > p, section#subMenuTitleLists div.submenu_titile > p').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    resultExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div[class^="result_subheading"], div[class^="result-subheading-background-center"]').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).find('p').text().trim()
      })).get();
    },
    inputPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('#topicpath p')
          .contents()
          .filter(function() {
            return this.nodeType === 3 && $(this).prev().is('a');
          })
          .last()
          .text()
          .trim()
          .replace(/^>\s*/, ''),
        main_title: $('div[class*="content-menu-title-background-center"], div[class*="content_menu_title_background_center"], div[class*="content-menu_title-background_center"]').find('p').text().trim(),
      };
    },
    resultPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('#topicpath a').last().text().trim(),
        main_title: $('div[class*="content-menu-title-background-center"], div[class*="content_menu_title_background_center"], div[class*="content-menu_title-background_center"]').first().find('p').text().trim(),
      };
    },
  },
  zap: {
    inputExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div.section_hdr h3').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    resultExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('.section_bdy h1, .section_bdy h2, .section_bdy h3, .section_bdy h4, .section_bdy h5, .section_bdy h6, .article_bdy h1, .article_bdy h2, .article_bdy h3, .article_bdy h4, .article_bdy h5, .article_bdy h6').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    inputPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: 'プログラムで制御',
        main_title: $('div.menu_title h2').text().trim(),
      };
    },
    resultPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('div#topicpath a').last().text().trim(),
        main_title: $('div.menu_title h2').text().trim(),
      };
    },
  },
  tel: {
    inputExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div.item_box div.inp_list_box3 p').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    resultExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div.res_bg.clearfix div#komidashi').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    inputPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('#breadname').text().trim(),
        main_title: $('#menu_title').text().trim(),
      };
    },
    resultPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('a.link_pan').last().text().trim(),
        main_title: $('h3.menu_title_text').text().trim(),
      };
    },
  },
  com: {
    inputExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div.menu_sub.menu_02 span').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    resultExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return $('div.result_content[class*="frame"] div.result_cont_ttl span').map((index, element) => ({
        index: index + 1,
        subTitle: $(element).text().trim()
      })).get();
    },
    inputPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('#pankuzu').contents().filter(function() {
          return this.nodeType === 3;
        }).last().text().trim().replace(/^>\s*/, ''),
        main_title: $('.top_menu_name').text().trim().replace(/^>\s*/, ''),
      };
    },
    resultPageDataExtractor: (htmlStr) => {
      const $ = cheerio.load(htmlStr);
      return {
        nav_text: $('.contents_headerCopy').text().trim(),
        breadcrumb: $('#pankuzu a').last().text().trim(),
        main_title: $('.top_menu_name').text().trim(),
      };
    },
  },
};

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

function comparePageData(inputData: PageData, resultData: PageData) {
  return {
    input: {
      main_title: {
        value: inputData.main_title,
        matchesNavText: inputData.main_title === inputData.nav_text,
        matchesBreadcrumb: inputData.main_title === inputData.breadcrumb,
      },
      nav_text: {
        value: inputData.nav_text,
        matchesMainTitle: inputData.nav_text === inputData.main_title,
        matchesBreadcrumb: inputData.nav_text === inputData.breadcrumb,
      },
      breadcrumb: {
        value: inputData.breadcrumb,
        matchesMainTitle: inputData.breadcrumb === inputData.main_title,
        matchesNavText: inputData.breadcrumb === inputData.nav_text,
      },
    },
    result: {
      main_title: {
        value: resultData.main_title,
        matchesNavText: resultData.main_title === resultData.nav_text,
        matchesBreadcrumb: resultData.main_title === resultData.breadcrumb,
      },
      nav_text: {
        value: resultData.nav_text,
        matchesMainTitle: resultData.nav_text === resultData.main_title,
        matchesBreadcrumb: resultData.nav_text === resultData.breadcrumb,
      },
      breadcrumb: {
        value: resultData.breadcrumb,
        matchesMainTitle: resultData.breadcrumb === resultData.main_title,
        matchesNavText: resultData.breadcrumb === resultData.nav_text,
      },
    },
    matches: {
      main_title: inputData.main_title === resultData.main_title,
      nav_text: inputData.nav_text === resultData.nav_text,
      breadcrumb: inputData.breadcrumb === resultData.breadcrumb,
    },
  };
}

export async function POST(request: NextRequest) {
  console.log("Received POST request to /api/compare/inputpage");
  try {
    const formData = await request.formData();
    const company = formData.get('company') as string;
    const inputHtml = formData.get('input_html') as string;
    const resultHtml = formData.get('result_html') as string;

    console.log(`Received data: company=${company}`);
    console.log(`Input HTML preview: ${inputHtml.substring(0, 100)}...`);
    console.log(`Result HTML preview: ${resultHtml.substring(0, 100)}...`);

    const config = companyConfigs[company];
    if (!config) {
      throw new Error(`Unsupported company: ${company}`);
    }
    console.log(`Config found for company: ${company}`);

    const inputDf = config.inputExtractor(inputHtml);
    console.log(`Input subtitles extracted:`, inputDf);

    const resultDf = config.resultExtractor(resultHtml);
    console.log(`Result subtitles extracted:`, resultDf);

    const inputPageData = config.inputPageDataExtractor(inputHtml);
    console.log(`Input page data extracted:`, inputPageData);

    const resultPageData = config.resultPageDataExtractor(resultHtml);
    console.log(`Result page data extracted:`, resultPageData);

    const subTitleComparison = compareInputpage(inputDf, resultDf);
    console.log(`Subtitle comparison result:`, subTitleComparison);

    const pageDataComparison = comparePageData(inputPageData, resultPageData);
    console.log(`Page data comparison result:`, pageDataComparison);

    const response = {
      subTitleComparison,
      pageDataComparison,
    };
    console.log(`Sending response:`, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in compare_inputpage_endpoint:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
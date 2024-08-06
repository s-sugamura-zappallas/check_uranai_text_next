import { parse } from 'csv-parse/sync'; // csvパーサーをインポート

// 必要な型定義
export type DataFrame = {
  [key: string]: (string | number)[];
};

// CSVをDataFrameに変換する関数
export function csvToDataFrame(csvContent: string): DataFrame {
  const data = parse(csvContent, { columns: true, skip_empty_lines: true });
  const df: DataFrame = {
    'menu_id_csv': [],  // メニューIDを追加
    'menu_csv': [],
    'caption_csv': [],
    'price_csv': []
  };

  data.forEach((row: Record<string, string>) => {
    df['menu_id_csv'].push(row['メニューID'] || '');  // メニューIDを追加
    df['menu_csv'].push(row['メニュー名'] || '');
    df['caption_csv'].push(row['キャプション'] || '');
    df['price_csv'].push(parseInt(row['金額(税込)'] || '0', 10));
  });

  return df;
}
---
title: "縦横比を変数で渡す .ratio-16x9 の仕組み"
description: "Bootstrap の [class*=ratio-] は、aspect-ratio に --bs-ratio の値を渡す。ratio-16x9 などのクラスは変数だけを書き換えるので、画像や動画の枠の比率を一行で決められる。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [904, 921]
function: "\"[class*=ratio-], .ratio-16x9\""
difficulty: 2
format: 2
tags: [レイアウト, 設計パターン]
---
## ひとことで

画像や動画の枠の縦横比（比率）を、`ratio-16x9` のようなクラス名で決める仕組みです。属性セレクタ `[class*=ratio-]` が共通の規則を当てて、それぞれのクラスは変数の値だけを書き換えます。枠の高さを計算しなくても、決まった比率の箱になります。

## コード

```css:line-numbers=904
  [class*=ratio-] {
    aspect-ratio: var(--bs-ratio);
  }
  .ratio-auto {
    --bs-ratio: auto;
  }
  .ratio-1x1 {
    --bs-ratio: 1 / 1;
  }
  .ratio-4x3 {
    --bs-ratio: 4 / 3;
  }
  .ratio-16x9 {
    --bs-ratio: 16 / 9;
  }
  .ratio-21x9 {
    --bs-ratio: 21 / 9;
  }
```

## 前提知識

- **aspect-ratio**: 要素の幅と高さの比率を指定するプロパティです。`16 / 9` は、幅 16、高さ 9 の比率を表します。
- **縦横比（アスペクト比）**: 幅と高さの比率のことです。動画は 16:9、写真は 4:3 などがよく使われます。
- **属性セレクタ `*=`**: 属性の値の中に、指定した文字列を含むものに一致する書き方です。`[class*=ratio-]` は、class に `ratio-` を含む要素に一致します。
- **CSS 変数**: `--bs-ratio` のように、値を名前で渡して、別の宣言から読み出す仕組みです。

## 何をしているか

### 1. 共通の規則を一度だけ書く

```css:line-numbers=904
  [class*=ratio-] {
    aspect-ratio: var(--bs-ratio);
  }
```

`[class*=ratio-]` は、class に `ratio-` を含むすべての要素に `aspect-ratio: var(--bs-ratio)` を当てます。比率の値は、変数から読まれます。

### 2. クラスは変数だけを決める

```css:line-numbers=907
  .ratio-auto {
    --bs-ratio: auto;
  }
  .ratio-1x1 {
    --bs-ratio: 1 / 1;
  }
  .ratio-4x3 {
    --bs-ratio: 4 / 3;
  }
  .ratio-16x9 {
    --bs-ratio: 16 / 9;
  }
  .ratio-21x9 {
    --bs-ratio: 21 / 9;
  }
```

`ratio-16x9` は `--bs-ratio: 16 / 9` だけを書きます。`ratio-1x1`、`ratio-4x3`、`ratio-21x9` も同じで、比率の値が違うだけです。共通の規則は一つで済み、比率のクラスは値を渡す役割になっています。

## ここがすごい

- 比率を決めるクラスを増やすとき、共通の宣言を書き直す必要がありません。変数だけを足せば、新しい比率も同じ仕組みで動きます。
- 高さを計算して `padding-top` で比率を作る古い方法と比べて、`aspect-ratio` は数字を一つ書くだけで済みます。
- 素直に、各比率のクラスに `aspect-ratio` を直接書くと、同じ宣言が何度も並びます。変数に分けると、違いが値だけになります。
- `ratio-auto` は、比率を決めずに、中身の大きさに任せる値です。同じ仕組みの中で、比率のない場合も扱えます。

## まとめ

- `aspect-ratio` で、枠の縦横比を直接指定できます。
- 属性セレクタで共通の規則をまとめると、クラスは値だけになります。
- 比率の違いを変数の値にすると、仕組みを増やさずに種類を増やせます。

---
title: "入力欄に入ったとき外側に青い輪を出す"
description: "Water.css は input・select・button・textarea がフォーカスされたとき、box-shadow で 2px の青みがかった輪を外側に描く。枠の位置を変えずに、選択中の場所を示す。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [133, 138]
function: "\"input:focus, select:focus, button:focus, textarea:focus\""
difficulty: 2
format: 2
tags: [フォーム, アクセシビリティ]
---
## ひとことで

Water.css は、キーボードやクリックで選ばれた入力欄やボタンの周りに、薄い青の輪を描きます。どの部品にいまフォーカスがあるかを、はっきり示すための指定です。

## コード

```css:line-numbers=133
input:focus,
select:focus,
button:focus,
textarea:focus {
  box-shadow: 0 0 0 2px #0096bfab;
}
```

## 前提知識

- **:focus**: 要素が操作の対象として選ばれている状態を表す疑似クラスです。Tab キーで移動したときにも当たります。
- **box-shadow**: 要素の外側に影や輪を描くプロパティです。ブラウザの既定の輪郭とは別に、輪を付けられます。
- **枠の位置を動かさない**: 影は、レイアウトの大きさを変えません。輪を付けても、周りの要素がずれることはありません。

## 何をしているか

### 1. 対象の部品

```css:line-numbers=133
input:focus,
select:focus,
button:focus,
textarea:focus {
```

input、select、button、textarea の四つで、フォーカスされたものを選びます。文字を入力する欄も、押す部品も、同じ印で示されます。

### 2. 輪を描く

```css:line-numbers=137
  box-shadow: 0 0 0 2px #0096bfab;
```

影の広がりを 2px、色を半透明の青にします。外側に細い輪が出て、選択中の場所が分かります。

## ここがすごい

既定の輪郭線を消す指定と組み合わせることで、ブラウザごとに違う輪郭の見た目を、一つの表現にそろえています。

キーボードで操作する人にとって、今どの部品が選ばれているかは、画面を読み進める上で欠かせない情報です。ブラウザの既定の輪郭は、見た目が一定しないことがあるため、影で輪を描いて統一できます。輪が外側にあるため、部品の大きさが変わらず、周りのレイアウトに影響しないことも利点です。

## まとめ

box-shadow で外側に輪を描くと、フォーカスの印を、レイアウトを崩さずに示せます。

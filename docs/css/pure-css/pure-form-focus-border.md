---
title: "入力欄にフォーカスしたとき枠の色を変える"
description: "Pure CSS の .pure-form textarea:focus は、フォーカスされた入力欄の既定の輪郭を消し、枠の色を青に変える。今どこに入力しているかを、色の変化で示す書き方。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/forms/css/forms.css
lines: [70, 73]
function: "\".pure-form textarea:focus\""
difficulty: 2
format: 2
tags: [フォーム, アクセシビリティ]
---
## ひとことで

Pure CSS は、入力欄にカーソルが入ったときに、枠の色を青に変えます。ブラウザの既定の輪郭を消し、代わりに枠線で入力中の場所を示しています。

## コード

```css:line-numbers=70
.pure-form textarea:focus {
    outline: 0;
    border-color: #129FEA;
}
```

## 前提知識

- **:focus**: 要素がキーボードや操作で選ばれているときに当たる疑似クラスです。入力欄では、カーソルが入っている状態を表します。
- **outline**: 要素の外側に描く輪郭線です。ブラウザは既定でフォーカス時に輪郭を描きます。
- **border-color**: 枠線の色だけを変えるプロパティです。枠の太さや形はそのままです。

## 何をしているか

### 1. 輪郭を消す

```css:line-numbers=71
    outline: 0;
```

`outline: 0` で、ブラウザ既定の輪郭線を消しています。二重の線が出ないように、代わりの表示を枠線で作ります。

### 2. 枠の色を変える

```css:line-numbers=72
    border-color: #129FEA;
```

`border-color` に青を指定し、フォーカスされた欄の枠を目立たせます。

## ここがすごい

フォーカス中の欄だけ色を変えるため、今どの欄が選ばれているかを、一目で伝えられます。枠の太さは変えないので、レイアウトがずれません。

枠の色だけを変えると、欄の大きさは変わりません。周りの文字が動かないので、入力中に画面がちらつきません。輪郭線を消す場合は、色の差が背景に対して十分かどうかを、確かめておく必要があります。枠の色を変える仕組みは、キーボード操作の人にも、入力中の場所を伝える手がかりになります。

## まとめ

outline を消して border-color で示すと、入力中の場所が分かりやすくなります。ただし、輪郭を消す場合は、色の差が十分に見えるかを確かめる必要があります。

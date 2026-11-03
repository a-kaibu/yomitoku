---
title: "透明な輪郭線で強制表示モードでも線を残す"
description: "Tachyons の .outline-transparent は、outline を透明の 1px 線にする。通常は見えないが、Windows の強制カラーモードでは線が見えるようになり、枠の位置を崩さない工夫。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_outlines.css
lines: [12, 13]
function: "\".outline, .outline-transparent\""
difficulty: 2
format: 2
tags: [アクセシビリティ, 配色]
---
## ひとことで

Tachyons の `.outline-transparent` は、普段は見えない透明な輪郭線を付けるクラスです。`outline` を通常の線に変えると、見た目が変わるため、その差を避けるために使われます。

## コード

```css:line-numbers=12
.outline { outline: 1px solid; }
.outline-transparent { outline: 1px solid transparent; }
```

## 前提知識

- **outline**: 要素の外側に描く線です。枠線と違い、要素の大きさを変えません。
- **transparent**: 色を完全に透明にする指定です。線は引かれていても、目には見えません。
- **強制カラーモード**: Windows の高いコントラスト表示などで、ブラウザが色を上書きする仕組みです。この中では、透明な色も既定の色に置き換えられることがあります。

## 何をしているか

### 1. 通常の輪郭線

```css:line-numbers=12
.outline { outline: 1px solid; }
```

`.outline` は、黒い 1px の輪郭線を付けます。普段の見た目でも、線がはっきり見えます。

### 2. 透明な輪郭線

```css:line-numbers=13
.outline-transparent { outline: 1px solid transparent; }
```

`.outline-transparent` は、同じ 1px の輪郭線を透明にします。線の場所は確保されたまま、見た目には何も描かれません。

## ここがすごい

輪郭線の太さと位置は、透明でも通常の線と同じです。そのため、ホバーや選択のときに、線を出すだけで、画面の位置がずれません。

輪郭線が透明でも、要素の周りに同じ幅の空間が取られます。そのため、線を付けたときに文字や箱が押し出されることがありません。強制カラーモードでは、透明な線が既定の色に置き換えられ、枠として見えるようになります。ここでは、普段の見た目を変えずに、支援技術の利用者にも輪郭を届ける工夫が読み取れます。

## まとめ

透明な outline は、普段は見えず、必要なときだけ線を描く、位置を崩さない仕組みです。

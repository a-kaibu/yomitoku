---
title: "チェックボックスの輪郭を青い細線で示す"
description: "Pure CSS は、ファイル・ラジオ・チェックボックスにフォーカスしたとき、枠ではなく outline で青い細線を描く。枠の形を持たない部品にも、選択中の印を付ける工夫。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/forms/css/forms.css
lines: [84, 89]
function: "\".pure-form input[type=checkbox]:focus\""
difficulty: 2
format: 2
tags: [フォーム, アクセシビリティ]
---
## ひとことで

Pure CSS は、ファイル選択、ラジオボタン、チェックボックスにフォーカスしたときに、青い細い輪郭線を描きます。これらの部品は、枠線を付けにくいので、輪郭で選択中を示しています。

## コード

```css:line-numbers=84
.pure-form input[type="file"]:focus,
.pure-form input[type="radio"]:focus,
.pure-form input[type="checkbox"]:focus {
    outline: thin solid #129FEA;
    outline: 1px auto #129FEA;
}
```

## 前提知識

- **outline**: 要素の周りに描く線です。枠線と違い、レイアウトの大きさを変えません。
- **auto の輪郭**: `outline: 1px auto` と書くと、ブラウザが見やすい形の輪郭を描きます。角の丸みや色の扱いを、ブラウザに任せられます。
- **フォーカス**: キーボードで操作中の要素が受け取る状態です。Tab キーで移動したときに、どこを操作しているかを示す役割があります。

## 何をしているか

### 1. 古いブラウザ向けの指定

```css:line-numbers=87
    outline: thin solid #129FEA;
```

`thin solid` の指定を先に書いています。`auto` に対応しないブラウザでも、輪郭が描かれるようにするための予備です。

### 2. 新しい書き方で上書き

```css:line-numbers=88
    outline: 1px auto #129FEA;
```

`1px auto` を後に書き、対応するブラウザでは、ブラウザ本来の見やすい輪郭を使います。同じプロパティを二度書くことで、古い環境と新しい環境の両方に対応しています。

## ここがすごい

予備の宣言を先に、本命を後に書く、古典的なフォールバックの形です。対応の差を、一つのルールの中で吸収しています。

## まとめ

outline を使えば、枠のない部品にも選択の印を付けられます。古い指定を予備にする書き方も、覚えておく価値があります。

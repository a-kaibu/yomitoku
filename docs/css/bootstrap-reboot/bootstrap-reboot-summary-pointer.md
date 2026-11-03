---
title: "details の summary を指の形にして、リストの記号を戻す"
description: "Bootstrap の Reboot は summary の display を list-item にして、開閉の見出しをクリックできることを示す cursor: pointer を付ける。ブラウザごとの見出しの表示をそろえる指定。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [842, 845]
function: "summary"
difficulty: 2
format: 2
tags: [移植性, 可読性]
---
## ひとことで

開閉できる `details` の見出し `summary` に、`display: list-item` と `cursor: pointer` を指定するルールです。`list-item` にすると、見出しが項目として描かれ、ブラウザによって違う表示が揃います。`pointer` は、クリックできることを指の形で示します。

## コード

```css:line-numbers=842
  summary {
    display: list-item;
    cursor: pointer;
  }
```

## 前提知識

- **details と summary**: 中身を開閉できる HTML 要素と、その見出しです。閉じているときは見出しだけが見えます。
- **display: list-item**: 要素をリストの項目として描く指定です。項目の前に、開閉の記号を付けられます。
- **cursor: pointer**: マウスを乗せたとき、指の形にするカーソルです。
- **既定の表示のばらつき**: `summary` の表示は、ブラウザによって描き方が違うことがあります。

## 何をしているか

### 1. 見出しをリストの項目として描く

```css:line-numbers=843
    display: list-item;
```

`display: list-item` で、`summary` をリストの項目として描きます。これにより、開閉の記号が、ブラウザに関わらず同じ場所に出やすくなります。

### 2. 指の形で、クリックできることを示す

```css:line-numbers=844
    cursor: pointer;
```

`cursor: pointer` で、見出しにマウスを乗せると指の形になります。`details` は、クリックで開閉する部品なので、そのことを形で示します。

## ここがすごい

- 二つの指定で、表示の揃えとカーソルの形という、見た目と操作の両方を扱っています。
- `summary` の見た目を、ライブラリが決めてしまうのではなく、ブラウザの項目の描き方に任せています。
- 素直に `summary { display: block; }` と書くと、開閉の記号が消えることがあります。`list-item` なら、記号の役割が残ります。
- 同じブロックの中で、入力欄のメールや URL にも同じ表示の指定を並べ、入力の部品の見た目をそろえています。

## まとめ

- `details` の見出しは、`display: list-item` で項目として描けます。
- `cursor: pointer` で、クリックできることが伝わります。
- ブラウザの既定の表示に合わせて、必要な指定だけを足します。

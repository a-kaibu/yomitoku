---
title: "複数選択の select の見出しと字下げを元に戻す"
description: "multiple や size を持つ select の optgroup を太字にし、その中の option に 20px の左の余白を付ける。リセットで消えた見出しの強調と字下げを、必要な場面だけ戻す。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [263, 265]
function: "\":where(select:is([multiple], [size])) optgroup\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 設計パターン]
---
## ひとことで

全体のリセットで消えてしまった、`optgroup`（選択肢のグループ）の太字と、中の `option` の字下げを、複数選択のリストに限って戻すルールです。普通の選択メニューでは効かず、一度に複数の項目を見せる形の `select` だけで効きます。

## コード

```css:line-numbers=263
:where(select:is([multiple], [size])) optgroup {
  font-weight: bolder;
}
```

## 前提知識

- **select 要素**: 選択肢から一つを選ぶ HTML 要素です。`multiple` 属性を付けると、複数の選択ができます。`size` 属性を付けると、一度に見える項目の数が決まります。
- **optgroup 要素**: 選択肢をグループにまとめる HTML 要素です。グループの名前は太字で表示されるのが、ブラウザの既定です。
- **option 要素**: 選択肢の一つ一つの項目です。
- **:is()**: 括弧の中の条件のどれかに一致する要素を選ぶ疑似クラスです。
- **padding-inline-start**: 文字の書き始め側の余白です。横書きでは左、縦書きでは上になります。

## 何をしているか

### 1. 複数選択のリストに限定する

```css:line-numbers=263
:where(select:is([multiple], [size])) optgroup {
  font-weight: bolder;
}
```

`:where(select:is([multiple], [size])) optgroup` は、`multiple` または `size` の属性を持つ `select` の中の `optgroup` だけに一致します。`:where()` で詳細度はゼロになっているので、利用者が後から太さを変えられます。

太字にする理由は、前のリセットで `font-weight: inherit` のように、見出しの太さを消しているためです。その消した分を、ここで戻しています。

### 2. 項目の字下げを戻す

```css:line-numbers=271
:where(select:is([multiple], [size])) optgroup option {
  padding-inline-start: 20px;
}
```

グループの中の `option` には、左の余白 `20px` を付けます。これで、グループに属する項目が、グループの名前より少し奥に並びます。普通の選択メニューでは、この表示はされないので、特別な場面に限った指定です。

## ここがすごい

- 「普通の select では必要ない」と判断して、対象を複数選択と大きな表示に限定しています。リセットの影響を、見せる必要がある場面だけに戻しています。
- `:where()` を使うことで、詳細度を増やさずに、利用者が上書きできます。
- 素直に `optgroup` を一律に太字にすると、普通の選択メニューの見た目が変わってしまいます。条件を付けることで、その副作用を防げます。
- 字下げを `padding-inline-start` で書くので、縦書きのページでも正しい側に余白が入ります。

## まとめ

- リセットで消した見た目は、必要な場面にだけ戻すと安全です。
- `:where()` と属性の条件で、対象を限定できます。
- 論理的な余白の指定は、書字方向が変わっても正しく働きます。

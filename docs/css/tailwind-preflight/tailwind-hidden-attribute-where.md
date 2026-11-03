---
title: "hidden 属性を詳細度ゼロで隠し、until-found だけは残す"
description: "[hidden] に :where と :not を組み合わせ、hidden='until-found' 以外の場合だけ display: none !important を当てる。利用者のスタイルを優先しつつ、検索で見つかる折りたたみを壊さない書き方。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [396, 398]
function: "\"[hidden]:where(:not([hidden='until-found']))\""
difficulty: 3
format: 2
tags: [防御的プログラミング, 設計パターン]
---
## ひとことで

HTML の `hidden` 属性が付いた要素を隠すルールです。ただし、値が `until-found` のときは隠しません。`until-found` は、ブラウザのページ内検索で見つかったときだけ開く、特別な隠し方です。このルールは、それを壊さないように条件を付けています。

## コード

```css:line-numbers=396
[hidden]:where(:not([hidden='until-found'])) {
  display: none !important;
}
```

## 前提知識

- **hidden 属性**: 要素を表示しない HTML 属性です。`hidden` だけでなく、値として `until-found` を持つこともできます。
- **until-found**: ブラウザのページ内検索にだけ開く、折りたたみの値です。検索で見つかると、自動で中身が表示されます。
- **display: none !important**: 要素を表示しなくし、ほかの指定より優先させる指定です。`!important` は、利用者の指定すら上書きするほどの強さです。
- **:where() と :not()**: `:not()` で条件を否定し、`:where()` でその詳細度をゼロにする組み合わせです。

## 何をしているか

### 1. 特別な値を除く

```css:line-numbers=396
[hidden]:where(:not([hidden='until-found'])) {
```

`:not([hidden='until-found'])` は、属性の値が `until-found` ではない要素に一致します。`:where()` の中にあるので、この条件の詳細度はゼロです。

### 2. 通常の hidden だけを隠す

```css:line-numbers=397
  display: none !important;
```

一致した要素には `display: none !important` が当たり、隠されます。`!important` を付けているのは、`display` を別の値に変える利用者の指定があっても、`hidden` の意味を守るためです。

## ここがすごい

- `:where()` と `!important` の組み合わせで、「隠す」の意味を強く守りながら、利用者が `until-found` を選べるようにしています。二つの相反する要求を、一つのルールで両立させています。
- 値が `until-found` のときの見た目を、ブラウザの仕組みに任せています。ページ内検索で開く仕組みを、CSS が邪魔しません。
- 素直に `[hidden] { display: none; }` と書くと、`until-found` の検索機能が効かなくなります。条件を付けることで、この問題を防げます。
- 詳細度がゼロなので、利用者が `display` を上書きしたいときは、`!important` なしで指定することもできます。

## まとめ

- `hidden` 属性は通常は要素を隠しますが、値によって扱いが違います。
- `:not()` で条件を付けると、特別な値だけを例外にできます。
- `!important` は、「隠す」の意味を守るための強い指定です。
- 詳細度をゼロにすると、利用者が後から変えやすくなります。

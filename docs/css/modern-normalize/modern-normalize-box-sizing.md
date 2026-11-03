---
title: "幅の計算を楽にする box-sizing の全要素指定"
description: "padding と border を幅に含めるよう、すべての要素と疑似要素に box-sizing: border-box を指定する。CSS リセットの定番の一行。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [12, 16]
function: "*, ::before, ::after"
difficulty: 1
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

ページ内のすべての要素と、その `::before` `::after` という疑似要素に対して `box-sizing: border-box` を指定する、たった一つのルールです。ブラウザの既定値は `content-box` で、`width` は中身だけの幅を表します。これを `border-box` に切り替えると、`width` の値に padding と border が含まれるようになり、レイアウトの計算がずっと単純になります。

## コード

```css:line-numbers=12
*,
::before,
::after {
	box-sizing: border-box;
}
```

## 前提知識

- **box-sizing**: 要素の `width` と `height` が何を指すかを決めるプロパティです。`content-box`（既定値）は中身だけ、`border-box` は padding と border も含めた箱全体を指します。
- **ユニバーサルセレクタ `*`**: ページ上のすべての要素に一致するセレクタです。
- **疑似要素 `::before` と `::after`**: 要素の中の前後に、CSS だけで作られる仮想の箱です。HTML には存在しませんが、箱としてサイズや余白を持てます。
- **継承**: 親要素に書いた値が子要素に自動で伝わる仕組みです。`box-sizing` は標準では継承されません。

## 何をしているか

### 1. すべての要素と疑似要素をまとめて指定する

```css:line-numbers=12
*,
::before,
::after {
	box-sizing: border-box;
}
```

`*` はページ内のすべての要素にマッチします。ただし `*` は疑似要素にはマッチしないため、`::before` と `::after` を同じ宣言の中に並べて書いています。この 3 つを並べるだけで、ページ内の箱がすべて同じ計算方法になります。

### 2. 数字で確かめる

幅 `200px`、左右の padding がそれぞれ `20px`、border が `2px` の箱を考えます。`content-box` では、`width` は中身の幅だけを表すので、見た目の幅は 200 + 20 + 20 + 2 + 2 = 244px になります。

`border-box` では、`width: 200px` が padding と border を含む箱全体の幅になります。見た目の幅は 200px のままで、中身の幅は 156px に自動で縮みます。ボタンを横に 3 つ並べるときなど、「幅 33% の箱を 3 つ並べたら折り返した」という事故が起きにくくなるのは、この性質のおかげです。

### 3. 継承に頼らず直接指定する

`box-sizing` は継承されない性質なので、`html` に 1 回だけ書いて子孫に `inherit` で伝える書き方もよく使われます。このコードは、そうせずに全要素へ直接指定しています。コメントにもあるとおり、継承させないことを前提にしたうえで、どの要素も同じ値になることを確実にするための選択です。

## ここがすごい

- 1 行のルールで、ページ全体の幅の計算方法を統一できます。要素ごとに `box-sizing` を書き分ける必要がありません。
- 疑似要素まで含めているのが細かい点です。`*` だけだと、`::before` や `::after` で作った装飾の箱は `content-box` のままになってしまいます。
- 素直に書くなら、要素ごとに `box-sizing: border-box` を書くか、`html` に指定して子孫に `inherit` で伝える形になります。前者は書き忘れが起きやすく、後者は途中の要素が値を変えると継承の流れが崩れます。全要素に直接書く形は、そうした心配がありません。
- トレードオフもあります。一部のライブラリは `content-box` を前提に幅を計算しているため、ライブラリ同士の組み合わせで見た目が変わることがあります。

## まとめ

- `box-sizing` の既定値は `content-box` で、`width` には中身の幅だけが入ります。
- `border-box` にすると、`width` に padding と border が含まれるので、幅の計算が直感どおりになります。
- `*` は疑似要素にマッチしないので、`::before` と `::after` を明示します。
- 継承に頼らず全要素に直接指定すると、途中で値が変わる心配がなくなります。

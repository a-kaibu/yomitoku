---
title: "表示のきっかけを hover・focus・visible の三つにまとめる"
description: ":hover と :focus、data-balloon-visible の属性のどれかで吹き出しを表示する。マウスとキーボードと JavaScript の三つの入り口を一つのルールで扱う。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [44, 46]
function: "\":hover と data-balloon-visible で表示\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 設計パターン]
---
## ひとことで

マウスを乗せたとき、キーボードでフォーカスしたとき、または `data-balloon-visible` という属性が付いたとき、吹き出しを表示するルールです。表示のきっかけが三つあるので、どの方法で操作しても同じ吹き出しが出ます。

## コード

```css:line-numbers=44
  [aria-label][data-balloon-pos]:hover:before, [aria-label][data-balloon-pos]:hover:after, [aria-label][data-balloon-pos][data-balloon-visible]:before, [aria-label][data-balloon-pos][data-balloon-visible]:after, [aria-label][data-balloon-pos]:not([data-balloon-nofocus]):focus:before, [aria-label][data-balloon-pos]:not([data-balloon-nofocus]):focus:after {
    opacity: 1;
    pointer-events: none; }
```

## 前提知識

- **:hover**: マウスカーソルが要素の上にあるときに一致する疑似クラスです。
- **:focus**: キーボードの Tab キーなどで、要素が操作の対象になったときに一致する疑似クラスです。
- **data-balloon-visible**: 吹き出しを強制的に表示するための独自の属性です。JavaScript から付け外しできます。
- **opacity**: 要素の透明度です。`1` で不透明、`0` で透明になります。

## 何をしているか

### 1. 三つの表示のきっかけをつなぐ

```css:line-numbers=44
  [aria-label][data-balloon-pos]:hover:before, [aria-label][data-balloon-pos]:hover:after, [aria-label][data-balloon-pos][data-balloon-visible]:before, [aria-label][data-balloon-pos][data-balloon-visible]:after, [aria-label][data-balloon-pos]:not([data-balloon-nofocus]):focus:before, [aria-label][data-balloon-pos]:not([data-balloon-nofocus]):focus:after {
    opacity: 1;
    pointer-events: none; }
```

セレクタの中で、`:hover:before`、`:hover:after`、`[data-balloon-visible]:before`、`[data-balloon-visible]:after` などを、カンマで並べています。どれか一つでも一致すれば、`opacity: 1` になり、吹き出しが見えるようになります。

`pointer-events: none` は、表示されている間も吹き出しがマウスを受け取らないようにします。吹き出しの上にマウスを置くと、表示が消える、といったちらつきを防ぎます。

## ここがすごい

- 表示のための条件が一つのルールにまとまっているので、表示の仕組みを一か所で確認できます。
- `:focus` を含めているのが大切です。マウスを使えない人がキーボードで移動したときにも、同じ吹き出しを読めます。
- 素直に JavaScript だけで表示を切り替えると、マウス、キーボード、スクリプトのそれぞれに処理を書く必要があります。CSS で表示の条件を揃えると、その手間が減ります。
- `data-balloon-visible` を付けると、JavaScript から表示を強制できます。CSS と JavaScript の役割を、属性で分けています。

## まとめ

- 吹き出しの表示は、ホバー、フォーカス、属性の三つの条件で決まります。
- カンマで条件を並べると、どれかが成り立てば同じ表示になります。
- `pointer-events: none` で、表示中のちらつきを防げます。
- キーボード操作の入り口も含めると、誰にでも使いやすくなります。

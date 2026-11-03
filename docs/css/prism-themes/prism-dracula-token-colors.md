---
title: "コメントと前置きの文字を暗い青にする"
description: "Prism の Dracula テーマは、token の comment・prolog・doctype・cdata を同じ青灰色にし、punctuation は本文の色にそろえる。注釈を目立たせず、コードの本体を際立たせる配色。"
language: css
project: undefined
repo: https://github.com/PrismJS/prism-themes
license: MIT
copyright: "\"Copyright (c) 2015 PrismJS\""
commit: "447479fc7b2be2051fe27e561aceed7cc87a589f"
file: themes/prism-dracula.css
lines: [49, 58]
function: "\".token.comment, .token.prolog, .token.doctype, .token.cdata\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Prism の Dracula テーマは、コメントや文書の前置きを、薄い青灰色で表示します。注釈は読めるけれど、コードの本体より目立たない色です。

## コード

```css:line-numbers=49
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
	color: #6272a4;
}

.token.punctuation {
	color: #f8f8f2;
}
```

## 前提知識

- **token**: Prism がコードを分けた、一つ一つの部分です。`.token` のクラスが付いた span として出力されます。
- **comment**: コメントの部分を表す token です。
- **prolog・doctype・cdata**: XML や HTML の先頭にある宣言などを表す token です。コメントと同じく、本体ではない情報です。
- **punctuation**: 括弧やカンマなどの記号です。

## 何をしているか

### 1. 注釈の色

```css:line-numbers=49
.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
	color: #6272a4;
}
```

コメントや前置きの token を、同じ青灰色にまとめています。四種類を一つのルールで扱うため、色を変えるときも一か所で済みます。

### 2. 記号の色

```css:line-numbers=56
.token.punctuation {
	color: #f8f8f2;
}
```

括弧やカンマなどの記号は、本文と同じ色にします。記号だけが浮いて見えないように、落ち着いた色に保ちます。

## ここがすごい

注釈を灰色にして沈めるのではなく、彩度の低い青にすることで、暗い背景の中でも文字として読める色を残しています。

注釈の色は、コードの読み手にとって補助的な情報を示すため、やや控えめであるほうが読みやすくなります。コメントを強く目立たせると、コードの本体が埋もれて見えます。逆に薄すぎると、暗い背景の上で読めなくなります。このテーマは、青灰色を選ぶことで、その中間をとっています。記号も本文と同じ色にそろえ、コードの構造が色の差で乱れないようにしています。

## まとめ

token の種類ごとに色を決めると、注釈とコードの本体を、色の差だけで区別できます。

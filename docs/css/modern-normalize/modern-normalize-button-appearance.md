---
title: "iOS でもボタンの見た目を自由に変えられるようにする"
description: "button と submit などの type に -webkit-appearance: button を指定し、iOS と Safari でボタンの背景色や枠線を変えられるようにする。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [152, 157]
function: "\"button, [type='button'], [type='reset'], [type='submit']\""
difficulty: 2
format: 2
tags: [移植性, ハック]
---
## ひとことで

`button` 要素と、`type` 属性が `button`・`reset`・`submit` の `input` 要素に `-webkit-appearance: button` を指定するルールです。iOS と Safari では、これを指定しないとボタンの背景色や枠線を CSS で変えられない場合があります。このルールは、その制限を取り除くための準備です。

## コード

```css:line-numbers=152
button,
[type='button'],
[type='reset'],
[type='submit'] {
	-webkit-appearance: button;
}
```

## 前提知識

- **appearance**: 要素を、ブラウザや OS が持つネイティブの部品の見た目で描画するかどうかを決めるプロパティです。`button` を指定すると、その要素はボタンの部品として描かれます。
- **-webkit-appearance**: WebKit（Safari や iOS のブラウザ）向けの接頭辞付きのプロパティです。ブラウザごとに違う名前を持つ古い仕様を、そのまま書くときに使います。
- **type 属性**: `input` 要素の種類を表す属性です。`button`、`reset`、`submit` は、ボタンとして使う種類です。
- **ネイティブの見た目**: OS や ブラウザが最初から用意している部品の描き方のことです。CSS で上書きしにくいことがあります。

## 何をしているか

### 1. ボタンを対象にする

```css:line-numbers=152
button,
[type='button'],
[type='reset'],
[type='submit'] {
	-webkit-appearance: button;
}
```

ひとつ目の `button` は `<button>` 要素そのものです。`[type='button']` などは、`<input type="button">` のような入力欄ボタンを対象にしています。セレクタを 4 つ並べることで、見た目のルールの対象を漏れなく指定しています。

`-webkit-appearance: button` は、この要素をボタンの部品として描くことを明示します。iOS と Safari では、この指定があると背景色や枠線の CSS が効くようになります。

## ここがすごい

- 1 行の指定で、iOS と Safari に対するボタンのバグを避けられます。コメントにあるとおり、「クリック可能な要素のスタイルを変えられない」問題への対策です。
- ボタンの種類ごとの属性が、セレクタに正確に列挙されています。`type` 属性の値を漏らさないための書き方です。
- 素直に書くと、`button { background: red; }` のように見た目だけを指定することになります。古い iOS の Safari では、その指定が効かないことがあります。`appearance` を先に指定しておくと、こうした環境でも色を変えられます。
- 接頭辞付きの `-webkit-appearance` を使っている点も、古い環境向けの配慮です。標準の `appearance` を並べて書けば、将来的には一つにまとめられます。

## まとめ

- `appearance: button` は、要素をボタンの部品として描くよう指定します。
- iOS と Safari では、ボタンの見た目を CSS で変えるための前提になります。
- `button` と `type` 属性が `button`・`reset`・`submit` の入力欄を、まとめて対象にします。
- 接頭辞付きの指定は、古いブラウザへの対策として残されています。

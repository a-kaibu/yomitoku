---
title: "対応表と replace のコールバックで HTML を安全にする"
description: "HTML で特別な意味を持つ 5 つの文字を実体参照に置き換える escape。対応表のオブジェクトと、一致した文字を受け取るコールバックで 1 行に収めている。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/escape.ts
lines: [1, 24]
function: "escape"
difficulty: 1
tags: [セキュリティ, 文字列処理, イディオム]
---

## ひとことで

`escape(str)` は、文字列を HTML の中に安全に埋め込めるように、**特別な意味を持つ 5 つの文字を別の表記に置き換える** 関数です。

```ts
escape('<b>"Tom & Jerry"</b>')
// '&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;'
```

ユーザーが入力した文字列をそのまま HTML に入れると、`<script>` などを仕込まれて悪用されるおそれがあります（XSS と呼ばれる攻撃）。この関数はその対策の基本形です。

## コード

```ts:line-numbers=1
const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Converts the characters "&", "<", ">", '"', and "'" in `str` to their corresponding HTML entities.
 * For example, "<" becomes "&lt;".
 *
 * @param str  The string to escape.
 * @returns Returns the escaped string.
 *
 * @example
 * escape('This is a <div> element.'); // returns 'This is a &lt;div&gt; element.'
 * escape('This is a "quote"'); // returns 'This is a &quot;quote&quot;'
 * escape("This is a 'quote'"); // returns 'This is a &#39;quote&#39;'
 * escape('This is a & symbol'); // returns 'This is a &amp; symbol'
 */
export function escape(str: string): string {
  return str.replace(/[&<>"']/g, match => htmlEscapes[match]);
}
```

## 前提知識

- **`Record<string, string>`**: 「キーも値も文字列のオブジェクト」という型です。対応表に使っています。
- **HTML の文字参照**: `&lt;` は `<`、`&gt;` は `>`、`&amp;` は `&`、`&quot;` は `"`、`&#39;` は `'` を表す書き方です。ブラウザは文字として表示しますが、タグや属性の区切りとしては扱いません。
- **`/[&<>"']/g`**: 角かっこ `[…]` は「この中のどれか 1 文字」という正規表現です。`g` で文字列中のすべてを対象にします。
- **`str.replace(正規表現, 関数)`**: 第 2 引数に関数を渡すと、一致した部分ごとにその関数が呼ばれ、戻り値で置き換えられます。
- **アロー関数 `match => htmlEscapes[match]`**: 引数 `match` を受け取り、対応表から置き換え先を引いて返す短い関数です。

## 何をしているか

### 1. 対応表（1〜7 行目）

置き換える 5 文字と、その置き換え先をオブジェクトにまとめています。

### 2. 置き換え（22〜24 行目）

正規表現で 5 文字のどれかを探し、見つかるたびに対応表から置き換え先を返します。

```
'<a href="x">'
 < → &lt;    " → &quot;    " → &quot;    > → &gt;
→ '&lt;a href=&quot;x&quot;&gt;'
```

## ここがすごい

- **1 回の走査で全部置き換える**: `replace(/&/g, '&amp;').replace(/</g, '&lt;')…` と 5 回つなげる書き方もありますが、それだと文字列を 5 回なめることになります。しかも順番を間違えると壊れます。たとえば `<` を先に `&lt;` にしてから `&` を置き換えると、`&lt;` の `&` まで `&amp;lt;` になってしまいます。1 回の走査で 1 文字ずつ置き換えるこの方法なら、置き換えた結果がもう一度置き換えられることは構造的にありえません。
- **対応表をデータとして分ける**: 置き換えのルールがオブジェクトにまとまっているので、何を変換するかが一目でわかり、逆変換（`unescape`）も同じ考え方で書けます。
- **シングルクォートも変換**: 属性を `'…'` で囲む HTML もあるので、`'` も `&#39;` に変えています。`&apos;` ではなく数値の参照を使うのは、古い HTML の仕様では `&apos;` が定義されていなかったためで、どこでも確実に通じる書き方です。

## まとめ

- HTML に文字列を埋め込むときは `& < > " '` の 5 文字を変換する。
- 複数の置き換えは、1 回の `replace` と対応表で行うと、順番の事故が起きない。
- `replace` の第 2 引数に関数を渡すと、一致ごとに置き換え先を計算できる。

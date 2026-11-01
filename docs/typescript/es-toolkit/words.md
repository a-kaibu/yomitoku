---
title: "1 本の正規表現で camelCase も絵文字も単語に分ける"
description: "文字列を単語に分割する words。Unicode のプロパティを使った正規表現 1 本で、大文字の区切り・略語・数字・絵文字・各国の文字をまとめて扱う。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/words.ts
lines: [18, 40]
function: "words"
difficulty: 2
tags: [正規表現, Unicode, 文字列処理]
---

## ひとことで

`words(str)` は、文字列を **単語の配列** に分ける関数です。`camelCase` や `snake_case` への変換の下ごしらえに使われます。

```ts
words('fooBar')            // ['foo', 'Bar']
words('XMLHttpRequest')    // ['XML', 'Http', 'Request']
words('hello_world 123')   // ['hello', 'world', '123']
words('café🎉')            // ['café', '🎉']
```

処理は `str.match` 1 回だけ。仕事のほとんどを、18〜19 行目の **1 本の正規表現** がしています。

## コード

```ts:line-numbers=18
export const CASE_SPLIT_PATTERN =
  /\p{Lu}?\p{Ll}+|[0-9]+|\p{Lu}+(?!\p{Ll})|\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{L}+/gu;

/**
 * Splits `string` into an array of its words, treating spaces and punctuation marks as separators.
 *
 * @param str The string to inspect.
 * @param [pattern] The pattern to match words.
 * @returns Returns the words of `string`.
 *
 * @example
 * words('fred, barney, & pebbles');
 * // => ['fred', 'barney', 'pebbles']
 *
 * words('camelCaseHTTPRequest🚀');
 * // => ['camel', 'Case', 'HTTP', 'Request', '🚀']
 *
 * words('Lunedì 18 Set')
 * // => ['Lunedì', '18', 'Set']
 */
export function words(str: string): string[] {
  return Array.from(str.match(CASE_SPLIT_PATTERN) ?? []);
}
```

## 前提知識

- **正規表現**: 文字列のパターンを表す小さな言語です。`/…/gu` の `g` は「すべての一致を探す」、`u` は「Unicode モード」です。
- **`\p{…}`（Unicode プロパティ）**: `u` モードで使える書き方で、文字の種類を指定できます。`\p{Lu}` は大文字、`\p{Ll}` は小文字、`\p{L}` はあらゆる言語の文字、`\p{Emoji_Presentation}` と `\p{Extended_Pictographic}` は絵文字です。
- **`?` `+`**: 直前のものが「0 個か 1 個」「1 個以上」。
- **`(?!…)`（否定先読み）**: 「この直後に … が続かないこと」を確認します。文字は消費しません。
- **`|`**: 「または」。左から順に試し、最初に合ったものが採用されます。
- **`str.match(re)`**: `g` 付きなら一致した文字列の配列、一致がなければ `null` を返します。`?? []` で `null` のときは空配列にしています。

## 何をしているか

正規表現は 6 つの候補を `|` でつないだものです。上から順に試されます。

1. `\p{Lu}?\p{Ll}+` … 大文字 0〜1 個 + 小文字の連続。`Bar`、`foo`、`Http` など普通の単語。
2. `[0-9]+` … 数字の連続。
3. `\p{Lu}+(?!\p{Ll})` … 大文字の連続で、**直後が小文字でないもの**。`XML` のような略語。
4. `\p{Emoji_Presentation}` … 絵文字。
5. `\p{Extended_Pictographic}` … そのほかの絵文字的な記号。
6. `\p{L}+` … 上に当てはまらない文字（ひらがなや漢字など大文字・小文字のない文字）の連続。

`_` や空白はどの候補にも当てはまらないので、自然に区切りとして読み飛ばされます。

`XMLHttpRequest` を追ってみます。

```
X から: 1 は X の次が M（大文字）で不成立 → 3 で大文字の連続を探す
        XMLH まで行くと H の次が t（小文字）なので先読みが失敗 → 戻って XML で成立
H から: 1 で Http
R から: 1 で Request
```

## ここがすごい

- **略語の切れ目を先読みで見つける**: `XMLHttp` の切れ目は「大文字の連続のうち、**最後の 1 文字**だけは次の単語の頭」というルールです。`(?!\p{Ll})` で「直後に小文字が来ない位置まで」と指定するだけで、正規表現が自動的に 1 文字戻ってちょうどよい場所で切ってくれます。
- **英語以外の文字にも対応**: `[A-Z]` ではなく `\p{Lu}` を使っているので、`É` や `Ж` のような文字でも大文字・小文字の区別が正しく働きます。大文字・小文字のない日本語なども 6 番目の候補でまとめて拾えます。
- **区切り文字を列挙しない**: 「`_` `-` 空白で区切る」と書く代わりに、「単語とは何か」だけを定義しています。想定していない記号が来ても、単語でないものはすべて捨てられます。
- **パターンを公開して再利用**: `CASE_SPLIT_PATTERN` は `export` されていて、ほかの変換関数でも同じ規則を使えます。

## まとめ

- 「区切りを探す」より「単語とは何か」を定義するほうが漏れが少ない。
- 否定先読みを使うと、略語と次の単語の境目のような微妙な切れ目を表せる。
- Unicode プロパティ `\p{…}` で、英語以外の文字も正しく扱える。

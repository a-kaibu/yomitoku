---
title: "「A か B」のような説明文を、重複を消してつなぐ"
description: "valibot の _joinExpects。エラーメッセージの「〜 であること」の部分を、同じ語を 1 つにまとめて、| や & でつなぐ。候補が 1 つなら括弧を付けず、0 個なら never と表示する。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_joinExpects/_joinExpects.ts
lines: [12, 23]
function: "_joinExpects"
difficulty: 1
format: 2
tags: [文字列処理, エラー処理, 型システム]
---

## ひとことで

`_joinExpects(values, separator)` は、エラーメッセージに出す「期待される値」の一覧を、読みやすくつなぐ関数です。同じ語が何度も出てきたら 1 つにまとめ、候補が複数なら `(string | number)` のように括弧で囲み、1 つだけなら括弧を付けずにそのまま返し、空なら `never` と返します。

```ts
_joinExpects(['string', 'number'], '|')   // "(string | number)"
_joinExpects(['string', 'string'], '|')   // "string"
_joinExpects([], '|')                     // "never"
```

## コード

::: code-group

```ts:line-numbers=12 [日本語訳]
export function _joinExpects(values: string[], separator: '&' | '|'): string {
  // 重複のないリストを作る
  const list = [...new Set(values)];

  // リストが 2 つ以上なら、つなぐ
  if (list.length > 1) {
    return `(${list.join(` ${separator} `)})`;
  }

  // それ以外は、最初の 1 つか「never」を返す
  return list[0] ?? 'never';
}
```

```ts:line-numbers=12 [原文]
export function _joinExpects(values: string[], separator: '&' | '|'): string {
  // Create list without duplicates
  const list = [...new Set(values)];

  // If list has more than one item, join them
  if (list.length > 1) {
    return `(${list.join(` ${separator} `)})`;
  }

  // Otherwise, return first item or "never"
  return list[0] ?? 'never';
}
```

:::

## 前提知識

- **`Set`**: 同じ値を 2 つ持てない、組み込みのコレクションです。`new Set(['a', 'a'])` は `a` だけを持ちます。
- **スプレッド構文 `[...x]`**: 反復できるもの（`Set` など）の要素を、1 つずつ取り出して新しい配列にします。
- **`join`**: 配列の要素を、指定した区切り文字でつないで 1 つの文字列にします。
- **テンプレート文字列**: バッククォートで囲んで、`${…}` の中に式を埋め込む書き方です。
- **`??`（null 合体演算子）**: 左の値が `null` か `undefined` のときだけ、右の値を使います。空の配列の 0 番目は `undefined` なので、`'never'` が使われます。

## 何をしているか

### 1. 重複を消す

```ts:line-numbers=14
  const list = [...new Set(values)];
```

`Set` に入れると、同じ語は 1 つだけになります。そのあと、スプレッド構文で配列に戻します。これで `string` が 2 回並ぶことがなくなります。

### 2. 2 つ以上なら、区切りでつないで括弧で囲む

```ts:line-numbers=17
  if (list.length > 1) {
    return `(${list.join(` ${separator} `)})`;
  }
```

候補が複数あるときは、`string | number` のように間に区切りを入れ、全体を括弧で囲みます。区切りは `&`（すべて満たす）か `|`（どれか）で、呼び出し側が選びます。

### 3. 1 つか 0 個のときの扱い

```ts:line-numbers=22
  return list[0] ?? 'never';
```

1 つだけならその語をそのまま返します。0 個なら `list[0]` が `undefined` になるので、`'never'`（どの値も当てはまらない）を返します。

## ここがすごい

- **文章として自然になる**: 「string | number である必要があります」のように、表示の文章が崩れません。候補が 1 つのときに括弧が付かないのも、読みやすさのためです。
- **重複を Set で 1 行で消す**: 手で重複を調べる必要がありません。同じ型が複数の経路から届いても、表示は 1 回だけです。
- **空の場合の答えを決めている**: 候補が無いときに空文字や `undefined` を出すのではなく、`never` と意味のある語を出します。
- **区切りを引数で決める**: `&` と `|` の両方に使えるように、区切りを引数にしています。関数を分けずに済みます。

## まとめ

- `Set` を使うと、重複の除去を 1 行で書ける。
- 候補の数によって、括弧の有無を変えると文章が自然になる。
- 空の配列の添字は `undefined` になるので、`??` で既定の語を決められる。
- 区切りを引数にすると、似た処理を 1 つの関数にまとめられる。

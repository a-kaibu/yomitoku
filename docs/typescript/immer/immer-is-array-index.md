---
title: "文字列が配列の添字として正しいかを 1 行で調べる"
description: "immer が配列の添字かどうかを判定する isArrayIndex。+value で数に変えてから、数に戻した文字列が元の文字列と同じかを比べている。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [187, 190]
function: "isArrayIndex"
difficulty: 2
format: 2
tags: [型システム, 文字列処理, イディオム]
---

## ひとことで

`isArrayIndex(value)` は、文字列や数が「配列の添字として正しい形か」を判定する関数です。`"0"` や `"12"` なら `true` を返し、`"01"`、`"1.5"`、空文字列なら `false` を返します。immer が、オブジェクトのキーを配列の要素として扱うかどうかを決めるときに使われます。

```ts
isArrayIndex("3")    // true
isArrayIndex(3)      // true
isArrayIndex("01")   // false（先頭に 0 があるので、正規の添字ではない）
isArrayIndex("1.5")  // false
```

## コード

```ts:line-numbers=187
export function isArrayIndex(value: string | number): value is number | string {
	const n = +value
	return Number.isInteger(n) && String(n) === value
}
```

## 前提知識

- **単項の `+`**: 変数の前に `+` を付けると、中身を数に変換します。`+"12"` は `12`、`+"abc"` は `NaN` になります。
- **`Number.isInteger(n)`**: `n` が整数なら `true` を返します。`1.5` や `NaN` は `false` です。
- **`String(n)`**: 数を文字列に変えます。`String(12)` は `"12"` です。
- **型述語 `value is number | string`**: 戻り値が `true` のとき、`value` の型が `number | string` だと TypeScript に伝える書き方です。
- **添字（インデックス）**: 配列の何番目かを表す数です。`arr[0]` の `0` が添字です。

## 何をしているか

### 1. 文字列を数に変える

```ts:line-numbers=188
	const n = +value
```

`"12"` なら `12` に、`12` なら `12` のままになります。`"01"` も `1` になります。ここでは「数として解釈できたら、その数」を取り出しています。

### 2. 整数かどうかを調べる

```ts:line-numbers=189
	return Number.isInteger(n) && String(n) === value
```

まず `Number.isInteger(n)` で、`1.5` や `NaN` を落とします。次に `String(n) === value` で、数に変えて戻したときに元と同じかを比べます。`"01"` は `1` に変わり `"1"` になるので、元の `"01"` とは違い、`false` になります。

この 2 段階で「数として書けるが、表記がそのままでは正規の添字ではない」ものを取り除けます。

## ここがすごい

- **正規表現を使わない**: `/^(0|[1-9]\d*)$/` のような正規表現を書く代わりに、「数に変えて、戻して比べる」だけで同じ判定ができます。短く、読み間違いにくい書き方です。
- **表記のゆれを一度に検出**: 先頭の `0`、`+` 記号、小数点、空白などは、戻したときに元の文字列と一致しないので、すべて弾かれます。
- **名前より少し広い判定**: `"-1"` は `Number.isInteger(-1)` が `true` で、`String(-1)` も `"-1"` なので `true` になります。「負の数を含む整数の文字列」を判定しているので、添字の厳密な定義とは少し違います。ここを知っておくと、読むときに迷いません。

## まとめ

- `+value` で文字列を数に変えると、解釈できるかどうかを一度に確かめられる。
- 整数の判定と「元の文字列と同じか」の比較を組み合わせると、表記のゆれを弾ける。
- 正規表現を使わない書き方は、短く、速く、読みやすい。
- 関数名が示す範囲と実際の判定の範囲が少し違う場合があるので、コードを必ず確かめる。

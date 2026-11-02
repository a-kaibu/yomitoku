---
title: "オブジェクトのキーが「整数の番号」かどうかを文字列で確かめる"
description: "Vue の isIntegerKey。キーが 0 以上の整数の文字列なら true を返す。parseInt で数に変えて戻し、元の文字列と同じかを比べる。NaN や負の数は除く。"
language: typescript
project: "Vue.js"
repo: https://github.com/vuejs/core
license: MIT
copyright: "Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors"
commit: "24c9d0bffb2299635b8112a978d74a38723aaa10"
file: packages/shared/src/general.ts
lines: [77, 81]
function: "isIntegerKey"
difficulty: 2
format: 2
tags: [文字列処理, 型システム, 防御的プログラミング]
---

## ひとことで

`isIntegerKey(key)` は、オブジェクトのキーが「整数を表す文字列」かを判定する関数です。`"0"` や `"12"` は `true`、`"01"`・`"-1"`・`"NaN"`・`"abc"` は `false` を返します。Vue の中で、配列のような添字のキーを特別に扱うかどうかを決めるときに使われます。

```ts
isIntegerKey('0')    // true
isIntegerKey('12')   // true
isIntegerKey('01')   // false（先頭に 0 があるので、正規の整数ではない）
isIntegerKey('-1')   // false（負の数は除く）
```

## コード

```ts:line-numbers=77
export const isIntegerKey = (key: unknown): boolean =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key
```

## 前提知識

- **キー（プロパティ名）**: オブジェクトの中の名前です。JavaScript では、キーは文字列か Symbol になります。`obj[0]` と `obj['0']` は同じキーです。
- **`parseInt(key, 10)`**: 文字列を 10 進数の整数として読み取ります。先頭から数字として読める部分を返します。
- **`isString(key)`**: 値が文字列かを判定する Vue の関数です。`parseInt` は文字列を前提にするため、最初に確かめています。
- **`'' + 数`**: 数を文字列に変える、よくある書き方です。`'' + 12` は `'12'` になります。
- **`&&`（かつ）**: すべての条件が真のときだけ真になります。途中で偽になれば、そこで止まります。

## 何をしているか

### 1. 文字列かを確かめ、特殊な値を除く

```ts:line-numbers=78
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
```

文字列でなければ、すぐに `false` です。`'NaN'` は `parseInt` で `NaN` になるため、先に除きます。先頭が `-` の負の数も、整数キーとしては扱いません。

### 2. 数に変えて戻し、元と同じかを比べる

```ts:line-numbers=81
  '' + parseInt(key, 10) === key
```

`parseInt` で数に変えてから、文字列に戻します。戻した文字列が元の `key` と同じなら、表記がきちんとした整数です。`'01'` は `'1'` に戻るので、`false` になります。

## ここがすごい

- **表記の揺れを 1 回で見つける**: 先頭の 0、小数点、空白などは、数に変えて戻すと元の文字列と一致しなくなります。その性質を使って、表記の正しさをまとめて確かめています。
- **`parseInt` の読み取りの癖を補う**: `parseInt('12abc')` は `12` を返すので、単独では「整数の文字列」と判定できません。戻して比べることで、この癖を防いでいます。
- **`NaN` を名前で除く**: `'NaN'` という文字列は整数に見えませんが、`parseInt` の結果が `NaN` になる例外です。コードに直接書くことで、意図がはっきりします。
- **判定の順序が短絡的**: 先に安い判定（文字列か、先頭の記号）を行い、重い変換は最後にします。

## まとめ

- 整数の文字列かは、数に変えて戻し、元の文字列と比べると正確に判定できる。
- `parseInt` は文字列の途中までを読むので、戻して比べて確かめる必要がある。
- `NaN` や負の数など、例外的な値は先に除くと分かりやすい。
- 判定の順序を、安い条件から並べると、無駄な変換を減らせる。

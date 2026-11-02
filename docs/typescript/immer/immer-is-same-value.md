---
title: "NaN と -0 を正しく比べる「同じ値か」判定"
description: "immer 内部の is 関数。=== では NaN と NaN が違う値になり、0 と -0 が同じ値になってしまう。その 2 つの穴を 1 行の式で埋めている。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [162, 169]
function: "is"
difficulty: 2
format: 2
tags: [型システム, 防御的プログラミング, イディオム]
---

## ひとことで

`is(x, y)` は、2 つの値が「同じ値か」を判定する関数です。JavaScript の `===` とほぼ同じ働きをしますが、`NaN` と `-0` という 2 つの例外だけ違う答えを返します。immer は、オブジェクトの変更が本当にあったかを確かめるときにこの関数を使います。

```ts
is(NaN, NaN) // true（=== なら false）
is(0, -0)    // false（=== なら true）
```

## コード

::: code-group

```ts:line-numbers=162 [日本語訳]
export function is(x: any, y: any): boolean {
	// 出典: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
	if (x === y) {
		return x !== 0 || 1 / x === 1 / y
	} else {
		return x !== x && y !== y
	}
}
```

```ts:line-numbers=162 [原文]
export function is(x: any, y: any): boolean {
	// From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
	if (x === y) {
		return x !== 0 || 1 / x === 1 / y
	} else {
		return x !== x && y !== y
	}
}
```

:::

## 前提知識

- **`===`（厳密等価）**: 2 つの値が同じかを調べる演算子です。ほとんどの場合は十分ですが、次の 2 つで期待と違う結果になります。
- **`NaN`**: 「数ではない」ことを表す特別な数です。`NaN === NaN` は `false` になります。`NaN` は自分自身とも等しくないと決められているためです。
- **`-0`（マイナスゼロ）**: 0 の仲間ですが、符号だけ違う値です。`0 === -0` は `true` になります。
- **`1 / x`**: 0 で割ると `Infinity` になります。`1 / 0` は `Infinity`、`1 / -0` は `-Infinity` です。この違いを使って `0` と `-0` を見分けます。
- **`x !== x`**: 値が `NaN` のときだけ `true` になる、という性質を使ったテクニックです。

## 何をしているか

### 1. まず普通に `===` で比べる

```ts:line-numbers=164
	if (x === y) {
```

`x` と `y` が `===` で等しければ、次の確認に進みます。等しくなければ、後で `NaN` かどうかを調べます。

### 2. 0 と -0 を見分ける

```ts:line-numbers=165
		return x !== 0 || 1 / x === 1 / y
```

`x` が 0 でないなら、`===` の結果をそのまま返します。`x` が 0（`0` か `-0`）のときは、`1 / x` と `1 / y` を比べます。`0` と `0` なら両方 `Infinity` で等しくなります。`0` と `-0` なら `Infinity` と `-Infinity` になり、等しくないので `false` です。

### 3. NaN 同士を等しいとみなす

```ts:line-numbers=167
		return x !== x && y !== y
```

`===` で等しくなかったケースです。`x` も `y` も `NaN` のときだけ両方とも `x !== x` が `true` になるので、この式は `true` になります。片方だけが `NaN` なら `false` です。

## ここがすごい

- **1 行の比較を、2 つの例外に対する分岐だけで置き換えている**: `Object.is` と同じ結果を、関数 1 つで、古い環境でも動く形で実現しています。
- **`x !== x` で NaN を判定**: `Number.isNaN` を呼ぶ代わりに、言語の性質そのものを使っています。`NaN` だけが自分と等しくないという性質を利用しています。
- **`1 / x` で符号を見る**: 0 の符号は普通の比較では見えません。割り算の結果が `Infinity` か `-Infinity` になることを利用して、符号の違いを見分けています。
- **コメントに出典**: 元にした実装（fbjs の `shallowEqual`）へのリンクが付いています。借りた考え方の出どころを残す、よい書き方です。

## まとめ

- `===` は `NaN` と `-0` で直感と違う結果を返すことがある。
- `x !== x` は「値が NaN か」を調べる定番の書き方。
- `1 / x` は 0 の符号（`0` か `-0`）を見分けるのに使える。
- `Object.is` は、この関数と同じ結果を返すために作られた組み込み関数。

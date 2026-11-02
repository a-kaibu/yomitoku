---
title: "下書きからできた結果を凍らせる freeze の深さの制御"
description: "immer の freeze。オブジェクトを浅く、または再帰的に凍らせる。Map と Set は書き換えメソッドを個別に差し替えて、変更できないようにしている。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [266, 289]
function: "freeze"
difficulty: 2
format: 2
tags: [メモリ管理, 再帰, 防御的プログラミング]
---

## ひとことで

`freeze(obj, deep)` は、オブジェクトを「あとから書き換えられない」状態にする関数です。`deep` が `false` なら直下のプロパティだけを、`true` なら中身まで再帰的に凍らせます。`Object.freeze` を呼ぶだけでは `Map` や `Set` の中身は変えられてしまうので、そこを別に塞いでいるのがこの関数の工夫です。

```ts
const state = freeze({ user: { name: "たろう" } }, true)
state.user.name = "じろう" // 厳密モードでは TypeError
```

## コード

::: code-group

```ts:line-numbers=266 [日本語訳]
export function freeze<T>(obj: T, deep?: boolean): T
export function freeze<T>(obj: any, deep: boolean = false): T {
	if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj
	if (getArchtype(obj) > 1 /* Map or Set */) {
		O.defineProperties(obj, {
			set: dontMutateMethodOverride,
			add: dontMutateMethodOverride,
			clear: dontMutateMethodOverride,
			delete: dontMutateMethodOverride
		})
	}
	O.freeze(obj)
	if (deep)
		// 列挙できないプロパティや Symbol のプロパティへは再帰しない（See #590）
		// そのため、Object.values と同じく列挙可能な文字列キーだけを回す each を使う
		each(
			obj,
			(_key, value) => {
				freeze(value, true)
			},
			false
		)
	return obj
}
```

```ts:line-numbers=266 [原文]
export function freeze<T>(obj: T, deep?: boolean): T
export function freeze<T>(obj: any, deep: boolean = false): T {
	if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj
	if (getArchtype(obj) > 1 /* Map or Set */) {
		O.defineProperties(obj, {
			set: dontMutateMethodOverride,
			add: dontMutateMethodOverride,
			clear: dontMutateMethodOverride,
			delete: dontMutateMethodOverride
		})
	}
	O.freeze(obj)
	if (deep)
		// See #590, don't recurse into non-enumerable / Symbol properties when freezing
		// So use Object.values (only string-like, enumerables) instead of each()
		each(
			obj,
			(_key, value) => {
				freeze(value, true)
			},
			false
		)
	return obj
}
```

:::

## 前提知識

- **`Object.freeze(obj)`**: オブジェクトのプロパティの追加・変更・削除を禁止する組み込み関数です。ただし、中にあるオブジェクトまでは凍りません（浅い凍結）。
- **`Map` と `Set`**: キーと値を持つ、または値だけを持つ組み込みのコレクションです。中身の変更は `set` や `add` などのメソッドで行うので、`Object.freeze` だけでは止まりません。
- **`O.defineProperties`**: プロパティの性質（書き換え可否など）を決めて定義する組み込み関数です。ここでは `set` などのメソッドを置き換えるために使っています。
- **再帰**: 関数の中で自分自身を呼ぶことです。`freeze(value, true)` の中で `freeze` を呼んでいるので、深い階層まで同じ処理が届きます。

## 何をしているか

### 1. 凍らせなくてよいものは、そのまま返す

```ts:line-numbers=268
	if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj
```

すでに凍っているもの、下書き（draft）、そもそも immer が扱わないもの（クラスのインスタンスなど）は、何もせずに返します。同じものを何度凍らせても問題が起きないようにするためです。

### 2. Map と Set のメソッドを差し替える

```ts:line-numbers=269
	if (getArchtype(obj) > 1 /* Map or Set */) {
```

`Map` と `Set` は `Object.freeze` だけでは中身が変えられるので、ここで `set`、`add`、`clear`、`delete` の 4 つを、呼ばれたら `die(2)`（エラー）を投げるものに置き換えます。

```ts:line-numbers=295
const dontMutateMethodOverride = {
	[VALUE]: dontMutateFrozenCollections
}
```

差し替え先の関数は `dontMutateFrozenCollections` で、呼ばれるとエラーになります。

### 3. 最後に凍らせて、必要なら中へ進む

```ts:line-numbers=277
	O.freeze(obj)
```

ここで自分自身を凍らせます。その後、`deep` が `true` のときだけ、中の値に対して同じ `freeze` を呼びます。

## ここがすごい

- **`Object.freeze` の穴を塞いでいる**: 凍らせたつもりの `Map` や `Set` が実は書き換えられる、という落とし穴をコードで埋めています。
- **列挙できないプロパティは対象外**: 再帰の部分は `each` の 3 つ目の引数 `false` で、列挙できる文字列キーだけを回します。コメントにある issue #590 の番号を見ると、こうした細部には修正の経緯があるとわかります。
- **不要な処理を入れない**: 最初の `if` で、すでに凍っているもの、下書き、対象外のものを返すので、大きなデータを何度 `freeze` しても無駄な再帰が増えにくくなっています。
- **浅い凍結と深い凍結を 1 つの関数で**: 引数 `deep` で切り替えるだけなので、呼び出し側の書き方がそろいます。

## まとめ

- `Object.freeze` は浅い凍結で、中身までは守らない。
- `Map` と `Set` は、書き換えメソッドを個別に差し替えて守る必要がある。
- 再帰で凍らせるときは、既に凍っているものを先に返して無駄を減らす。
- コメントの issue 番号のように、コードに残された経緯を読むと、一見不思議な書き方の理由がわかる。

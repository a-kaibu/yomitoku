---
title: "プレーンなオブジェクトかを、プロトタイプとコンストラクタの名前で確かめる"
description: "immer の isPlainObject。値の継承元（プロトタイプ）を見て、Object 由来かを判定する。クラスのインスタンスと区別するため、コンストラクタの文字列を比べる工夫がある。"
language: typescript
project: "immer"
repo: https://github.com/immerjs/immer
license: MIT
copyright: "Copyright (c) 2017 Michel Weststrate"
commit: "75a290e44ba14bd723c8ef8546b6559c8ef3ae88"
file: src/utils/common.ts
lines: [61, 78]
function: "isPlainObject"
difficulty: 3
format: 2
tags: [型システム, キャッシュ, 防御的プログラミング]
---

## ひとことで

`isPlainObject(value)` は、値が「プレーンなオブジェクト」かを判定する関数です。プレーンなオブジェクトとは、`{}` のように、クラスから作られていない普通のオブジェクトのことです。クラスのインスタンスは `false` になります。immer は、どの値を下書きにして良いかを決めるときに、この判定を使います。

```ts
isPlainObject({ a: 1 })           // true
isPlainObject(new Map())          // false
isPlainObject(new (class A {})()) // false（クラスのインスタンス）
```

## コード

```ts:line-numbers=61
export function isPlainObject(value: any): boolean {
	if (!value || !isObjectish(value)) return false
	const proto = getPrototypeOf(value)
	if (proto === null || proto === O[PROTOTYPE]) return true

	const Ctor = O.hasOwnProperty.call(proto, CONSTRUCTOR) && proto[CONSTRUCTOR]
	if (Ctor === Object) return true

	if (!isFunction(Ctor)) return false

	let ctorString = cachedCtorStrings.get(Ctor)
	if (ctorString === undefined) {
		ctorString = Function.toString.call(Ctor)
		cachedCtorStrings.set(Ctor, ctorString)
	}

	return ctorString === objectCtorString
}
```

## 前提知識

- **プロトタイプ**: オブジェクトが継承している元のオブジェクトです。`Object.getPrototypeOf(value)` で取り出せます。
- **`Object.prototype`**: すべての普通のオブジェクトの、一番上の継承元です。`{}` のプロトタイプは、これです。
- **コンストラクタ**: クラスの本体です。`new A()` で呼ばれる関数で、`constructor` という名前のプロパティを持ちます。
- **`Function.prototype.toString`**: 関数やクラスを、ソースコードの文字列に変えます。同じ定義なら、同じ文字列になります。
- **キャッシュ（WeakMap）**: 一度計算した結果を覚えておく入れ物です。`WeakMap` は、キーのオブジェクトが不要になると、中身も自動で消えます。

## 何をしているか

### 1. 継承元を取り出して、普通のオブジェクトかを見る

```ts:line-numbers=63
	const proto = getPrototypeOf(value)
	if (proto === null || proto === O[PROTOTYPE]) return true
```

値の継承元を取り出します。継承元が無い（`null`）か、`Object.prototype` なら、普通のオブジェクトなので `true` です。

### 2. コンストラクタが Object かを見る

```ts:line-numbers=66
	const Ctor = O.hasOwnProperty.call(proto, CONSTRUCTOR) && proto[CONSTRUCTOR]
	if (Ctor === Object) return true
```

継承元が `constructor` を持っていれば、その値が `Object` そのものかを確かめます。`Object` なら `true` です。

### 3. コンストラクタのソースを比べて判定する

```ts:line-numbers=69
	if (!isFunction(Ctor)) return false

	let ctorString = cachedCtorStrings.get(Ctor)
	if (ctorString === undefined) {
		ctorString = Function.toString.call(Ctor)
		cachedCtorStrings.set(Ctor, ctorString)
	}

	return ctorString === objectCtorString
```

それ以外の場合は、コンストラクタのソースコードの文字列を、普通のオブジェクトのコンストラクタの文字列と比べます。同じなら、別の実行環境（別のフレームやライブラリの中）で作られた普通のオブジェクトでも、正しく `true` になります。結果は `WeakMap` に覚えておき、同じ関数を何度も比べ直さないようにしています。

## ここがすごい

- **別の環境のオブジェクトも認める**: `Object` を直接比べると、iframe などで作られた別の `Object` を区別できません。ソースの文字列を比べることで、この問題に対応しています。
- **結果をキャッシュする**: コンストラクタごとの文字列を `WeakMap` に覚えるので、同じクラスを何度判定しても、文字列の変換は 1 回で済みます。
- **メモリを押さえる**: `WeakMap` は、キーのコンストラクタが使われなくなれば、覚えた内容も消えます。メモリが増え続けません。
- **段階的な判定**: 速く判定できる場合から順に調べ、どうしても分からない場合だけ、重い比較をします。

## まとめ

- プレーンなオブジェクトは、継承元が `Object.prototype` か、`Object` 由来のコンストラクタを持つもの。
- 別の環境で作られたオブジェクトも扱うため、コンストラクタのソースの文字列を比べる工夫がある。
- 結果を `WeakMap` に覚えると、判定を速くでき、メモリも押さえられる。
- 速い判定から順に行い、重い判定は最後にすると、全体の性能が保たれる。

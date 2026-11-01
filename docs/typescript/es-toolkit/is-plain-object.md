---
title: "「ただのオブジェクト」かどうかをプロトタイプで見分ける"
description: "{} やObject.create(null) のような素のオブジェクトだけを true にする判定。プロトタイプの段数と toString の結果の 2 つを組み合わせ、別の実行環境で作られた値にも対応している。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isPlainObject.ts
lines: [43, 61]
function: "isPlainObject"
difficulty: 3
tags: [型システム, 防御的プログラミング, リフレクション]
---

## ひとことで

`isPlainObject(value)` は、値が **`{ a: 1 }` のような「ただのオブジェクト」かどうか** を判定します。配列、日付、クラスのインスタンス、`null` などは `false` です。

```ts
isPlainObject({})                  // true
isPlainObject(Object.create(null)) // true
isPlainObject([])                  // false
isPlainObject(new Date())          // false
isPlainObject(new (class Foo {})()) // false
```

JavaScript では `typeof` がこれらすべてに `'object'` を返すため、区別するにはひと工夫が必要です。

## コード

```ts:line-numbers=43
export function isPlainObject(value: unknown): value is Record<PropertyKey, any> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value) as typeof Object.prototype | null;

  const hasObjectPrototype =
    proto === null ||
    proto === Object.prototype ||
    // Required to support node:vm.runInNewContext({})
    Object.getPrototypeOf(proto) === null;

  if (!hasObjectPrototype) {
    return false;
  }

  return Object.prototype.toString.call(value) === '[object Object]';
}
```

## 前提知識

- **プロトタイプ**: JavaScript のオブジェクトは、自分にないプロパティを探しに行く「親」のオブジェクトを持っています。これをプロトタイプと呼びます。`{}` の親は `Object.prototype`、配列の親は `Array.prototype`、クラス `Foo` のインスタンスの親は `Foo.prototype` です。
- **`Object.getPrototypeOf(v)`**: `v` のプロトタイプを返します。
- **`Object.create(null)`**: 親を持たないオブジェクトを作ります。辞書として使うときによく使われます。
- **`Object.prototype.toString.call(v)`**: 値の内部的な種類を `'[object Object]'`、`'[object Array]'` のような文字列で返す古典的なテクニックです。
- **`value is Record<PropertyKey, any>`**: 型の絞り込み（型ガード）。`true` を返したら、呼び出し側で値がオブジェクトとして扱えるようになります。

## 何をしているか

### 1. オブジェクトでなければ false（44〜46 行目）

`!value` で `null` や `0`、`''` を除外し、`typeof` で数値や文字列、関数を除外します。

### 2. 親を調べる（48〜58 行目）

次のどれかなら「ただのオブジェクト」の候補です。

- 親がいない（`Object.create(null)`）
- 親が `Object.prototype`（`{}` で作ったもの）
- **親の親がいない**（53 行目のコメントにある、別の実行環境で作られたオブジェクト）

配列やクラスのインスタンスは親がそれぞれのプロトタイプなので、ここで落ちます。

### 3. 最後に種類を確かめる（60 行目）

`toString` の結果が `'[object Object]'` かどうかを見ます。

## ここがすごい

- **別の「世界」で作られたオブジェクトに対応**: Node.js の `vm.runInNewContext` や、ブラウザの iframe で作られたオブジェクトは、こちらの世界とは **別の `Object.prototype`** を親に持っています。なので `proto === Object.prototype` だけで判定すると `false` になってしまいます。そこで「親の親が `null`、つまり親がプロトタイプの連鎖の最上段にいる」かどうかでも判定しています。こうすれば、どの世界の `Object.prototype` でも見分けられます。
- **2 段構えで抜け道をふさぐ**: プロトタイプの確認だけでは、`Object.create(Object.prototype)` に `Symbol.toStringTag` を付けた特殊なオブジェクトなどを見逃すことがあります。最後に `toString` の結果も確かめることで、より厳密になっています。
- **安い判定を先に**: `typeof` の比較のような軽い判定を先に並べ、ほとんどの値をすぐに振り分けています。

## まとめ

- `typeof x === 'object'` だけでは、配列や日付、クラスのインスタンスと区別できない。
- プロトタイプを調べると「どうやって作られたか」がわかる。
- 別の実行環境の値まで考えるなら、特定の `Object.prototype` との比較ではなく、連鎖の形で判定する。

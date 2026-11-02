---
title: "__proto__ を使ったオブジェクト汚染を防ぐキーの確認"
description: "valibot の _isValidObjectKey。オブジェクトが自分で持つキーかを確かめたうえで、__proto__・prototype・constructor だけは別に弾く。入力の名前を悪用した攻撃を防いでいる。"
language: typescript
project: "valibot"
repo: https://github.com/fabian-hiller/valibot
license: MIT
copyright: "Copyright (c) Fabian Hiller"
commit: "d72f76fcf70ccfa0a5ca341b80da1d440ac60b11"
file: library/src/utils/_isValidObjectKey/_isValidObjectKey.ts
lines: [13, 20]
function: "_isValidObjectKey"
difficulty: 2
format: 2
tags: [セキュリティ, 防御的プログラミング, 型システム]
---

## ひとことで

`_isValidObjectKey(object, key)` は、オブジェクトの **自分自身が持っている** キーであり、かつ、危険な名前ではないかを調べる関数です。valibot では、入力データのキーを読み取るときに使われます。外から来たデータに `__proto__` という名前のキーがあっても、中身を書き換えられないようにしています。

```ts
_isValidObjectKey({ name: 'a' }, 'name')        // true
_isValidObjectKey({ name: 'a' }, 'age')         // false（持っていないキー）
_isValidObjectKey({}, '__proto__')              // false（危険な名前）
```

## コード

```ts:line-numbers=13
export function _isValidObjectKey(object: object, key: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(object, key) &&
    key !== '__proto__' &&
    key !== 'prototype' &&
    key !== 'constructor'
  );
}
```

## 前提知識

- **プロパティ（キー）**: オブジェクトに入っている名前と値の組です。`{ name: 'a' }` の `name` がキーです。
- **プロトタイプ（prototype）**: JavaScript のオブジェクトは、別のオブジェクトから機能を受け継ぎます。その受け継ぎ元をプロトタイプと呼びます。
- **`__proto__`**: オブジェクトのプロトタイプを読み書きできる特別なキーです。ここに値を入れると、そのオブジェクトの受け継ぎ元が書き換わってしまいます。
- **`hasOwnProperty`**: オブジェクトが、受け継いだものではなく、自分自身で持っているキーかを調べるメソッドです。
- **`call`**: 関数を別の `this`（この場合はオブジェクト）で呼び出す仕組みです。`Object.prototype.hasOwnProperty.call(object, key)` は、どのオブジェクトにも安全に使えるように、この書き方をしています。

## 何をしているか

### 1. 自分で持っているキーかを調べる

```ts:line-numbers=15
    Object.prototype.hasOwnProperty.call(object, key) &&
```

まず、`key` が `object` 自身のプロパティかを確かめます。受け継いだだけのもの（`toString` など）は `false` になります。

### 2. 危険な名前を 1 つずつ除く

```ts:line-numbers=16
    key !== '__proto__' &&
    key !== 'prototype' &&
    key !== 'constructor'
```

`__proto__`、`prototype`、`constructor` は、オブジェクトの仕組みに深く関わる名前です。これらを入力のキーとして扱うと、プロトタイプの書き換えや、意図しない関数の呼び出しにつながるおそれがあります。この 3 つは、キーとして認めません。

## ここがすごい

- **`hasOwnProperty.call` を使う理由**: `object.hasOwnProperty(key)` と書くと、相手のオブジェクトが同じ名前のメソッドを上書きしていた場合に壊れます。`Object.prototype` の関数を直接呼ぶと、その危険を避けられます。
- **「持っている」と「安全」を 1 つの式で確かめる**: 自分のキーかどうか、危険な名前かどうかを、`&&` でつないで 1 回の判定にしています。
- **名前の一覧を短く保つ**: 3 つだけを明示しているので、何を防いでいるかが一目でわかります。
- **攻撃の経路を断つ**: 外部から届いたデータを読むとき、キーの名前で中身が書き換わる攻撃（プロトタイプ汚染と呼ばれます）を防ぐための、最小限の備えです。

## まとめ

- `hasOwnProperty.call` で、オブジェクト自身のキーかを確かめる。
- `__proto__` などの名前は、外部データのキーとして扱わない。
- 他人のオブジェクトのメソッドを呼ぶときは、`Object.prototype` の関数を `call` で使うと安全。
- 入力を信用せず、読む前に確かめるのは、データを扱うライブラリの基本。

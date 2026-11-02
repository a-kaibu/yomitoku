---
title: "オブジェクトの「自分の」キーだけを数える"
description: "zod の numKeys は、オブジェクトのキーの数を数える。受け継いだプロパティは数えず、for...in と hasOwnProperty で自分自身のキーだけを対象にしている。"
language: typescript
project: "Zod"
repo: https://github.com/colinhacks/zod
license: MIT
copyright: "Copyright (c) 2025 Colin McDonnell"
commit: "2554b70c3d4a80273381e61d527d820720626440"
file: packages/zod/src/v4/core/util.ts
lines: [566, 574]
function: "numKeys"
difficulty: 1
format: 2
tags: [データ構造, イテレータ, 防御的プログラミング]
---

## ひとことで

`numKeys(data)` は、オブジェクトが自分で持っているキーの数を数える関数です。`Object.keys(data).length` と似ていますが、`for...in` という書き方で 1 つずつ確かめるので、受け継いだプロパティを除く仕組みが見えやすくなっています。

```ts
numKeys({ a: 1, b: 2 })   // 2
numKeys({})               // 0
```

## コード

```ts:line-numbers=566
export function numKeys(data: any): number {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
```

## 前提知識

- **`for...in`**: オブジェクトのキー（プロパティ名）を 1 つずつ取り出して、繰り返す文です。受け継いだプロパティも含まれるので、注意が必要です。
- **プロトタイプからの継承**: JavaScript のオブジェクトは、別のオブジェクトから機能を受け継ぎます。受け継いだプロパティは、`for...in` で見えてしまうことがあります。
- **`Object.prototype.hasOwnProperty.call(obj, key)`**: キーが、そのオブジェクト自身のものかを判定します。`obj.hasOwnProperty` と書くと、相手が同じ名前のメソッドを持つ場合に壊れるため、`Object.prototype` の関数を直接呼ぶ書き方を使います。
- **`++`**: 変数の値を 1 増やす演算子です。`keyCount++` は、数を 1 つ増やします。

## 何をしているか

### 1. キーを 1 つずつ見る

```ts:line-numbers=568
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
```

`for...in` でキーを順に取り出します。ここでは、まだ受け継いだものも混ざっています。

### 2. 自分のキーだけを数える

```ts:line-numbers=570
      keyCount++;
    }
  }
```

`hasOwnProperty` で、そのキーが自分自身の持ち物かを確かめます。自分のものなら、数を 1 増やします。

### 3. 結果を返す

```ts:line-numbers=574
}
```

数えた結果を、戻り値として返します。

## ここがすごい

- **受け継ぎを明示的に除く**: `hasOwnProperty` の判定で、継承されたプロパティを数えないようにしています。`for...in` の癖を、コードで正しく扱っています。
- **安全な呼び出し方**: `Object.prototype.hasOwnProperty.call` で呼ぶので、データ側が同じ名前のメソッドを持っていても、誤動作しません。
- **条件が明確**: 数える条件が `if` の 1 行に書かれているので、何を数えるかが一目で分かります。
- **補足**: 現代の JavaScript では `Object.keys(data).length` で同じ結果が得られます。この関数は、`for...in` の仕組みを明示しているので、継承の扱いを学ぶ題材として向いています。

## まとめ

- `for...in` は、受け継いだプロパティも含めて回るので、自分のキーだけを扱うには確かめが要る。
- `hasOwnProperty` は、キーが自分の持ち物かを判定する。
- 相手のオブジェクトのメソッドを直接呼ばず、`Object.prototype` の関数を `call` で使うと安全。
- 同じ結果を得る短い書き方があるときも、仕組みを理解しておくと、バグの原因を見つけやすい。

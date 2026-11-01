---
title: "JSON にそのまま書き出せるオブジェクトかを再帰で確かめる"
description: "オブジェクトが JSON として正しく表せるかを調べる関数。シンボルのキーまで拾う Reflect.ownKeys を使い、値ごとに isJSONValue と互いに呼び合って中まで確かめる。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/predicate/isJSONValue.ts
lines: [82, 103]
function: "isJSONObject"
difficulty: 2
format: 2
tags: [再帰, リフレクション, 防御的プログラミング]
---

## ひとことで

`isJSONObject(obj)` は、オブジェクトが **JSON としてそのまま表せるか** を調べます。キーがすべて文字列で、値がすべて JSON の値（文字列・数値・真偽値・`null`・配列・オブジェクト）なら `true` です。

```ts
isJSONObject({ a: 1, b: [true, null] }) // true
isJSONObject({ a: undefined })          // false
isJSONObject({ [Symbol('x')]: 1 })      // false
isJSONObject({ d: new Date() })         // false
```

同じファイルの `isJSONValue`・`isJSONArray` と **互いに呼び合う（相互再帰）** ことで、どんなに深く入れ子になっていても中まで確かめます。

## コード

```ts:line-numbers=82
export function isJSONObject(obj: unknown): obj is Record<string, any> {
  if (!isPlainObject(obj)) {
    return false;
  }

  const keys = Reflect.ownKeys(obj);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];

    if (typeof key !== 'string') {
      return false;
    }

    if (!isJSONValue(value)) {
      return false;
    }
  }

  return true;
}
```

## 前提知識

- **JSON**: データをテキストで表す形式です。使える値は文字列・数値・真偽値・`null`・配列・オブジェクトだけで、`undefined` や関数、日付は直接は表せません。
- **`Reflect.ownKeys(obj)`**: オブジェクト自身が持つキーを **すべて** 返します。文字列のキーだけでなく、シンボル（`Symbol()` で作る一意な値）のキーや、列挙されない設定のキーも含みます。
- **`isPlainObject`**: 同じライブラリの関数で、`{}` のような素のオブジェクトかどうかを判定します。
- **相互再帰**: 関数 A が関数 B を呼び、B がまた A を呼ぶ構造です。入れ子のデータを調べるのに向いています。
- **`obj is Record<string, any>`**: 型ガード。`true` が返ったら、呼び出し側でその型として扱えます。

## 何をしているか

### 1. 素のオブジェクトか

```ts:line-numbers=83
  if (!isPlainObject(obj)) {
    return false;
  }
```
日付やクラスのインスタンス、配列はここで除外されます。配列は別の関数 `isJSONArray` が担当します。

### 2. すべてのキーを取り出す

```ts:line-numbers=87
  const keys = Reflect.ownKeys(obj);
```
`Object.keys` ではなく `Reflect.ownKeys` を使っています。

### 3. キーと値を 1 つずつ確かめる

```ts:line-numbers=89
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];

    if (typeof key !== 'string') {
      return false;
    }

    if (!isJSONValue(value)) {
      return false;
    }
  }
```
- キーが文字列でなければ（シンボルなら）`false`。

```ts:line-numbers=93
    if (typeof key !== 'string') {
      return false;
    }
```

- 値を `isJSONValue` に渡し、JSON の値でなければ `false`。`isJSONValue` は値がオブジェクトなら `isJSONObject` を、配列なら `isJSONArray` を呼ぶので、入れ子の奥まで確認が進みます。

```ts:line-numbers=97
    if (!isJSONValue(value)) {
      return false;
    }
```


```
{ a: { b: [1, () => {}] } }
isJSONObject → a の値 → isJSONValue → isJSONObject → b の値 → isJSONArray → 関数を発見 → false
```

## ここがすごい

- **見えないキーも見逃さない**: `Object.keys` はシンボルのキーを返しません。もしそれで判定すると、`{ [Symbol('x')]: 1 }` が「キーがない空のオブジェクト」に見えて `true` になってしまいます。実際に `JSON.stringify` するとシンボルのキーは黙って消えるので、「そのまま書き出せる」とは言えません。`Reflect.ownKeys` で全部を見ることで、こうした取りこぼしを防いでいます。
- **1 つ見つかればすぐ終わる**: 不適格なキーや値を見つけた時点で `false` を返すので、大きなオブジェクトでも、早い段階で問題があれば残りを調べずに済みます。
- **役割を 3 つの関数に分ける**: 値全般・配列・オブジェクトをそれぞれの関数が担当し、互いに呼び合います。1 つの関数ですべてを扱うより、それぞれが短く読みやすくなっています。

## まとめ

- 「JSON にできるか」は、キーが文字列で値がすべて JSON の値かを再帰的に確かめる。
- シンボルのキーまで調べるには `Reflect.ownKeys` を使う。
- 入れ子のデータは、型ごとの関数を相互再帰させると素直に書ける。

---
title: "入れ子のオブジェクトを「a.b.c」のキーに平らにする"
description: "入れ子のオブジェクトを 1 段のオブジェクトにする flattenObject の本体。前置きのキーを引数で持ち回る再帰で、空のオブジェクトや配列を値として残す細かい配慮がある。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/object/flattenObject.ts
lines: [58, 87]
function: "flattenObjectImpl"
difficulty: 2
format: 2
tags: [再帰, データ構造, イディオム]
---

## ひとことで

`flattenObject` は、入れ子になったオブジェクトを **`'a.b.c'` のようなキーを持つ 1 段のオブジェクト** に変換します。

```ts
flattenObject({ a: { b: 1, c: [10, 20] }, d: {} })
// { 'a.b': 1, 'a.c.0': 10, 'a.c.1': 20, d: {} }
```

設定ファイルを環境変数に変換したり、フォームのフィールド名を作ったりする場面で便利です。`flattenObjectImpl` はその実際の処理で、**「ここまでのキー（前置き）」を引数で持ち回る再帰** で書かれています。

## コード

```ts:line-numbers=58
function flattenObjectImpl(
  object: object,
  prefix: string,
  delimiter: string,
  preserveArrays: boolean
): Record<string, any> {
  const result: Record<string, any> = {};
  const keys = Object.keys(object);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = (object as any)[key];

    const prefixedKey = prefix ? `${prefix}${delimiter}${key}` : key;

    if (isPlainObject(value) && Object.keys(value).length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }

    if (Array.isArray(value) && !preserveArrays && value.length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }

    result[prefixedKey] = value;
  }

  return result;
}
```

`isPlainObject` は、値が `{}` のような素のオブジェクトかどうかを判定する、同じライブラリの関数です。

## 前提知識

- **`Record<string, any>`**: 「文字列のキーで何でも入るオブジェクト」の型です。
- **`Object.keys(obj)`**: オブジェクト自身のキーの配列を返します。配列に使うと `['0', '1', …]` のように添字が文字列で返ります。
- **`Object.assign(result, other)`**: `other` のプロパティを `result` にコピーします。
- **`(object as any)[key]`**: `as any` で型チェックを外して、任意のキーで値を読んでいます。`object` 型のままだと、TypeScript はどんなキーがあるかわからないため読めません。
- **テンプレートリテラル**: `` `${prefix}${delimiter}${key}` `` は 3 つの値をつないだ文字列になります。

## 何をしているか

### 処理の流れ


キーを 1 つずつ見ていきます。

```ts:line-numbers=67
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = (object as any)[key];

    const prefixedKey = prefix ? `${prefix}${delimiter}${key}` : key;

    if (isPlainObject(value) && Object.keys(value).length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }

    if (Array.isArray(value) && !preserveArrays && value.length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }

    result[prefixedKey] = value;
  }
```


1. **新しいキーを作る**。前置きがあれば `前置き + 区切り + キー`、なければキーのままです。

```ts:line-numbers=71
    const prefixedKey = prefix ? `${prefix}${delimiter}${key}` : key;
```

2. **中身のあるオブジェクトなら潜る**。新しいキーを前置きとして再帰し、結果を `result` にまとめます。

```ts:line-numbers=73
    if (isPlainObject(value) && Object.keys(value).length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }
```

3. **中身のある配列も潜る**。ただし `preserveArrays` が指定されていたら、配列はそのまま値として残します。

```ts:line-numbers=78
    if (Array.isArray(value) && !preserveArrays && value.length > 0) {
      Object.assign(result, flattenObjectImpl(value, prefixedKey, delimiter, preserveArrays));
      continue;
    }
```

4. **それ以外は値として書き込む**。

```ts:line-numbers=83
    result[prefixedKey] = value;
```


`{ a: { b: 1 } }` の流れはこうです。

```
flattenObjectImpl({a: {b: 1}}, '')
  key 'a' → 新しいキー 'a' → 中身のあるオブジェクト → 潜る
    flattenObjectImpl({b: 1}, 'a')
      key 'b' → 新しいキー 'a.b' → 1 は値 → { 'a.b': 1 }
→ { 'a.b': 1 }
```

## ここがすごい

- **前置きを引数で渡す**: 「今どの深さにいるか」を、外側の変数ではなく引数 `prefix` で持ち回っています。再帰のどの段も、自分の担当の部分だけを見ればよく、状態の管理がとても単純になります。
- **空の入れ物を消さない**: `{ d: {} }` を素朴に処理すると、潜った先にキーが 1 つもないので `d` が結果から消えてしまいます。`Object.keys(value).length > 0` や `value.length > 0` という「中身があるときだけ潜る」条件で、空のオブジェクトや配列はそのまま値として残ります。元のデータに戻すときに情報が失われません。
- **区切り文字を選べる**: `delimiter` を `'_'` にすれば `A_B_C` 形式の環境変数名、`'/'` にすればパス形式、と用途に合わせられます。
- **配列の扱いを選べる**: 添字で平らにするか、配列のまま残すかを `preserveArrays` で選べます。

## まとめ

- 入れ子を平らにする再帰では、「ここまでのキー」を引数で持ち回ると素直に書ける。
- 中身が空の入れ物は、潜らずに値として残すと情報が失われない。
- 配列もオブジェクトと同じく「添字がキーの入れ物」として扱える。

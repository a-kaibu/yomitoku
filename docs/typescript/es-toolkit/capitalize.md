---
title: "実行時の処理と同じことを型の世界でも計算する"
description: "先頭だけ大文字・残りを小文字にする capitalize。戻り値の型も、テンプレートリテラル型と infer で同じ変換を行い、'hello' から 'Hello' 型を作る。"
language: typescript
project: "es-toolkit"
repo: https://github.com/toss/es-toolkit
license: MIT
copyright: "Copyright (c) 2024 Viva Republica, Inc."
commit: "b267f065245f2e27a1f3b19b331436bf39ef94d9"
file: src/string/capitalize.ts
lines: [13, 17]
function: "capitalize"
difficulty: 2
format: 2
tags: [型システム, 文字列処理, ジェネリクス]
---

## ひとことで

`capitalize(str)` は、文字列の **最初の 1 文字を大文字に、残りを小文字に** した文字列を返します。

```ts
capitalize('hELLO') // 'Hello'
```

実行時の処理は 1 行ですが、面白いのは最後の行の型定義です。TypeScript の型の機能だけで同じ変換を計算し、**`capitalize('hello')` の戻り値の型を、ただの `string` ではなく `'Hello'` という具体的な型にしています**。

## コード

```ts:line-numbers=13
export function capitalize<T extends string>(str: T): Capitalize<T> {
  return (str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()) as Capitalize<T>;
}

type Capitalize<T extends string> = T extends `${infer F}${infer R}` ? `${Uppercase<F>}${Lowercase<R>}` : T;
```

## 前提知識

- **リテラル型**: TypeScript では `'hello'` という特定の文字列そのものを型にできます。`'hello'` 型の変数には `'hello'` しか入りません。
- **`T extends string`**: 型引数 `T` は文字列の型（`string` や `'hello'` など）でなければならない、という制約です。
- **テンプレートリテラル型**: `` `${A}${B}` `` の形で、型の世界でも文字列をつないだり分解したりできます。
- **`infer`**: 条件型（`X extends Y ? A : B`）の中で、「ここに当てはまる部分を取り出して名前を付ける」機能です。
- **`Uppercase<F>` / `Lowercase<R>`**: TypeScript に組み込まれた、文字列のリテラル型を大文字・小文字にする型です。
- **`as Capitalize<T>`**: 型アサーション。実行時の値を、計算した型として扱うよう TypeScript に伝えます。

## 何をしているか

### 実行時の処理

```ts:line-numbers=13
export function capitalize<T extends string>(str: T): Capitalize<T> {
  return (str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()) as Capitalize<T>;
}
```
`charAt(0)` で先頭の 1 文字を取り大文字に、`slice(1)` で 2 文字目以降を取り小文字にして、つなげます。空文字列でも `charAt(0)` は `''` を返すので、エラーにはなりません。

### 型の計算

```ts:line-numbers=17
type Capitalize<T extends string> = T extends `${infer F}${infer R}` ? `${Uppercase<F>}${Lowercase<R>}` : T;
```
```ts
type Capitalize<T extends string> =
  T extends `${infer F}${infer R}` ? `${Uppercase<F>}${Lowercase<R>}` : T;
```

`` `${infer F}${infer R}` `` に文字列の型を当てはめると、TypeScript は **`F` に先頭の 1 文字、`R` に残り** を入れます。

```
T = 'hELLO' → F = 'h', R = 'ELLO' → `${'H'}${'ello'}` = 'Hello'
T = ''      → 当てはまらない → ''
T = string  → 中身がわからないので、結果も string
```

実行時の `charAt(0)` と `slice(1)` が、型の上では `F` と `R` にそのまま対応しています。

## ここがすごい

- **型が値をきちんと追いかける**: 戻り値の型が `'Hello'` になるので、たとえば `const key = capitalize('name')` を `'Name'` だけを受け取る関数に渡せます。ただの `string` だとこうはいきません。
- **実装と型が同じ形**: 「先頭 1 文字」と「残り」に分けるという考え方が、実行時のコードと型の定義で一致しています。読む人は片方を理解すれば、もう片方も理解できます。
- **組み込みと同名の型をあえて定義**: TypeScript にも `Capitalize<T>` という組み込み型がありますが、そちらは先頭を大文字にするだけで、残りを小文字にはしません。関数の挙動に合わせた型をファイル内で定義し直しています。
- **広い型にも自然に対応**: 引数が具体的でない `string` 型のときは、結果も `string` になります。特別な分岐を書かなくても、条件型の性質で正しく振る舞います。

## まとめ

- テンプレートリテラル型と `infer` で、型の世界でも文字列を分解・加工できる。
- 戻り値の型を値に合わせて計算すると、呼び出し側でより正確な型チェックが効く。
- 組み込み型と挙動が違うなら、関数に合わせた型を自分で定義する。

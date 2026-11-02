---
title: "パターンの中から、取り出す名前だけを集める再帰"
description: "ts-pattern の getSelectionKeys。入れ子になったパターンを再帰的にたどり、P.select で付けた名前を全部集める。配列とオブジェクトを同じ関数で扱っている。"
language: typescript
project: "ts-pattern"
repo: https://github.com/gvergnaud/ts-pattern
license: MIT
copyright: "Copyright (c) 2021 Gabriel Vergnaud"
commit: "f11be73acb18e1d653d4f252e7d75981d873a2e6"
file: src/internals/helpers.ts
lines: [120, 129]
function: "getSelectionKeys"
difficulty: 2
format: 2
tags: [再帰, パース, 型システム]
---

## ひとことで

`getSelectionKeys(pattern)` は、パターンの中に書かれた「取り出し名」を、すべて一覧にして返す関数です。ts-pattern では、`P.select('name')` のように名前を付けると、その値を一致したあとに取り出せます。入れ子になったパターンの奥にある名前も、この関数が全部拾います。

```ts
getSelectionKeys({ user: { name: P.select('n') }, tags: [P.select('t')] })
// ['n', 't']
```

## コード

```ts:line-numbers=120
export const getSelectionKeys = (pattern: any): string[] => {
  if (isObject(pattern)) {
    if (isMatcher(pattern)) {
      return pattern[symbols.matcher]().getSelectionKeys?.() ?? [];
    }
    if (Array.isArray(pattern)) return flatMap(pattern, getSelectionKeys);
    return flatMap(Object.values(pattern), getSelectionKeys);
  }
  return [];
};
```

## 前提知識

- **パターン（pattern）**: 値の形を書いたものです。`{ user: { name: ... } }` のように、オブジェクトや配列の形で書きます。
- **`P.select`**: パターンの中で「この場所の値を、後で名前で取り出す」と指定する関数です。
- **再帰**: 関数が自分自身を、より小さい部分に対して呼び出すことです。入れ子の深さに関係なく、すべての部分を調べられます。
- **`Object.values`**: オブジェクトの値を、配列にして返す組み込み関数です。
- **`?.()` と `?? []`**: `getSelectionKeys` という関数が存在すれば呼び、無ければ `undefined` にします。さらに `??` で、`undefined` のときは空の配列 `[]` を使います。

## 何をしているか

### 1. オブジェクトでなければ、名前は無い

```ts:line-numbers=121
  if (isObject(pattern)) {
```

数や文字列のような値は、取り出し名を持ちません。最後の `return []` で空の配列を返します。

### 2. パターンそのものなら、その名前を聞く

```ts:line-numbers=122
    if (isMatcher(pattern)) {
      return pattern[symbols.matcher]().getSelectionKeys?.() ?? [];
    }
```

`P.select` などのパターンなら、自分の持つ名前を返してもらいます。自分で名前を持たないパターンでは、`[]` になります。

### 3. 配列とオブジェクトの中身を、それぞれ調べる

```ts:line-numbers=125
    if (Array.isArray(pattern)) return flatMap(pattern, getSelectionKeys);
    return flatMap(Object.values(pattern), getSelectionKeys);
```

配列なら、要素の 1 つずつに `getSelectionKeys` を当てます。オブジェクトなら、値の一覧（`Object.values`）に当てます。どちらも、結果は名前の配列です。

## ここがすごい

- **同じ関数で入れ子を扱う**: 配列もオブジェクトも、「中身を 1 つずつ調べる」という同じ考え方で処理できます。深さが決まっていなくても、一覧が正しく集まります。
- **名前の判断をパターンに任せる**: この関数は「名前を持っているか」を自分では判断しません。`P.select` のようなパターンの中で、その答えを返してもらいます。役割が分かれているので、新しいパターンを足すのも簡単です。
- **`flatMap` で平らにする**: 途中の結果は「配列の配列」になりますが、`flatMap` で 1 つの配列にまとめています。呼び出し側は、ただの名前の一覧として受け取れます。
- **`?.()` で古い実装にも対応**: 存在しないメソッドを安全に呼ぶので、この関数を持たないパターンでも、エラーにならず空の一覧が返ります。

## まとめ

- 入れ子のパターンは、再帰で末端まで調べると、取り出し名を全部集められる。
- 配列とオブジェクトは「中身を 1 つずつ調べる」で同じように扱える。
- 名前を持つかどうかはパターン自身に決めさせると、役割が分かれて拡張しやすい。
- `?.()` と `??` を組み合わせると、無いものを安全に既定の値に置き換えられる。

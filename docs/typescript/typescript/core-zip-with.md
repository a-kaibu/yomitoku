---
title: "2 つの配列を同じ位置どうしで組み合わせる"
description: "TypeScript コンパイラの zipWith。2 つの配列の同じ位置の要素を、コールバックに渡して新しい配列を作る。長さが違うと開発時にだけ検査で止まる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [106, 113]
function: "zipWith"
difficulty: 1
format: 2
tags: [イテレータ, ジェネリクス, データ構造]
---

## ひとことで

`zipWith(arrayA, arrayB, callback)` は、2 つの配列の同じ位置にある要素を組にして、コールバックで 1 つの値にまとめ、その結果の配列を返す関数です。ファスナー（zip）で左右の歯を噛み合わせるように、2 つの列をまとめることから名付けられています。

```ts
zipWith([1, 2], ['a', 'b'], (n, s) => s + n)  // ['a1', 'b2']
```

## コード

```ts:line-numbers=106
export function zipWith<T, U, V>(arrayA: readonly T[], arrayB: readonly U[], callback: (a: T, b: U, index: number) => V): V[] {
    const result: V[] = [];
    Debug.assertEqual(arrayA.length, arrayB.length);
    for (let i = 0; i < arrayA.length; i++) {
        result.push(callback(arrayA[i], arrayB[i], i));
    }
    return result;
}
```

## 前提知識

- **ジェネリクス `<T, U, V>`**: 3 つの型を、呼び出しごとに決める書き方です。`T` と `U` が入力の要素の型、`V` が結果の要素の型です。
- **コールバック**: 関数を引数として渡し、中で呼んでもらう仕組みです。ここでは、2 つの要素を受け取って 1 つの値を返す関数を渡します。
- **`Debug.assertEqual`**: TypeScript コンパイラの内部で使われる検査の関数です。2 つの値が等しいことを確かめ、違えば開発中にエラーで知らせます。
- **`readonly T[]`**: 読み取り専用の配列の型です。この関数が配列を書き換えないことを示します。

## 何をしているか

### 1. 長さが同じことを確かめる

```ts:line-numbers=108
    Debug.assertEqual(arrayA.length, arrayB.length);
```

2 つの配列の長さが違うと、組にならない要素が出てしまいます。この検査で、その誤りを早く見つけます。

### 2. 同じ位置の要素を組にしてコールバックに渡す

```ts:line-numbers=109
    for (let i = 0; i < arrayA.length; i++) {
        result.push(callback(arrayA[i], arrayB[i], i));
    }
```

`i` 番目の要素どうしを取り出して、コールバックに渡します。その戻り値を結果の配列に入れます。`i` も一緒に渡すので、位置に応じた処理もできます。

## ここがすごい

- **組み合わせを関数に任せる**: 配列を組にする処理を、コールバックという形で外に出しています。足し算でも、文字列の連結でも、同じ関数で書けます。
- **長さの不一致を明示的に検査**: 黙って短い方に合わせるのではなく、検査で止めます。コンパイラのように、正しさが大切な場面に向いた作りです。
- **結果の長さが予測できる**: 結果は、入力の長さと同じになります。呼び出し側は、後の処理を安心して書けます。
- **ループが単純**: 添字で回す普通の `for` 文です。特別な仕組みを使わず、読みやすさを優先しています。

## まとめ

- 2 つの配列の対応する要素を組み合わせるには、位置を揃えてコールバックを呼ぶ。
- 長さが同じかの検査を入れると、ずれによる誤りを早く見つけられる。
- 組み合わせの方法をコールバックで渡すと、同じ関数で様々な処理を書ける。
- 結果の長さが入力と同じになることを守ると、呼び出し側が楽になる。

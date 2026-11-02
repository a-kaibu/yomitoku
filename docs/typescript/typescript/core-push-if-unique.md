---
title: "配列に同じ値がなければ追加し、追加できたかを返す"
description: "TypeScript コンパイラの pushIfUnique。配列の中に同じ値が無いときだけ末尾に追加し、追加したかどうかを true か false で返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1003, 1011]
function: "pushIfUnique"
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`pushIfUnique(array, toAdd, equalityComparer?)` は、配列に値を追加します。ただし、同じ値が既に入っていれば追加せず、`false` を返します。配列を重複のない一覧として育てたいときに使われます。

```ts
const list = [1, 2]
pushIfUnique(list, 3)  // true（list は [1, 2, 3]）
pushIfUnique(list, 2)  // false（list は変わらない）
```

## コード

```ts:line-numbers=1003
export function pushIfUnique<T>(array: T[], toAdd: T, equalityComparer?: EqualityComparer<T>): boolean {
    if (contains(array, toAdd, equalityComparer)) {
        return false;
    }
    else {
        array.push(toAdd);
        return true;
    }
}
```

## 前提知識

- **`contains`**: 配列に値が含まれるかを判定する、コンパイラの内部関数です。`equalityComparer` を渡すと、比べ方を変えられます。
- **`equalityComparer`**: 2 つの値が「同じ」かを判定する関数です。省略すると、既定の比べ方が使われます。
- **`push`**: 配列の末尾に値を追加するメソッドです。
- **`if … else`**: 条件によって、2 つの処理のどちらかを選ぶ文です。

## 何をしているか

### 1. 同じ値が含まれるかを調べる

```ts:line-numbers=1004
    if (contains(array, toAdd, equalityComparer)) {
```

`contains` で、追加しようとする値が既に配列にあるかを調べます。ある場合は、後の処理に進みません。

### 2. 無ければ追加して true

```ts:line-numbers=1005
        return false;
    }
    else {
        array.push(toAdd);
        return true;
```

既に含まれていれば `false` を返します。含まれていなければ、`push` で末尾に追加し、`true` を返します。

## ここがすごい

- **追加と判定を 1 回で**: 「あれば追加しない、無ければ追加する」を 1 つの関数で行い、結果も返します。呼び出し側は分岐を書かなくて済みます。
- **比べ方を差し替えられる**: `equalityComparer` を渡せば、オブジェクトの一部だけを比べるなど、独自の基準で重複を判定できます。
- **戻り値で結果が分かる**: `true` と `false` で、実際に追加されたかが分かります。ログや後続の処理に役立ちます。
- **コンパイラの多くの場所で使われる**: 型の一覧や、ファイルの一覧など、重複を避けたい集まりを育てるときの共通の道具になっています。

## まとめ

- 重複のない配列を育てるには、追加の前に含まれているかを確かめる。
- 比べ方を引数で差し替えられると、用途に応じた重複の判定ができる。
- 追加の成否を戻り値で返すと、呼び出し側が結果を使いやすい。
- 配列を重複なしに保つ仕組みは、集合（`Set`）の代わりに配列を使う場面で役立つ。

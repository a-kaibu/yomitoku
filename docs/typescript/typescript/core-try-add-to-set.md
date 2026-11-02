---
title: "Set に入っていなければ入れて、入れたかどうかを返す"
description: "TypeScript コンパイラの tryAddToSet。Set に値が無ければ追加し、追加したら true を返す。既にあれば何もせず false を返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [529, 535]
function: "tryAddToSet"
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, ハッシュ]
---

## ひとことで

`tryAddToSet(set, value)` は、`Set` に値を追加しようとして、実際に追加されたかを `true` か `false` で返す関数です。既に入っていれば何もせず `false` を返します。「初めて見た値かどうか」を、1 回の関数呼び出しで判定できます。

```ts
const seen = new Set<string>()
tryAddToSet(seen, 'a')  // true（初めて）
tryAddToSet(seen, 'a')  // false（既にある）
```

## コード

```ts:line-numbers=529
export function tryAddToSet<T>(set: Set<T>, value: T): boolean {
    if (!set.has(value)) {
        set.add(value);
        return true;
    }
    return false;
}
```

## 前提知識

- **`Set`**: 同じ値を 2 つ持てない、組み込みのコレクションです。値の存在を素早く調べられます。
- **`has` と `add`**: `has(value)` は値があるかを、`add(value)` は値を追加します。
- **戻り値で結果を伝える**: 関数が「何をしたか」を `true` / `false` で返すと、呼び出し側は次の分岐を書きやすくなります。
- **`!`**: 条件を反転させる演算子です。`!set.has(value)` は「まだ無い」を表します。

## 何をしているか

### 1. まだ無いかを確かめる

```ts:line-numbers=530
    if (!set.has(value)) {
```

`set.has(value)` で値があるかを調べ、無い場合だけ次に進みます。

### 2. 追加して true を返す

```ts:line-numbers=531
        set.add(value);
        return true;
```

`add` で値を入れてから、`true` を返します。この `true` が、「新しく入れた」という結果になります。

### 3. 既にあれば false

```ts:line-numbers=534
    return false;
```

既に入っていたときは、何もせずに `false` を返します。

## ここがすごい

- **確認と追加を 1 つにまとめる**: 「無いなら入れる」という 2 段階の処理を、1 回の呼び出しで行えます。呼び出し側は、結果を見るだけでよくなります。
- **重複の検出に使える**: 走査の途中で `tryAddToSet` が `false` を返したら、それが重複です。重複を見つけつつ、集合を作れます。
- **名前の「try」の意味**: 「追加を試みて、できたかを返す」という意味が名前に表れています。失敗を例外にせず、戻り値で伝えます。
- **`Set` の性質に任せる**: 重複の判定は `Set` の仕組みに任せ、関数はその結果を戻り値にするだけです。

## まとめ

- 「初めてかどうか」は、追加の成否を戻り値にすると 1 回の呼び出しで判定できる。
- 重複の検出と集合の作成を、同じ関数でまとめて行える。
- 失敗を例外にせず、戻り値の `true` / `false` で伝えると、使いやすい。
- 集合の性質を活かすと、判定の仕組みを自分で書かずに済む。

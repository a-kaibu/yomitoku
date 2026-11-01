---
title: "並べ替え済みなら「直前と同じか」だけで重複を消せる"
description: "並べ替え済みの配列から重複を取り除く関数。直前に残した要素とだけ比べればよく、真偽値を返す比較と大小を返す比較の両方を switch 1 つで扱っている。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [735, 760]
function: "deduplicateSorted"
difficulty: 2
format: 2
tags: [アルゴリズム, ソート, 防御的プログラミング]
---

## ひとことで

`deduplicateSorted` は、**並べ替え済みの配列** から重複を取り除いた配列を返します。

```
[1, 1, 2, 3, 3, 3, 4] → [1, 2, 3, 4]
```

並べ替え済みなら、同じ値は必ず隣り合っています。なので、**直前に残した値と比べるだけ** で重複を見つけられます。さらにこの関数は、「等しいかどうか」を返す比較関数と、「大小」を返す比較関数の **どちらでも** 使えるように書かれています。

## コード

::: code-group

```ts:line-numbers=735 [日本語訳]
function deduplicateSorted<T>(array: SortedReadonlyArray<T>, comparer: EqualityComparer<T> | Comparer<T>): SortedReadonlyArray<T> {
    if (array.length === 0) return emptyArray as any as SortedReadonlyArray<T>;

    let last = array[0];
    const deduplicated: T[] = [last];
    for (let i = 1; i < array.length; i++) {
        const next = array[i];
        switch (comparer(next, last)) {
            // // 等しさの比較
            case true:

            // // 大小の比較
            // // falls through（次の case に続けて進む）
            case Comparison.EqualTo:
                continue;

            case Comparison.LessThan:
                // // 並べ替え済みなら、next が last より小さいことは決してありえない。
                return Debug.fail("Array is unsorted.");
        }

        deduplicated.push(last = next);
    }

    return deduplicated as any as SortedReadonlyArray<T>;
}
```

```ts:line-numbers=735 [原文]
function deduplicateSorted<T>(array: SortedReadonlyArray<T>, comparer: EqualityComparer<T> | Comparer<T>): SortedReadonlyArray<T> {
    if (array.length === 0) return emptyArray as any as SortedReadonlyArray<T>;

    let last = array[0];
    const deduplicated: T[] = [last];
    for (let i = 1; i < array.length; i++) {
        const next = array[i];
        switch (comparer(next, last)) {
            // equality comparison
            case true:

            // relational comparison
            // falls through
            case Comparison.EqualTo:
                continue;

            case Comparison.LessThan:
                // If `array` is sorted, `next` should **never** be less than `last`.
                return Debug.fail("Array is unsorted.");
        }

        deduplicated.push(last = next);
    }

    return deduplicated as any as SortedReadonlyArray<T>;
}
```

:::

## 前提知識

- **`EqualityComparer<T>`**: 2 つの値を受け取り、等しければ `true` を返す関数の型です。
- **`Comparer<T>`**: 2 つの値の大小を `Comparison.LessThan`（-1）・`EqualTo`（0）・`GreaterThan`（1）で返す関数の型です。
- **`SortedReadonlyArray<T>`**: 「並べ替え済み」という印が付いた配列の型です。実体はふつうの配列ですが、型を分けることで「並べ替え済みの配列しか渡せない」ようにしています。
- **`switch` のフォールスルー**: `case` の最後に `break` などを書かないと、次の `case` の処理に続けて進みます。この関数の `switch` では、`true` の場合も `EqualTo` の場合も同じ `continue` に行き着きます。
- **`deduplicated.push(last = next)`**: 代入の式は、代入した値になります。`last` を更新しつつ、その値を配列に追加しています。

## 何をしているか

### 1. 空なら空の配列

```ts:line-numbers=736
    if (array.length === 0) return emptyArray as any as SortedReadonlyArray<T>;
```
`emptyArray` は使い回し用の空の配列です。

### 2. 先頭を残す

```ts:line-numbers=738
    let last = array[0];
    const deduplicated: T[] = [last];
```
### 3. 直前と比べる

```ts:line-numbers=740
    for (let i = 1; i < array.length; i++) {
        const next = array[i];
        switch (comparer(next, last)) {
            // equality comparison
            case true:

            // relational comparison
            // falls through
            case Comparison.EqualTo:
                continue;

            case Comparison.LessThan:
                // If `array` is sorted, `next` should **never** be less than `last`.
                return Debug.fail("Array is unsorted.");
        }

        deduplicated.push(last = next);
    }
```
各要素を、**直前に残した要素** `last` と比べます。

- 等しい（`true` または `EqualTo`）→ 重複なので飛ばす。
- `LessThan`（前より小さい）→ 並べ替え済みならありえないので、エラーで止める。
- それ以外（`false` または `GreaterThan`）→ 新しい値なので残して、`last` を更新。

## ここがすごい

- **比べるのは直前の 1 つだけ**: 並べ替え済みであることを利用して、1 回の走査で重複を消せます。`Set` などを使う必要もありません。
- **2 種類の比較関数を 1 つの `switch` で**: 真偽値の比較関数は `true` / `false` を、大小の比較関数は `-1` / `0` / `1` を返します。`switch` は値の種類を問わず `===` で比べるので、`case true:` と `case Comparison.EqualTo:` を並べるだけで両方に対応できます。`false` や `GreaterThan` はどの `case` にも当てはまらず、そのまま `switch` の後ろの `push` に進みます。
- **前提が崩れたら大声で知らせる**: 大小の比較関数を使っていて「前より小さい」が出たら、配列が並べ替えられていなかったということです。黙って間違った結果を返すのではなく、`Debug.fail` で止めます。`case Comparison.LessThan:` の下のコメントでその理由も書かれています。
- **フォールスルーをコメントで明示**: `// falls through` というコメントは、「`break` の書き忘れではなく、わざと次に進めている」ことを読む人とチェックツールに伝えています。

## まとめ

- 並べ替え済みの配列の重複は、直前の値と比べるだけで取り除ける。
- `switch` は値を `===` で比べるので、型の違う結果をまとめて扱える。
- 前提（並べ替え済み）が崩れていたら、黙らずにエラーで知らせる。

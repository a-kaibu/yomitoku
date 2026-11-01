---
title: "変換しても何も変わらなければ同じ配列を返す map"
description: "各要素を変換する map だが、すべての要素が変換前と同じものになった場合は新しい配列を作らない。初めて違う値が出た時点でコピーを始める遅延コピーの手法。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [350, 366]
function: "sameMap"
difficulty: 2
tags: [最適化, メモリ管理, コンパイラ]
---

## ひとことで

`sameMap(array, f)` は、標準の `map` と同じく各要素を `f` で変換した配列を返します。ただし、**すべての要素が変換前と同じもの（`===`）になったら、新しい配列を作らずに元の配列を返します**。

338〜340 行目のコメントにある「すべての要素が自分自身に写るなら確保を避ける」が、この関数の目的です。

## コード

```ts:line-numbers=350
export function sameMap<T, U = T>(array: readonly T[] | undefined, f: (x: T, i: number) => U): readonly U[] | undefined {
    if (array !== undefined) {
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            const mapped = f(item, i);
            if (item as unknown !== mapped) {
                const result: U[] = array.slice(0, i) as unknown[] as U[];
                result.push(mapped);
                for (i++; i < array.length; i++) {
                    result.push(f(array[i], i));
                }
                return result;
            }
        }
    }
    return array as unknown[] as U[];
}
```

## 前提知識

- **`map`**: 配列の各要素を関数で変換した、新しい配列を作る操作です。
- **`U = T`**: 型引数の既定値です。変換後の型 `U` を省略すると、変換前と同じ型 `T` になります。
- **`item as unknown !== mapped`**: `item`（`T` 型）と `mapped`（`U` 型）は型が違うかもしれないので、TypeScript はそのままの比較を許さないことがあります。いったん `unknown` にしてから比べています。
- **`array as unknown[] as U[]`**: 型だけを読み替える二重のキャストです。実行時には何もしません。
- **`for (i++; …)`**: `for` の初期化部分で `i` を 1 進めています。外側のループの `i` をそのまま引き継いで、続きから処理しています。

## 何をしているか

### 1. 変化が出るまで調べる（352〜354 行目）

先頭から変換していき、結果が元の要素と同じかを確かめます。

### 2. 初めて違ったら、そこからコピーを作る（355〜362 行目）

- `slice(0, i)` で、ここまでの「変わらなかった」要素をまとめてコピーします（356 行目）。
- 今変換した値を追加します（357 行目）。
- 残りの要素は、もう比べずに変換して追加していきます（358〜360 行目）。

### 3. 最後まで変わらなかったら元の配列（365 行目）

```
sameMap([a, b, c], x => x)          → 元の配列そのもの
sameMap([a, b, c], x => x === b ? B : x) → [a, B, c]（新しい配列）
```

## ここがすごい

- **構文木の変換にぴったり**: コンパイラは、プログラムを表す木構造（構文木）を変換する処理を大量に行います。たとえば「型注釈を取り除く」変換では、多くのノードは何も変わりません。子ノードの配列が変わらなければ、親ノードも作り直す必要がなく、元の木をそのまま使い回せます。その判定が `===` 1 回で済むのは、この関数が「変わらなければ同じ配列を返す」からです。
- **必要になるまでコピーしない**: 最初からコピーを用意するのではなく、違いが出た瞬間に初めてコピーを作ります。この考え方は「コピーオンライト（書き込むときにコピー）」に近いものです。
- **途中から比較をやめる**: いったんコピーを作ったら、もう元の配列を返すことはないので、残りの要素は比べずにただ変換します（359 行目）。無駄な比較を省いています。

## まとめ

- 「変わらなかったら元のものを返す」は、木構造の変換で使い回しを可能にする。
- コピーは違いが出たときに初めて作れば、変化がない場合のコストはゼロになる。
- 結果が `===` で同じかどうかで、変化の有無をすぐに判断できる。

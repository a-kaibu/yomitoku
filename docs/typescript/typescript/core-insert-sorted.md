---
title: "二分探索の「~」で挿入位置まで一緒に受け取る"
description: "並び順を保ったまま配列に要素を挿入する insertSorted。見つからなかったときに挿入位置のビット反転を返す二分探索の約束を利用して、探索 1 回で場所を決める。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [768, 802]
function: "insertSorted"
difficulty: 2
tags: [探索, ビット演算, データ構造]
---

## ひとことで

`insertSorted(array, insert, compare)` は、**並べ替え済みの配列に、並び順を崩さないように要素を挿入する** 関数です。

```ts
const a = [1, 3, 5]
insertSorted(a, 4, compareValues) // a は [1, 3, 4, 5]
```

挿入する場所は二分探索で見つけます。ポイントは、使っている `binarySearch` が「見つからなかったら、**挿入すべき位置をビット反転した負の数** を返す」という約束になっていることです。

## コード

```ts:line-numbers=768
export function insertSorted<T>(
    array: SortedArray<T>,
    insert: T,
    compare: Comparer<T>,
    equalityComparer?: EqualityComparer<T>,
    allowDuplicates?: boolean,
): boolean {
    if (array.length === 0) {
        array.push(insert);
        return true;
    }

    const insertIndex = binarySearch(array, insert, identity, compare);
    if (insertIndex < 0) {
        if (equalityComparer && !allowDuplicates) {
            const idx = ~insertIndex;
            if (idx > 0 && equalityComparer(insert, array[idx - 1])) {
                return false;
            }
            if (idx < array.length && equalityComparer(insert, array[idx])) {
                array.splice(idx, 1, insert);
                return true;
            }
        }
        array.splice(~insertIndex, 0, insert);
        return true;
    }

    if (allowDuplicates) {
        array.splice(insertIndex, 0, insert);
        return true;
    }

    return false;
}
```

`binarySearch` は同じファイルにある二分探索の関数で、見つかればその位置を、見つからなければ `~挿入位置`（負の数）を返します。

## 前提知識

- **二分探索**: 並べ替え済みの配列で、真ん中と比べて範囲を半分ずつ絞り込む探し方です。100 万個でも 20 回ほどの比較で見つかります。
- **`~x`（ビット反転）**: すべてのビットを反転させる演算子です。整数では `~x` は `-x - 1` に等しく、`~0 = -1`、`~2 = -3` です。もう一度 `~` を付けると元に戻ります（`~~2 = 2`）。
- **`array.splice(位置, 削除数, 追加する要素)`**: 配列の途中を削除したり、要素を差し込んだりします。`splice(2, 0, x)` は 2 番目に `x` を差し込み、`splice(2, 1, x)` は 2 番目を `x` に置き換えます。
- **`Comparer<T>` / `EqualityComparer<T>`**: 大小を比べる関数と、等しいかどうかだけを判定する関数の型です。

## 何をしているか

### 1. 空なら追加するだけ（775〜778 行目）

### 2. 二分探索（780 行目）

### 3. 見つからなかった場合（781〜794 行目）

`insertIndex` が負なので、`~insertIndex` が挿入位置です。`[1, 3, 5]` に `4` を探すと、`4` は位置 2 に入るべきなので `~2 = -3` が返り、`~(-3) = 2` で位置が取り出せます。

重複を許さない設定で `equalityComparer` があるときは、挿入位置の前後に「大小では違うが、等しいとみなすもの」がないかも確かめます（782〜791 行目）。前にあれば挿入しない、後ろにあれば置き換えます。

### 4. 見つかった場合（796〜801 行目）

重複を許すなら挿入し、許さないなら何もしないで `false` を返します。

## ここがすごい

- **1 つの数で 2 つの情報を返す**: 位置は 0 以上なので、負の数は「見つからなかった」の印として使えます。でも `-1` を返すだけだと、挿入位置がわからず、もう一度探す必要があります。`~` で位置を負の数に写せば、「見つからなかった」と「どこに入れるべきか」を 1 つの数で同時に返せます。しかも `~` は自分の逆なので、取り出すのも `~` 1 回です。この約束は .NET の `Array.BinarySearch` などでも使われている定番の設計です。
- **`-x` ではなく `~x` を使う理由**: 単純に `-位置` を返すと、位置 0 のときに `-0` になり、「見つかった位置 0」と区別できません。`~0 = -1` なら必ず負になります。
- **並べ替え済みを保つ**: 挿入のたびに全体を並べ替えるより、ずっと速く済みます。

## まとめ

- 二分探索で「見つからなかった」ときに `~挿入位置` を返すと、情報を失わずに済む。
- `~x = -x - 1` なので、0 も含めて必ず負の数になり、`~` でもとに戻せる。
- 並べ替え済みの配列への追加は、二分探索 + `splice` で順序を保てる。

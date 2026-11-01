---
title: "見つからなければ挿入位置を ~ で返す二分探索"
description: "並べ替え済みの配列からキーを探す二分探索。真ん中の計算であふれを避け、見つからないときは「ここに入るはず」という位置をビット反転して返す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [1202, 1225]
function: "binarySearchKey"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, ビット演算]
---

## ひとことで

`binarySearchKey` は、**並べ替え済みの配列** から、指定したキーを持つ要素を探す二分探索です。見つかればその位置を返します。

見つからなかったときは単に `-1` を返すのではなく、**「この位置に入るはず」という位置をビット反転した負の数** を返します。呼び出し側は `~結果` で挿入位置を取り出せます。

```
配列のキー: [10, 20, 30]
探す 20 → 1
探す 25 → ~2 = -3（25 は位置 2 に入るべき）
```

## コード

```ts:line-numbers=1202
export function binarySearchKey<T, U>(array: readonly T[], key: U, keySelector: (v: T, i: number) => U, keyComparer: Comparer<U>, offset?: number): number {
    if (!some(array)) {
        return -1;
    }

    let low = offset ?? 0;
    let high = array.length - 1;
    while (low <= high) {
        const middle = low + ((high - low) >> 1);
        const midKey = keySelector(array[middle], middle);
        switch (keyComparer(midKey, key)) {
            case Comparison.LessThan:
                low = middle + 1;
                break;
            case Comparison.EqualTo:
                return middle;
            case Comparison.GreaterThan:
                high = middle - 1;
                break;
        }
    }

    return ~low;
}
```

## 前提知識

- **二分探索**: 並べ替え済みの配列で、真ん中の値と比べて「左半分か右半分か」を決め、範囲を半分ずつ絞り込む方法です。
- **`keySelector`**: 要素から比較に使うキーを取り出す関数です。要素そのものではなくキーで探せるので、オブジェクトの配列を「位置」や「名前」で探せます。
- **`Comparison.LessThan` など**: 比較の結果を表す列挙型（名前の付いた定数の集まり）で、`-1`・`0`・`1` を表します。
- **`>> 1`**: 右に 1 ビットずらす演算で、整数を 2 で割って切り捨てるのと同じです。
- **`~x`**: ビット反転。整数では `-x - 1` に等しく、必ず符号が反転します。
- **`offset ?? 0`**: `offset` が省略されていたら 0 を使います。

## 何をしているか

### 1. 空の配列なら -1

```ts:line-numbers=1203
    if (!some(array)) {
        return -1;
    }
```
`-1` は `~0` なので、「位置 0 に入るはず」という意味にもなっています。

### 2. 範囲を絞り込む

```ts:line-numbers=1207
    let low = offset ?? 0;
    let high = array.length - 1;
    while (low <= high) {
        const middle = low + ((high - low) >> 1);
        const midKey = keySelector(array[middle], middle);
        switch (keyComparer(midKey, key)) {
            case Comparison.LessThan:
                low = middle + 1;
                break;
            case Comparison.EqualTo:
                return middle;
            case Comparison.GreaterThan:
                high = middle - 1;
                break;
        }
    }
```
`low` から `high` が探す範囲です。真ん中の位置を計算し、そのキーと比べます。

```ts:line-numbers=1210
        const middle = low + ((high - low) >> 1);
```


- 真ん中のほうが小さい → 右半分を探す（`low = middle + 1`）
- 等しい → 見つかった
- 真ん中のほうが大きい → 左半分を探す（`high = middle - 1`）

### 3. 見つからなかったら `~low`

```ts:line-numbers=1224
    return ~low;
```
ループを抜けたとき、`low` は「探しているキーより大きい最初の位置」を指しています。これがまさに挿入すべき位置です。

`[10, 20, 30]` で 25 を探す例です。

```
low=0, high=2 → middle=1 (20 < 25) → low=2
low=2, high=2 → middle=2 (30 > 25) → high=1
low > high で終了 → ~2 = -3
```

## ここがすごい

- **あふれない真ん中の計算**: `(low + high) / 2` と書くと、非常に大きな配列では `low + high` が整数の上限を超えるおそれがあります（Java などで実際に起きた有名なバグです）。`low + ((high - low) >> 1)` なら、差を半分にしてから足すので超えません。JavaScript の数値では起きにくい問題ですが、定番の安全な書き方を守っています。
- **失敗しても情報を返す**: `~low` を返すことで、呼び出し側は探索をやり直さずに挿入位置がわかります。`insertSorted` のような関数がこれを活用しています。
- **0 の位置も区別できる**: `-low` だと、位置 0 のときに `-0` となり、見つかった場合の 0 と区別できません。`~0 = -1` なので、見つからなかった場合は必ず負になります。
- **キーで探せる**: `keySelector` を受け取ることで、1 つの関数をさまざまな配列で再利用できます。

## まとめ

- 二分探索は真ん中と比べて範囲を半分ずつにする。真ん中は `low + ((high - low) >> 1)` で安全に求める。
- 見つからなかったときの `low` は、ちょうど挿入位置になっている。
- `~位置` を返すと、「見つからなかった」と「挿入位置」を同時に伝えられる。

---
title: "条件を満たす連続した区間を、見つけた順に通知する"
description: "TypeScript コンパイラの getRangesWhere。配列の中で、条件を満たす要素が連続している区間を見つけ、そのたびにコールバックに開始と終了の位置を渡す。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [639, 653]
function: "getRangesWhere"
difficulty: 3
format: 2
tags: [探索, イテレータ, アルゴリズム]
---

## ひとことで

`getRangesWhere(arr, pred, cb)` は、配列の中で条件 `pred` を満たす要素が連続している区間を探し、見つけた区間ごとに `cb` を呼ぶ関数です。`cb` には、区間の開始位置と、区間の終わりの次の位置が渡されます。戻り値はなく、結果はコールバックで受け取ります。

```ts
getRangesWhere([1, 2, 5, 6, 7, 9], (x) => x >= 5, (s, e) => console.log(s, e))
// 2 5（[5, 6, 7] の区間）
```

## コード

```ts:line-numbers=639
export function getRangesWhere<T>(arr: readonly T[], pred: (t: T) => boolean, cb: (start: number, afterEnd: number) => void): void {
    let start: number | undefined;
    for (let i = 0; i < arr.length; i++) {
        if (pred(arr[i])) {
            start = start === undefined ? i : start;
        }
        else {
            if (start !== undefined) {
                cb(start, i);
                start = undefined;
            }
        }
    }
    if (start !== undefined) cb(start, arr.length);
}
```

## 前提知識

- **区間（範囲）**: 連続した要素のまとまりです。開始位置と、終わりの次の位置で表すと、長さの計算がしやすくなります。
- **`undefined` を状態に使う**: `start` は、区間が始まっていないときは `undefined` です。その有無で、今区間の中かどうかを表しています。
- **コールバック**: 結果を戻り値ではなく、関数に渡して受け取る形です。区間が見つかるたびに、すぐ処理できます。
- **終わりの次の位置（半開区間）**: `afterEnd` は、区間に含まれない位置です。`[start, afterEnd)` の形で、長さが `afterEnd - start` になります。

## 何をしているか

### 1. 条件を満たすなら、区間の開始を記録する

```ts:line-numbers=641
    for (let i = 0; i < arr.length; i++) {
        if (pred(arr[i])) {
            start = start === undefined ? i : start;
        }
```

要素が条件を満たしたとき、まだ区間が始まっていなければ、その位置を `start` に記録します。すでに始まっていれば、そのまま続けます。

### 2. 条件が途切れたら、区間を通知する

```ts:line-numbers=645
        else {
            if (start !== undefined) {
                cb(start, i);
                start = undefined;
            }
        }
```

条件を満たさない要素が来て、区間が始まっていたら、`cb(start, i)` で区間を通知します。そのあと `start` を `undefined` に戻します。

### 3. 配列の終わりで区切る

```ts:line-numbers=652
    if (start !== undefined) cb(start, arr.length);
```

配列の末尾まで条件が続いていた場合は、末尾の位置を終わりとして通知します。

## ここがすごい

- **1 回の走査で全部の区間が分かる**: 区間の開始と終了を、1 つの変数の有無で追跡します。二重のループが不要です。
- **通知の形で結果を返す**: 区間の数が分からなくても、見つかった順に処理できます。配列を作るコストも省けます。
- **半開区間の規則**: 終わりを「含まれない位置」で返すので、長さの計算が引き算だけで済みます。境界の誤りが起きにくい形です。
- **末尾の処理を忘れない**: 配列の終わりで区間が続いていても、最後に通知します。見落としを防ぐ、丁寧な作りです。

## まとめ

- 連続した区間を見つけるには、開始位置を 1 つの変数で追跡すると簡単。
- 結果はコールバックで通知すると、区間の数に関係なく処理できる。
- 区間の終わりを「含まれない位置」で表すと、長さの計算が簡単になる。
- 走査の終わりでの区切りを忘れないことが、正しい区間の抽出に欠かせない。

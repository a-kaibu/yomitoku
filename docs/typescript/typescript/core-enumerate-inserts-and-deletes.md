---
title: "並んだ 2 つのリストを同時になめて差分を取る"
description: "並べ替え済みの新旧 2 つの配列を比べて、追加・削除・変化なしを通知する関数。2 本の指を同時に進めるマージの手法で、1 回の走査だけで差分がわかる。"
language: typescript
project: "TypeScript"
repo: https://github.com/microsoft/TypeScript
license: Apache-2.0
copyright: "Copyright (c) Microsoft Corporation. All rights reserved."
commit: "c63de15a992d37f0d6cec03ac7631872838602cb"
file: src/compiler/core.ts
lines: [2490, 2526]
function: "enumerateInsertsAndDeletes"
difficulty: 2
format: 2
tags: [アルゴリズム, 探索, 設計パターン]
---

## ひとことで

`enumerateInsertsAndDeletes` は、**並べ替え済みの新しいリストと古いリストを比べて**、何が追加され、何が削除され、何が変わらなかったかを、コールバックで知らせる関数です。

```
古い: [a, c, d]
新しい: [a, b, d, e]
→ 変化なし a、追加 b、削除 c、変化なし d、追加 e
```

TypeScript のエディタ支援では、監視しているファイルの一覧が変わったときなどに、こうした差分の計算が必要になります。両方が並んでいることを利用して、**1 回の走査** で差分を求めています。

## コード

```ts:line-numbers=2490
export function enumerateInsertsAndDeletes<T, U>(newItems: readonly T[], oldItems: readonly U[], comparer: (a: T, b: U) => Comparison, inserted: (newItem: T) => void, deleted: (oldItem: U) => void, unchanged?: (oldItem: U, newItem: T) => void): boolean {
    unchanged ??= noop;
    let newIndex = 0;
    let oldIndex = 0;
    const newLen = newItems.length;
    const oldLen = oldItems.length;
    let hasChanges = false;
    while (newIndex < newLen && oldIndex < oldLen) {
        const newItem = newItems[newIndex];
        const oldItem = oldItems[oldIndex];
        const compareResult = comparer(newItem, oldItem);
        if (compareResult === Comparison.LessThan) {
            inserted(newItem);
            newIndex++;
            hasChanges = true;
        }
        else if (compareResult === Comparison.GreaterThan) {
            deleted(oldItem);
            oldIndex++;
            hasChanges = true;
        }
        else {
            unchanged(oldItem, newItem);
            newIndex++;
            oldIndex++;
        }
    }
    while (newIndex < newLen) {
        inserted(newItems[newIndex++]);
        hasChanges = true;
    }
    while (oldIndex < oldLen) {
        deleted(oldItems[oldIndex++]);
        hasChanges = true;
    }
    return hasChanges;
}
```

## 前提知識

- **コールバック**: 引数として渡す関数です。ここでは「追加を見つけたら `inserted` を呼ぶ」のように、見つけたものの処理を呼び出し側に任せています。
- **`comparer: (a: T, b: U) => Comparison`**: 新旧の要素を比べて、小さい・等しい・大きいを返す関数です。新旧で型が違ってもよいように、`T` と `U` を別にしています。
- **`unchanged ??= noop`**: `??=` は「左が `null` か `undefined` なら右を代入する」演算子です。`noop` は何もしない関数です。省略された `unchanged` を、何もしない関数に置き換えています。
- **`newItems[newIndex++]`**: 現在の位置の要素を取り出してから、位置を 1 進めます。

## 何をしているか

### 1. 両方に要素が残っている間

```ts:line-numbers=2497
    while (newIndex < newLen && oldIndex < oldLen) {
        const newItem = newItems[newIndex];
        const oldItem = oldItems[oldIndex];
        const compareResult = comparer(newItem, oldItem);
        if (compareResult === Comparison.LessThan) {
            inserted(newItem);
            newIndex++;
            hasChanges = true;
        }
        else if (compareResult === Comparison.GreaterThan) {
            deleted(oldItem);
            oldIndex++;
            hasChanges = true;
        }
        else {
            unchanged(oldItem, newItem);
            newIndex++;
            oldIndex++;
        }
    }
```
新旧それぞれの「今の位置」の要素を比べます。

- 新 < 旧: 新しい要素は古いリストにないので **追加**。新側だけ進める。
- 新 > 旧: 古い要素は新しいリストにないので **削除**。旧側だけ進める。
- 等しい: **変化なし**。両方進める。

### 2. 残りを片付ける

```ts:line-numbers=2517
    while (newIndex < newLen) {
        inserted(newItems[newIndex++]);
        hasChanges = true;
    }
    while (oldIndex < oldLen) {
        deleted(oldItems[oldIndex++]);
        hasChanges = true;
    }
```
新側に残りがあれば全部追加、旧側に残りがあれば全部削除です。

### 3. 変化があったかを返す

```ts:line-numbers=2525
    return hasChanges;
```
上の例を追ってみます。

```
新 a / 旧 a → 等しい（変化なし）
新 b / 旧 c → b < c（b を追加）
新 d / 旧 c → d > c（c を削除）
新 d / 旧 d → 等しい（変化なし）
新 e / 旧 なし → 残り（e を追加）
```

## ここがすごい

- **1 回の走査で済む**: 素朴にやると「新しい各要素が古いリストにあるか」を探すことになり、要素数の 2 乗の時間がかかります。両方が並んでいることを利用すれば、それぞれを 1 回ずつ見るだけで済みます。これは「マージソート」の合体の手順と同じ考え方です。
- **結果を配列で返さない**: 差分を配列にまとめて返すのではなく、見つけたそばからコールバックを呼びます。呼び出し側は、追加ならファイルの監視を始める、削除なら止める、といった処理をその場で行えるので、途中の配列を作る必要がありません。
- **変化の有無も返す**: 戻り値の真偽値で「何か変わったか」がわかるので、変化がなければ後続の重い処理を省けます。
- **新旧の型が違ってもよい**: 古いほうは「監視中のオブジェクト」、新しいほうは「ファイル名」のように、型が違うリストも比べられる設計です。

## まとめ

- 並べ替え済みの 2 つのリストは、2 本の指を同時に進めると 1 回の走査で比べられる。
- 「小さいほうを進める」がマージの基本。
- 結果をコールバックで通知すると、途中の配列を作らずに済む。

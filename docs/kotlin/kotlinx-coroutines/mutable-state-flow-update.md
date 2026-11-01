---
title: "compareAndSet ループで状態を安全に書き換える update"
description: "MutableStateFlow の値を「今の値から新しい値を計算して」更新する update。ロックを使わず、他スレッドに先を越されたらやり直すループで安全に更新する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [229, 237]
function: "MutableStateFlow.update"
difficulty: 2
tags: [並行処理, ロック不要, 非同期]
format: 2
---

## ひとことで

`update { 今の値 -> 新しい値 }` は、`MutableStateFlow`（現在の状態を 1 つ持ち、変化を通知する入れ物）の値を、**今の値をもとに安全に書き換える** 関数です。
`counter.update { it + 1 }` と書けば、複数のスレッドから同時に呼ばれても、カウントが正しく増えます。

仕組みは **compareAndSet（CAS）ループ** と呼ばれる定番のテクニックで、ロックを使わずに「読む → 計算する → 書く」を安全に行います。

## コード

```kotlin:line-numbers=229
public inline fun <T> MutableStateFlow<T>.update(function: (T) -> T) {
    while (true) {
        val prevValue = value
        val nextValue = function(prevValue)
        if (compareAndSet(prevValue, nextValue)) {
            return
        }
    }
}
```

## 前提知識

- **`MutableStateFlow`**: 値を 1 つ持つ Flow です。`value` で読み書きでき、書き換えると購読している側に新しい値が通知されます。画面の状態管理によく使われます。
- **競合（レースコンディション）**: 2 つのスレッドが同時に `value = value + 1` を実行すると、両方が同じ古い値（たとえば 5）を読み、両方が 6 を書いて、1 回分の増加が消えてしまいます。
- **`compareAndSet(expect, update)`**: 「今の値が `expect` と等しいときだけ `update` に書き換え、成功したら `true`」を **1 つの不可分な操作** として行う関数です。途中で他のスレッドに割り込まれません。
- **`inline` 関数と `(T) -> T`**: `function` は「今の値を受け取って新しい値を返す関数」です。`inline` なので、呼び出し元に展開されてラムダのオブジェクトが作られません。
- **`while (true)`**: 無限ループです。中の `return` で抜けます。

## 何をしているか

### 1. 今の値を読んで、新しい値を計算する

```kotlin:line-numbers=230
    while (true) {
        val prevValue = value
        val nextValue = function(prevValue)
```

たとえば今の値が 5 なら、`prevValue = 5`、`nextValue = 6` です。

### 2. 誰も書き換えていなければ書き込む

```kotlin:line-numbers=233
        if (compareAndSet(prevValue, nextValue)) {
            return
        }
```

`compareAndSet(5, 6)` は、「まだ 5 のままなら 6 にする」です。成功すれば終わりです。

### 3. 先を越されたらやり直す

スレッド A と B が同時に `update { it + 1 }` を呼んだ場合:

1. A も B も `5` を読み、`6` を計算する
2. A の `compareAndSet(5, 6)` が成功して値は 6
3. B の `compareAndSet(5, 6)` は、今の値が 6 なので失敗
4. B はループの最初に戻り、`6` を読んで `7` を計算し、`compareAndSet(6, 7)` に成功

結果は 7 で、どちらの増加も失われません。

## ここがすごい

- **ロックを使わない**: ロックを取ると、他のスレッドは待たされ、うっかりすると デッドロック（互いに待ち続けて止まること）も起きます。CAS ループなら誰も待たず、失敗したスレッドが計算し直すだけです。
- **`value = value + 1` の落とし穴を API で防ぐ**: 読みと書きが別の操作だと競合が起きます。`update` という関数を用意しておけば、利用者は CAS を意識せずに正しいコードを書けます。
- **兄弟関数で戻り値を選べる**: 同じファイルには、更新後の値を返す `updateAndGet`、更新前の値を返す `getAndUpdate` もあり、どれも同じループの形です。
- **注意点も分かる**: 失敗したら `function` がもう一度呼ばれるので、`function` の中でログを出したり外部に書き込んだりすると、それが何度も起きる可能性があります。計算は「副作用のない関数」にするのが前提です。

## まとめ

- 「読む → 計算 → 書く」を安全に行うには、compareAndSet が成功するまでやり直すループを使う。
- ロックがいらないので、待ちやデッドロックが起きない。
- やり直しで計算が複数回走ることがあるので、更新関数には副作用を入れない。

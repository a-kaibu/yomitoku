---
title: "成功と失敗を 2 つの箱に振り分ける partitionTo"
description: "Result の列を、成功の値の箱と失敗のエラーの箱の 2 つに振り分ける partitionTo。呼び出し側が箱の種類を選べるので、リストでもセットでも使える。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Iterable.kt
lines: [172, 185]
function: "Iterable<Result<V, E>>.partitionTo"
difficulty: 2
tags: [エラー処理, ジェネリクス, 関数型]
format: 2
---

## ひとことで

`partitionTo()` は、`Result` が並んだ列を **成功の値** と **失敗のエラー** の 2 つに分けて、それぞれ別の箱に入れる関数です。箱は呼び出し側が渡すので、リストにもセットにも、好きなコレクションを使えます。

## コード

```kotlin:line-numbers=172
public fun <V, E, CV : MutableCollection<in V>, CE : MutableCollection<in E>> Iterable<Result<V, E>>.partitionTo(
    first: CV,
    second: CE,
): Pair<CV, CE> {
    for (result in this) {
        if (result.isOk) {
            first += result.value
        } else {
            second += result.error
        }
    }

    return Pair(first, second)
}
```

## 前提知識

- **`Pair`**: 2 つの値をひとまとめにした組です。`first` と `second` で取り出せます。ここでは成功側の箱とエラー側の箱を 1 つにまとめて返します。
- **`MutableCollection`**: 中身を追加できるコレクションの共通の型です。`ArrayList` や `HashSet` が当てはまります。
- **型パラメータ `CV` と `CE`**: 成功の箱の型と、エラーの箱の型を別々に指定しています。`CV : MutableCollection<in V>` は、「`V` を入れられるコレクション」という意味です。
- **`+=`**: コレクションに要素を 1 つ追加する演算子です。`first += result.value` は、`first.add(result.value)` と同じ意味になります。
- **`for (result in this)`**: 列の要素を、先頭から順番に 1 つずつ取り出すループです。

## 何をしているか

### 順番に振り分ける

```kotlin:line-numbers=176
    for (result in this) {
```

列を先頭から順に見ていきます。

```kotlin:line-numbers=177
        if (result.isOk) {
```

成功かどうかで箱を選びます。

```kotlin:line-numbers=178
            first += result.value
```

成功なら、中の値を 1 つ目の箱に入れます。

```kotlin:line-numbers=180
            second += result.error
```

失敗なら、中のエラーを 2 つ目の箱に入れます。

### 2 つの箱を組にして返す

```kotlin:line-numbers=184
    return Pair(first, second)
```

ループが終わったら、2 つの箱を `Pair` にまとめて返します。

## ここがすごい

- **箱を外から渡せる**: 戻り値の型を決めるのは呼び出し側です。すでにある `MutableList` や `MutableSet` に、そのまま結果を追加できます。新しいリストを作らずに済むので、メモリの使い方も選べます。
- **1 回の走査で済む**: 成功とエラーの 2 回に分けてフィルタリングすると、列を 2 度たどります。この関数は 1 回のループだけで両方を集めます。
- **型で箱の中身が決まる**: `first` には `V` だけ、`second` には `E` だけが入ります。取り違えると、コンパイルが通りません。
- **`partition()` の土台になっている**: 引数を省いた `partition()` は、この関数を `ArrayList` 2 つで呼んでいるだけです。箱を変えたいときは、この `partitionTo` を直接使います。

## まとめ

- `partitionTo` は、成功の値とエラーを 1 回の走査で、呼び出し側の箱に振り分ける。
- 箱を外から渡すことで、リストでもセットでも同じ関数を使える。
- 型引数で箱の種類を指定するので、中身の型の取り違えは起きにくい。

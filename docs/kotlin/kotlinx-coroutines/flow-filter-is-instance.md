---
title: "消えるはずの型を実行時に使う reified と filterIsInstance"
description: "Flow から指定した型の値だけを通す filterIsInstance。inline と reified で、ふつうは実行時に消える型パラメータを使って判定している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Transform.kt
lines: [31, 32]
function: "Flow.filterIsInstance (reified)"
difficulty: 2
tags: [型システム, ジェネリクス, 非同期]
format: 2
---

## ひとことで

`filterIsInstance<R>()` は、いろいろな型の値が混ざった Flow から、**型 `R` の値だけを通す** 関数です。
たとえば `flowOf(1, "a", 2.0, "b").filterIsInstance<String>()` は `"a"`、`"b"` だけを流します。

たった 1 行の関数ですが、Kotlin ならではの **`reified`（実体化された型パラメータ）** を使い、ふつうは実行時に分からなくなる「`R` が何の型か」を判定に使っています。

## コード

```kotlin:line-numbers=31
@Suppress("UNCHECKED_CAST")
public inline fun <reified R> Flow<*>.filterIsInstance(): Flow<R> = filter { it is R } as Flow<R>
```

## 前提知識

- **Flow と `filter`**: Flow は値を順番に流すものです。`filter { 条件 }` は、条件が真の値だけを下流へ流します。
- **ジェネリクスと型消去**: `<R>` は「呼ぶ人が型を決める」型パラメータです。JVM（Java の実行環境）では、コンパイル後にこの型の情報が消えます（型消去）。そのため通常の関数の中では `value is R` のような判定は書けません。
- **`inline` 関数**: 呼び出し元に中身がコピーされる関数です。
- **`reified`**: `inline` 関数の型パラメータに付けると、コピーされるときに `R` が本当の型（`String` など）に置き換わります。だから関数の中で `it is R` が書けるようになります。
- **`is`**: 「この値はこの型か」を調べる演算子です。
- **`Flow<*>`**: `*` はスター投影と呼ばれ、「中身の型は何か分からない Flow」を表します。何の Flow でも受け取れます。
- **`as Flow<R>`**: 型のキャストです。`filter` の結果は元の型のままなので、`R` の Flow だとみなし直しています。`@Suppress("UNCHECKED_CAST")` はその警告を抑える指定です。

## 何をしているか

### 1. 呼び出し元に展開される

```kotlin:line-numbers=32
public inline fun <reified R> Flow<*>.filterIsInstance(): Flow<R> = filter { it is R } as Flow<R>
```

`filterIsInstance<String>()` と書くと、`inline` なのでコンパイラは呼び出し元に次のようなコードを埋め込みます。

```kotlin
filter { it is String } as Flow<String>
```

`R` が `String` に置き換わっているので、`is` で判定できます。

### 2. 型が合うものだけ通る

`1, "a", 2.0, "b"` が流れると、

- `1` → `Int` なので落とす
- `"a"` → `String` なので通す
- `2.0` → `Double` なので落とす
- `"b"` → 通す

### 3. 型を付け直す

`filter` が返すのは `Flow<*>` ですが、通ったのは `String` だけだと分かっているので、`Flow<String>` にキャストして返します。これで受け取る側は `String` として扱えます。

## ここがすごい

- **型消去の壁を `inline` で越える**: Java では同じことをするのに `Class<R>` オブジェクトを引数で渡す必要がありました。実際、同じファイルには `KClass` を受け取る版もあります。`reified` 版なら `filterIsInstance<String>()` と型を書くだけで済み、呼び出しがすっきりします。
- **既存の部品を組み合わせるだけ**: 判定は `filter`、型の付け直しはキャストに任せ、新しい処理はほとんど書いていません。安全なキャストかどうかは「`is R` で通したものだけ」という論理で保証されています。
- **2 つの版を用意する理由**: `reified` は `inline` 関数でしか使えず、型がコンパイル時に決まっていないと呼べません。実行時に型が決まる場合のために `KClass` 版も並べてあるのは、API 設計として親切です。

## まとめ

- JVM ではジェネリクスの型が実行時に消える（型消去）。
- `inline` + `reified` を使うと、関数の中で型パラメータを `is` 判定などに使える。
- 実行時に型が決まる場合のために、`KClass` を受け取る版も用意しておくと便利。

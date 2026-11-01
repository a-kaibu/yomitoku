---
title: "範囲の外かを安全に調べる checkOffsetAndCount"
description: "バイト列の一部を読み書きする前に、位置と長さが範囲に収まるかを調べる関数。負の値と、加算によるあふれの両方を、1 回の比較で確かめる。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "\"Copyright (C) 2018 Square, Inc.\""
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Util.kt
lines: [23, 27]
function: "checkOffsetAndCount"
difficulty: 2
tags: [防御的プログラミング, ビット演算, エラー処理]
format: 2
---

## ひとことで

`checkOffsetAndCount` は、データのうち `offset` から `byteCount` バイトを読み書きする前に、**その範囲が全体の大きさ `size` の中に収まっているか** を確かめる関数です。収まらなければ例外を投げます。

確かめる条件は 3 つありますが、それを 1 つの `if` にまとめています。負の値の検査と、足し算によるあふれ（オーバーフロー）の対策が、この 1 行に入っています。

## コード

```kotlin:line-numbers=23
internal fun checkOffsetAndCount(size: Long, offset: Long, byteCount: Long) {
  if (offset or byteCount < 0 || offset > size || size - offset < byteCount) {
    throw ArrayIndexOutOfBoundsException("size=$size offset=$offset byteCount=$byteCount")
  }
}
```

## 前提知識

- **`or`（ビットの OR）**: 2 つの整数の、どちらかのビットが 1 なら 1 になる演算です。
- **符号と負の数**: `Long` の最上位ビットが 1 のとき、その数は負になります。
- **オーバーフロー**: 整数には上限があるので、大きな値どうしを足すと、負の数に折り返すことがあります。
- **`ArrayIndexOutOfBoundsException`**: 配列などの範囲の外を指したときに投げられる、実行時の例外です。

## 何をしているか

### 1. 負の値を調べる

```kotlin:line-numbers=24
  if (offset or byteCount < 0 || offset > size || size - offset < byteCount) {
```

`offset or byteCount < 0` は、Kotlin では `(offset or byteCount) < 0` として読まれます。中置の `or` は、比較の `<` より強く結びつくからです。`offset` と `byteCount` のどちらかが負なら、OR の結果も最上位ビットが 1 になり、負になります。2 つを一度に調べられます。

### 2. 先頭の位置が範囲の中か

`offset > size` なら、先頭の位置がもう全体の外にあるので、失敗です。

### 3. 最後まで収まるか

`size - offset < byteCount` は、残りの長さ（`size - offset`）が要求された長さより短いかを比べています。`offset + byteCount > size` と書く方法もありますが、その足し算があふれると、誤った結果になります。引き算に直すことで、あふれを避けています。

### 4. 外れていれば例外

条件のどれかに当てはまれば、値を文字列にして例外を投げます。どの値が問題だったかが、メッセージで分かります。

## ここがすごい

- **1 つの `if` に 3 つの条件をまとめる**: 条件の並び順によって、途中でまず負の値を排除し、次に位置、最後に長さを確かめます。短絡評価（`||`）によって、左が真なら右は評価されません。
- **あふれを避ける書き方**: 足し算ではなく引き算で比べているので、大きな値でも正しく判定できます。
- **ビット演算で負の検査を 1 回に**: `or` を使うと、2 つの値の符号を一度に確かめられます。ただし、読む人が演算子の結合の順番を知っている必要があります。
- **読み書きの前に必ず確かめる**: 範囲の外に書けば、ほかのデータを壊すおそれがあります。実行前に検査することで、その事故を防ぎます。

## まとめ

- 範囲の検査は、負の値、先頭の位置、残りの長さの 3 つに分けて考える。
- 足し算のあふれを避けるには、引き算に直して比べる。
- 演算子の優先順位を理解していると、1 行の条件を正しく読める。

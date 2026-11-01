---
title: "溢れずに (d × n + r) ÷ m を求める"
description: "掛け算の結果が Long に収まらなくても、(d × n + r) ÷ m を求める multiplyAddAndDivide。符号をそろえてから、商と余りに分けて足し合わせる。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2019-2020 JetBrains s.r.o."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/internal/math.kt
lines: [168, 184]
function: "multiplyAddAndDivide"
difficulty: 3
tags: [数値計算, 日時, 防御的プログラミング]
format: 2
---

## ひとことで

`multiplyAddAndDivide()` は、`(d × n + r) ÷ m` という計算を、途中で `Long` の範囲を超えないように行う関数です。たとえば、大きな秒数に係数を掛けてから割るような計算で、単純に書くと掛け算の段階で溢れてしまう場面を扱います。

kotlinx-datetime（日付と時刻を扱うライブラリ）が、時間の単位をそろえる計算で使っています。

## コード


::: code-group

```kotlin:line-numbers=168 [日本語訳]
internal fun multiplyAddAndDivide(d: Long, n: Long, r: Long, m: Long): Long {
    var md = d
    var mr = r
    // md と mr の符号をそろえる
    if (d > 0 && r < 0) {
        md--
        mr += n
    } else if (d < 0 && r > 0) {
        md++
        mr -= n
    }
    if (md == 0L) {
        return mr / m
    }
    val (rd, rr) = multiplyAndDivide(md, n, m)
    return safeAdd(rd, safeAdd(mr / m, safeAdd(mr % m, rr) / m))
}
```

```kotlin:line-numbers=168 [原文]
internal fun multiplyAddAndDivide(d: Long, n: Long, r: Long, m: Long): Long {
    var md = d
    var mr = r
    // make sure [md] and [mr] have the same sign
    if (d > 0 && r < 0) {
        md--
        mr += n
    } else if (d < 0 && r > 0) {
        md++
        mr -= n
    }
    if (md == 0L) {
        return mr / m
    }
    val (rd, rr) = multiplyAndDivide(md, n, m)
    return safeAdd(rd, safeAdd(mr / m, safeAdd(mr % m, rr) / m))
}
```

:::

## 前提知識

- **`Long`**: 64 ビットの整数です。扱える範囲には上限があり、それを超えると値がおかしくなります。
- **溢れ（オーバーフロー）**: 計算の結果が型の範囲を超えること。`Long` の掛け算は、大きすぎると正しい値が出ません。
- **商と余り**: 割り算の答えを「商」と、割り切れずに残った「余り」に分けたものです。`a = q × m + r` の関係があります。
- **`DivRemResult`**: 商と余りを 1 つの値にまとめる型です。`val (rd, rr) = ...` と書くと、2 つを分けて受け取れます。
- **`safeAdd`**: 足し算でも溢れを検出するための関数です。

## 何をしているか

### 1. 符号をそろえる

```kotlin:line-numbers=172
    if (d > 0 && r < 0) {
```

`d` が正で `r` が負のときは、`md` を 1 減らし、`mr` に `n` を足します。`d × n + r` は変わらないまま、`md` と `mr` の符号がそろいます。逆のときも、同じ考え方で 1 増やして `n` を引きます。

ここで符号をそろえる理由は、後の割り算で「切り捨ての向き」が混ざると、結果が 1 つずれてしまうからです。

### 2. 割り切れる場合は早めに返す

```kotlin:line-numbers=179
    if (md == 0L) {
        return mr / m
    }
```

`md` が 0 なら、掛け算の部分は 0 です。残りの `mr` を割るだけで答えになります。

### 3. 掛け算の部分を商と余りに分けて割る

```kotlin:line-numbers=182
    val (rd, rr) = multiplyAndDivide(md, n, m)
```

`md × n` を `m` で割った商 `rd` と余り `rr` を求めます。この段階で、大きな積を直接作らずに済みます。

### 4. 3 つの部分を足し合わせる

```kotlin:line-numbers=183
    return safeAdd(rd, safeAdd(mr / m, safeAdd(mr % m, rr) / m))
```

`mr` も、商 `mr / m` と余り `mr % m` に分けます。余り同士 `mr % m + rr` は `m` を超えることがあるので、もう一度 `m` で割って、その分を商に繰り上げます。最後に、すべての商を `safeAdd` で足します。

## ここがすごい

- **大きな値を作らない**: 積 `d × n` を丸ごと計算せず、商と余りの形で扱っています。途中の値が `Long` の範囲に収まるように分けられています。
- **符号を先にそろえる**: 余りの符号が混ざると、負の数の割り算の切り捨てで結果がずれます。最初に符号をそろえておくことで、後の計算が単純になります。
- **繰り上がりを明示する**: 余りを足して `m` で割り、商に加える処理は、普通の筆算の繰り上がりと同じです。その手順が、コードの行にそのまま表れています。
- **溢れを検出する足し算**: 最後の足し算は `safeAdd` を使っているので、本当に結果が `Long` に収まらないときは例外になります。黙って誤った値を返しません。

## まとめ

- `multiplyAddAndDivide` は、`(d × n + r) ÷ m` を、溢れを避けて商と余りに分けて求める。
- 符号をそろえてから、積の部分の商と余り、加える値の商と余りを、順番に足し合わせる。
- 本当に収まらない結果は `safeAdd` の例外で知らせ、誤った値は返さない。

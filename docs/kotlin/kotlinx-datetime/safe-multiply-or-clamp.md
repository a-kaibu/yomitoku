---
title: "溢れた掛け算を最大値か最小値に丸める"
description: "2 つの Long の積が Long に収まらないとき、符号を見て最大値か最小値に丸める関数。割り算で溢れを見つけ、-1 と 1 は特別に扱って MIN_VALUE の問題を避ける。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "\"Copyright 2019-2020 JetBrains s.r.o.\""
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/internal/math.kt
lines: [42, 58]
function: "safeMultiplyOrClamp"
difficulty: 3
tags: [数値計算, 防御的プログラミング, 型システム]
format: 2
---

## ひとことで

整数の掛け算は、結果が大きすぎると **溢れて（オーバーフロー）** 、まったく違う値になります。日時の計算では、大きな数どうしを掛けることがあるので、この問題が起きやすくなります。

`safeMultiplyOrClamp` は、積が `Long` に収まらないとき、**符号に合わせて最大値（`Long.MAX_VALUE`）か最小値（`Long.MIN_VALUE`）に丸める** 関数です。溢れを、正しい方向の端の値として表します。

## コード


::: code-group

```kotlin:line-numbers=42 [日本語訳]
internal fun safeMultiplyOrClamp(a: Long, b: Long): Long {
    when (b) {
        -1L -> {
            if (a == Long.MIN_VALUE) {
                return Long.MAX_VALUE
            }
            return -a
        }
        1L -> return a
    }
    val total = a * b
    if (total / b != a) {
        // a は 0 ではない（0 なら等しくなって溢れていないはず）。b も要件により 0 ではない
        return if ((a > 0) == (b > 0)) Long.MAX_VALUE else Long.MIN_VALUE
    }
    return total
}
```

```kotlin:line-numbers=42 [原文]
internal fun safeMultiplyOrClamp(a: Long, b: Long): Long {
    when (b) {
        -1L -> {
            if (a == Long.MIN_VALUE) {
                return Long.MAX_VALUE
            }
            return -a
        }
        1L -> return a
    }
    val total = a * b
    if (total / b != a) {
        // `a` is not zero, or the equality would hold, and `b` is not zero by the requirement
        return if ((a > 0) == (b > 0)) Long.MAX_VALUE else Long.MIN_VALUE
    }
    return total
}
```

:::

## 前提知識

- **`Long` の範囲**: 64 ビットの整数で、`Long.MIN_VALUE` から `Long.MAX_VALUE` までです。
- **オーバーフロー**: 結果が範囲を超えると、上位のビットが捨てられ、符号や大きさが変わってしまうことです。
- **割り算で溢れを確かめる**: `total / b` が `a` に戻るなら、掛け算は溢れていません。溢れていれば、割ったときに元に戻りません。
- **`-1` と `1` の特別扱い**: `Long.MIN_VALUE` に `-1` を掛けると、正の値が必要になりますが、それは `Long` に収まりません。また、`Long.MIN_VALUE / -1` も溢れます。そのため、この 2 つを先に別にしています。

## 何をしているか

### 1. -1 と 1 は先に処理する

```kotlin:line-numbers=44
        -1L -> {
            if (a == Long.MIN_VALUE) {
                return Long.MAX_VALUE
            }
            return -a
        }
```

`b` が `-1` のとき、`a` の符号を反転します。ただし `a` が `Long.MIN_VALUE` なら、反転した値は `Long` に収まらないので、最大値にします。

```kotlin:line-numbers=50
        1L -> return a
```

`b` が `1` のときは、`a` をそのまま返します。

### 2. 割り算で溢れを確かめる

```kotlin:line-numbers=53
    if (total / b != a) {
```

掛け算の結果を `b` で割って、`a` に戻るかを見ます。戻らなければ、溢れていると判断します。

### 3. 符号で丸める先を決める

```kotlin:line-numbers=55
        return if ((a > 0) == (b > 0)) Long.MAX_VALUE else Long.MIN_VALUE
```

`a` と `b` の符号が同じなら、積は正の大きな値になるので最大値に、違えば負の大きな値になるので最小値にします。

## ここがすごい

- **溢れを数字で正確に見つける**: 結果を割って元に戻るかを調べるので、大きさを予想する計算が要りません。
- **端の値で意味を残す**: 溢れた結果を、どちらの方向に大きいかを残した端の値で表します。ただの誤った値より、扱いやすくなります。
- **特別な場合を先に分ける**: `-1` と `1` を先に処理しておくことで、割り算の溢れ（`MIN_VALUE / -1`）に入る前に止まります。
- **符号の比較だけで丸め先が決まる**: `(a > 0) == (b > 0)` の 1 行で、正の積か負の積かを判定します。

## まとめ

- 掛け算の溢れは、割り算で元に戻るかを確かめれば見つけられる。
- 溢れた結果は、符号に合わせて最大値か最小値に丸める。
- 割り算で溢れる特別な値（`MIN_VALUE` と `-1`）は、先に別の処理にする。

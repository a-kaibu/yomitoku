---
title: "文字がターミナルで占める幅を二分探索で調べる"
description: "Unicode の文字 1 つが、ターミナルの画面で何マス分になるかを求める cellWidth。ASCII は探索せずに 1 を返し、それ以外は表を二分探索する。範囲外は 1 とみなす。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/internal/cellwidth.kt
lines: [22, 44]
function: "cellWidth"
difficulty: 3
tags: [アルゴリズム, 文字列処理, 最適化]
format: 2
---

## ひとことで

`cellWidth()` は、Unicode の 1 文字（コードポイント）が、ターミナルの画面で **何マス分の幅を占めるか** を求める関数です。ふつうのアルファベットは 1 マス、漢字や一部の絵文字は 2 マスになります。

Mordant（ターミナルに色や表を表示するライブラリ）の描画で、文字列の幅を計算するために使われています。文字数ではなく、画面上の幅で揃えるための基盤です。

## コード


::: code-group

```kotlin:line-numbers=22 [日本語訳]
internal fun cellWidth(codepoint: Int): Int {
    if (codepoint in 0x20..0x7e) return 1 // 表示できる ASCII の高速経路
    if (codepoint == 0x08 || codepoint == 0x7f) return -1 // DEL と BS

    val table = CELL_WIDTH_TABLE
    var min = 0
    var mid: Int
    var max = table.lastIndex

    if (codepoint < table[0].low || codepoint > table[max].high) return 1

    while (max >= min) {
        mid = (min + max) / 2
        val entry = table[mid]
        when {
            codepoint > entry.high -> min = mid + 1
            codepoint < entry.low -> max = mid - 1
            else -> return table[mid].width.toInt()
        }
    }

    return 1
}
```

```kotlin:line-numbers=22 [原文]
internal fun cellWidth(codepoint: Int): Int {
    if (codepoint in 0x20..0x7e) return 1 // fast path for printable ASCII
    if (codepoint == 0x08 || codepoint == 0x7f) return -1 // DEL and BS

    val table = CELL_WIDTH_TABLE
    var min = 0
    var mid: Int
    var max = table.lastIndex

    if (codepoint < table[0].low || codepoint > table[max].high) return 1

    while (max >= min) {
        mid = (min + max) / 2
        val entry = table[mid]
        when {
            codepoint > entry.high -> min = mid + 1
            codepoint < entry.low -> max = mid - 1
            else -> return table[mid].width.toInt()
        }
    }

    return 1
}
```

:::

## 前提知識

- **コードポイント**: Unicode で、1 つの文字に割り当てられた番号です。`A` は `0x41`、`漢` は `0x6F22` のような値を持ちます。
- **マス（セル）**: ターミナルの画面は、同じ大きさのマスが格子状に並んでいます。全角の文字は 2 マス、半角は 1 マスを使います。
- **範囲の表**: 「この範囲の文字は何マス」という情報を、範囲の始まり（`low`）と終わり（`high`）と幅（`width`）で並べた表です。
- **二分探索**: 整列した表の真ん中を調べ、目的の値が前か後ろかで範囲を半分にしていく探し方です。
- **`when`**: 条件を上から順に調べて、最初に当てはまった枝を実行します。

## 何をしているか

### 1. 速い経路を先に通す

```kotlin:line-numbers=23
    if (codepoint in 0x20..0x7e) return 1 // 表示できる ASCII の高速経路
```

印字できる ASCII の文字は、どれも 1 マスです。表を探さずに、すぐ `1` を返します。ほとんどの文字はこの経路で終わるので、速さに効いてきます。

```kotlin:line-numbers=24
    if (codepoint == 0x08 || codepoint == 0x7f) return -1 // DEL と BS
```

制御文字の DEL（0x7f）と BS（0x08）は、特別な値 `-1` を返します。表示の幅ではなく、特別な扱いを示す印として読むのが自然です。

### 2. 表の範囲の外なら 1

```kotlin:line-numbers=31
    if (codepoint < table[0].low || codepoint > table[max].high) return 1
```

表がまったくカバーしない範囲の文字は、1 マスとみなします。

### 3. 表を二分探索する

```kotlin:line-numbers=33
    while (max >= min) {
        mid = (min + max) / 2
```

探索の範囲の真ん中を取ります。範囲がなくなるまで、繰り返します。

```kotlin:line-numbers=37
            codepoint > entry.high -> min = mid + 1
            codepoint < entry.low -> max = mid - 1
```

真ん中の範囲より文字が大きければ右半分へ、小さければ左半分へ進みます。

```kotlin:line-numbers=39
            else -> return table[mid].width.toInt()
```

真ん中の範囲に文字が入っていれば、その幅を返します。

## ここがすごい

- **速い経路を前に置く**: 最もよく使われる ASCII を、表を調べる前に返します。大量の文字を描画するときに、この順番が効いてきます。
- **表の探索は最大でも 1 回**: 他の方式（wcwidth など）は、文字ごとに複数回の範囲検索をすることがあります。この実装は、表への二分探索を 1 回だけ行います。
- **範囲の外を先に切る**: 表の最初と最後の範囲で、明らかに範囲外の文字を先に除きます。探索の無駄を省いています。
- **表は最新の Unicode から生成**: コメントには、表が最新の Unicode の仕様から作られていることが書かれています。文字の幅の基準を、常に新しく保つ工夫です。

## まとめ

- `cellWidth` は、1 文字がターミナルで何マス分になるかを、ASCII の高速経路と範囲表の二分探索で求める。
- 範囲外は 1 マス、DEL と BS は特別な値 `-1` を返す。
- 表への探索は 1 回だけで、大量の文字を描画しても速さを保つ。

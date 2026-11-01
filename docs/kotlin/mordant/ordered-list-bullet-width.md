---
title: "番号付きリストの字下げ幅を桁数から求める bulletWidth"
description: "番号付きリストの項目の番号の桁数に、余白と区切り記号の幅を足して、行頭の字下げ幅を求める bulletWidth。常数の計算を log10 で桁数に変えている。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/widgets/OrderedList.kt
lines: [45, 50]
function: "OrderedList.bulletWidth"
difficulty: 3
tags: [数値計算, 文字列処理, 可読性]
format: 2
---

## ひとことで

`bulletWidth()` は、番号付きリスト（1. 2. 3. ...）で、**番号と区切りの部分が画面で何文字分あるか** を求める関数です。求めた幅は、最初の行以外の字下げや、本文の折り返し幅を決めるのに使われます。

番号の桁数を、文字列の長さを数えずに計算しているのが、この関数の見どころです。

## コード


::: code-group

```kotlin:line-numbers=45 [日本語訳]
    private fun bulletWidth(i: Int, sepWidth: Int): Int {
        return (log10((i + 1).toDouble()).toInt() + 1 // 番号の桁数
                + 2 // 余白の分
                + sepWidth
                )
    }
```

```kotlin:line-numbers=45 [原文]
    private fun bulletWidth(i: Int, sepWidth: Int): Int {
        return (log10((i + 1).toDouble()).toInt() + 1 // number
                + 2 // padding
                + sepWidth
                )
    }
```

:::

## 前提知識

- **番号付きリストの見た目**: 「9. 本文」「10. 本文」のように、番号と区切りが並び、その後に本文が続きます。番号の桁数が増えると、本文の開始位置がずれます。
- **`log10`**: 常用対数を求める関数です。`log10(100)` は `2.0`、`log10(9)` は約 `0.95` です。
- **桁数と対数の関係**: 正の整数 `n` の桁数は、`log10(n).toInt() + 1` で求められます。`9` は `0 + 1 = 1` 桁、`10` は `1 + 1 = 2` 桁になります。
- **`toInt()`**: 小数を整数にします。小数点以下は切り捨てられます。
- **`sepWidth`**: 番号のあとに付く区切り記号の幅です。画面上で何文字分かを表します。

## 何をしているか

### 1. 番号の桁数を求める

```kotlin:line-numbers=46
        return (log10((i + 1).toDouble()).toInt() + 1 // 番号の桁数
```

`i` は 0 から始まる番号なので、表示される番号は `i + 1` です。その対数を整数にして 1 を足すと、番号の桁数になります。

### 2. 余白と区切りを足す

```kotlin:line-numbers=48
                + sepWidth
```

番号の桁数に、余白の 2 と、区切り記号の幅を足します。その合計が、リストの行頭の字下げ幅です。

### 3. 字下げ幅を使う

```kotlin:line-numbers=52
    private val maxBulletWidth = bulletWidth(listEntries.size, sep(Theme.Default).lineWidth)
```

リスト全体で一番大きな番号の桁数で幅を決めます。項目の数が 10 を超えたときに、字下げがずれないようにするためです。

## ここがすごい

- **文字列を作らずに桁数が分かる**: 番号を文字列にして長さを数える代わりに、対数で桁数を求めています。計算がとても軽くなります。
- **最大の項目で幅をそろえる**: 項目ごとに幅を変えると、本文の縦の並びが崩れます。一番大きい番号で固定することで、すべての行が同じ位置から始まります。
- **計算の内訳が名前で分かる**: 「番号」「余白」「区切り」の 3 つを足しているだけなので、何を表すかを読み取りやすくなっています。
- **行頭をそろえられる**: 番号が 9 から 10 に変わる項目の前後でも、本文の開始位置が同じになります。

## まとめ

- `bulletWidth` は、番号の桁数と余白と区切りの幅を足して、リストの字下げ幅を求める。
- 桁数は、文字列の長さではなく、`log10` の整数部分と 1 から求める。
- 字下げ幅は、リスト全体の最大の番号で決めて、行頭をそろえる。

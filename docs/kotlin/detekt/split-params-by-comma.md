---
title: "カンマで区切る。ただし括弧の中のカンマは無視する"
description: "関数の引数の並びを、カンマで分けた文字列のリストにする splitParams。括弧の深さを数えて、入れ子の中にあるカンマでは分けないようにしている。"
language: kotlin
project: "detekt"
repo: https://github.com/detekt/detekt
license: Apache-2.0
copyright: "Copyright 2016-2024 Artur Bosch and detekt contributors"
commit: "0887fcccf93842244ba851e970aa99c7da31ffbc"
file: detekt-psi-utils/src/main/kotlin/dev/detekt/psi/FunctionMatcher.kt
lines: [154, 174]
function: "String.splitParams"
difficulty: 2
tags: [文字列処理, パース, 再帰]
format: 2
---

## ひとことで

`splitParams` は、`"a: Int, b: Map<String, Int>, c: (Int, Int) -> Int"` のような **引数の並びの文字列を、カンマで 1 つずつに分ける** 関数です。ただし、`(Int, Int)` のように括弧の中にあるカンマでは分けません。

単に `split(",")` で分けると、括弧の中のカンマまで切ってしまい、正しい引数の並びにはなりません。この関数は、括弧の深さを数えながら 1 文字ずつ読むことで、それを避けています。detekt がルールの設定や関数の一致を調べるときに使う部品です。

## コード

```kotlin:line-numbers=154
private fun String.splitParams(): List<String> {
    val split: MutableList<String> = mutableListOf()
    var nestingLevel = 0
    val result = StringBuilder()
    this.forEach { c ->
        if (c == ',' && nestingLevel == 0) {
            split.add(result.toString().trim())
            result.setLength(0)
        } else {
            if (c == '(') nestingLevel++
            if (c == ')') nestingLevel--
            check(nestingLevel >= 0)
            result.append(c)
        }
    }
    val lastParam = result.toString().trim()
    if (lastParam.isNotEmpty()) {
        split.add(lastParam)
    }
    return split
}
```

## 前提知識

- **`split(",")` の限界**: 文字列を単純に区切る関数です。入れ子の構造を理解しないので、括弧の中のカンマも区切ってしまいます。
- **括弧の深さ（nesting level）**: 開き括弧 `(` に出会うと 1 増やし、閉じ括弧 `)` に出会うと 1 減らす数です。深さが 0 のときだけ、カンマを区切りとして扱えます。
- **`StringBuilder`**: 文字を少しずつ追加して、最後に文字列にするための道具です。`setLength(0)` で中身を空にして再利用できます。
- **`trim()`**: 前後の空白を取り除く関数です。`", "` のあとの空白を消すために使います。
- **`check(条件)`**: 条件が偽なら `IllegalStateException` を投げます。ここでは深さが負になることを防ぐ安全装置です。

## 何をしているか

### 1. 深さが 0 のカンマだけで区切る

```kotlin:line-numbers=159
        if (c == ',' && nestingLevel == 0) {
            split.add(result.toString().trim())
            result.setLength(0)
```

文字が `,` で、しかも括弧の外（深さ 0）にあるときだけ、今まで溜めた部分を `split` のリストに加えます。加えたあとは `result` を空にして、次の引数のために使い回します。

### 2. 括弧の深さを数える

```kotlin:line-numbers=163
            if (c == '(') nestingLevel++
            if (c == ')') nestingLevel--
            check(nestingLevel >= 0)
            result.append(c)
```

`(` で深さを増やし、`)` で減らします。閉じ括弧が開き括弧より多い（深さが負になる）入力は、おかしな引数の並びなので、`check` で止めます。どの文字も、最後に `result` へ追加します。

### 3. 最後の引数を忘れずに加える

```kotlin:line-numbers=169
    val lastParam = result.toString().trim()
    if (lastParam.isNotEmpty()) {
        split.add(lastParam)
    }
```

最後の引数の後ろにはカンマがないので、ループの中では加えられていません。ここで、空でなければ加えます。空なら、末尾にカンマだけがあった場合などに対応しています。

## ここがすごい

- **1 文字ずつ読むだけの状態機械**: 文字列の中身を調べるのに、正規表現を使わず、「今の深さ」という 1 つの数だけを覚えています。入れ子の構造を、数 1 つで扱う典型的な方法です。
- **区切りの判定が 1 か所に集まる**: カンマで分けるかどうかは、「文字がカンマで、深さが 0」という 1 つの条件だけで決まります。読み手は、ここを見れば仕組みが分かります。
- **溜めて使い回す**: `StringBuilder` を 1 つだけ作り、区切るたびに `setLength(0)` で空にします。引数が多くても、毎回新しい文字列の入れ物を作らずに済みます。
- **空の引数を捨てる**: 最後の部分が空なら加えないことで、末尾のカンマなどで余計な空の要素が増えないようにしています。

## まとめ

- 入れ子の区切りを正しく扱うには、括弧の深さを数えながら 1 文字ずつ読むとよい。
- 区切りは「深さ 0 のカンマ」だけにすると、括弧の中の値を壊さずに分けられる。
- 最後の要素は、ループの外で忘れずに加える。

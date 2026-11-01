---
title: "符号なしの整数を JSON に書き出す Composer"
description: "kotlinx.serialization が JSON を書くときの部品。符号なしの整数（UInt など）を、符号なしとして書き出す。必要なら文字列として引用符で囲む。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2022 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/Composers.kt
lines: [45, 62]
function: "ComposerForUnsignedNumbers"
difficulty: 2
tags: [入出力, ビット演算, 型システム]
format: 2
---

## ひとことで

kotlinx.serialization は、Kotlin のデータを JSON などの形式に変換するライブラリです。その中で、JSON の値を 1 つずつ書き出す役目を **Composer** が持ちます。

`ComposerForUnsignedNumbers` は、符号なしの整数（`UInt`、`ULong`、`UByte`、`UShort`）を書き出すための Composer です。Kotlin の符号なし型は、符号付きの型と値の範囲が違うので、書き出す前に変換が必要です。

## コード


::: code-group

```kotlin:line-numbers=45 [日本語訳]
@SuppressAnimalSniffer // Java の Long(Integer).toUnsignedString(long) を使うため、チェックを抑える
internal class ComposerForUnsignedNumbers(writer: InternalJsonWriter, private val forceQuoting: Boolean) : Composer(writer) {
    override fun print(v: Int) {
        if (forceQuoting) printQuoted(v.toUInt().toString()) else print(v.toUInt().toString())
    }

    override fun print(v: Long) {
        if (forceQuoting) printQuoted(v.toULong().toString()) else print(v.toULong().toString())
    }

    override fun print(v: Byte) {
        if (forceQuoting) printQuoted(v.toUByte().toString()) else print(v.toUByte().toString())
    }

    override fun print(v: Short) {
        if (forceQuoting) printQuoted(v.toUShort().toString()) else print(v.toUShort().toString())
    }
}
```

```kotlin:line-numbers=45 [原文]
@SuppressAnimalSniffer // Long(Integer).toUnsignedString(long)
internal class ComposerForUnsignedNumbers(writer: InternalJsonWriter, private val forceQuoting: Boolean) : Composer(writer) {
    override fun print(v: Int) {
        if (forceQuoting) printQuoted(v.toUInt().toString()) else print(v.toUInt().toString())
    }

    override fun print(v: Long) {
        if (forceQuoting) printQuoted(v.toULong().toString()) else print(v.toULong().toString())
    }

    override fun print(v: Byte) {
        if (forceQuoting) printQuoted(v.toUByte().toString()) else print(v.toUByte().toString())
    }

    override fun print(v: Short) {
        if (forceQuoting) printQuoted(v.toUShort().toString()) else print(v.toUShort().toString())
    }
}
```

:::

## 前提知識

- **Composer**: JSON の数値や文字列を書き出す部品です。`print(v)` で数を、`printQuoted(s)` で引用符付きの文字列を書きます。このクラスは、その `print` を上書きして、書き方を変えています。
- **符号付きと符号なし**: 符号付きの `Int` は負の数も扱いますが、`UInt` は 0 以上だけを扱います。同じビットでも、解釈によって数が違います。
- **`toUInt()` などの変換**: 符号付きの値を、符号なしとして解釈し直す変換です。ビットの並びは変わりません。
- **`forceQuoting`**: `true` のとき、数を引用符で囲んで文字列として書きます。JSON の数の範囲を超える値を、安全に運ぶためです。
- **`super` の代わりに `print` を呼ぶ**: 同じクラスの別のオーバーロードを呼ぶことで、書き方の分岐をまとめています。

## 何をしているか

### 1. 符号なしの int を書く

`Int` の値を `UInt` に変換して、その文字列を書きます。`forceQuoting` が真なら、引用符で囲みます。

```kotlin:line-numbers=47
    override fun print(v: Int) {
        if (forceQuoting) printQuoted(v.toUInt().toString()) else print(v.toUInt().toString())
    }
```

### 2. 符号なしの long を書く

`Long` を `ULong` に変えて、同じ分岐で書きます。

```kotlin:line-numbers=51
    override fun print(v: Long) {
        if (forceQuoting) printQuoted(v.toULong().toString()) else print(v.toULong().toString())
    }
```

`Byte` と `Short` も、同じ形で `UByte` と `UShort` に変えて書きます。

## ここがすごい

- **同じ形を繰り返す**: 4 つの型で、同じ 1 行の分岐を書いています。型ごとに変換だけが違うので、読みやすく、直すときも迷いません。
- **ビットを変えずに解釈だけ変える**: `toUInt()` は、ビットの並びをそのままに、符号なしの数として文字列にします。`-1` は `4294967295` と書かれます。
- **引用符で安全に運ぶ**: JSON の仕様では、大きな整数が正しく扱えないことがあります。`forceQuoting` で文字列にすると、受け取る側が確実に数を取り出せます。
- **警告の抑制を明示する**: `@SuppressAnimalSniffer` は、Java の API を使うことへの警告を、理由と一緒に抑えています。理由がコメントに書かれているので、後から見ても分かります。

## まとめ

- 符号なしの型は、符号付きの値を符号なしとして解釈し直して書く。
- 同じ分岐を型ごとに繰り返すなら、変換だけを変えて形をそろえる。
- 大きな数を安全に運ぶなら、引用符で囲んで文字列にする。

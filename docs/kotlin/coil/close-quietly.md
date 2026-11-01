---
title: "閉じるときの小さな失敗を、静かに無視する"
description: "閉じる処理を実行し、実行時例外はそのまま投げ、それ以外の例外は無視する Closeable.closeQuietly。閉じる処理で起きた小さな問題で、本来の処理を止めないためのもの。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/commonMain/kotlin/coil3/util/utils.kt
lines: [35, 41]
function: "Closeable.closeQuietly"
difficulty: 2
tags: [エラー処理, 防御的プログラミング, 入出力]
format: 2
---

## ひとことで

`closeQuietly` は、ファイルや接続などの資源を **閉じるときに起きた例外を、ほとんどの場合は無視して先に進む** 関数です。ただし、実行時例外（`RuntimeException`）だけは、そのまま外に投げます。

資源を閉じる処理は、本来の仕事が終わったあとで行われることが多いです。そこで閉じるのに失敗しても、本来の結果を捨ててしまうのは不便です。この関数は、その場合に閉じる失敗だけを静かに扱うために使われます。

## コード

```kotlin:line-numbers=35
internal fun Closeable.closeQuietly() {
    try {
        close()
    } catch (e: RuntimeException) {
        throw e
    } catch (_: Exception) {}
}
```

## 前提知識

- **`Closeable`**: 閉じることができる資源を表す型です。ファイルやストリームなどが実装しています。
- **`AutoCloseable`**: 同じく閉じられることを表す、より一般的な型です。`Closeable` は、これを継承しています。
- **例外の階層**: `Exception` は、プログラムで起きる問題の大きな分類です。その中に `RuntimeException` があり、これは実行中に起きた、扱いを求められないタイプの例外です。
- **`try` と `catch`**: `try` の中で例外が起きると、`catch` の部分に処理が移ります。`catch` を複数書くと、例外の種類ごとに扱いを分けられます。
- **`_` の名前**: 例外を使わないときに、その値を捨てる印です。

## 何をしているか

### 1. 閉じる

```kotlin:line-numbers=37
        close()
```

資源を閉じます。これが成功すれば、何も起きずに関数が終わります。

### 2. 実行時例外はそのまま投げる

```kotlin:line-numbers=38
    } catch (e: RuntimeException) {
        throw e
```

閉じる処理の中で `RuntimeException` が起きたら、握りつぶさず、そのまま投げ直します。プログラムのミスなど、無視してはいけない問題を隠さないためです。

### 3. それ以外の例外は無視する

```kotlin:line-numbers=40
    } catch (_: Exception) {}
```

それ以外の `Exception`（主にチェック例外、入出力の失敗など）は、`_` で受け取ったあと、何もせずに捨てます。閉じるのに失敗しても、本来の処理の結果を優先するための判断です。

## ここがすごい

- **無視してよい例外と、そうでない例外を分ける**: 広い意味の `Exception` をすべて無視するのではなく、`RuntimeException` を先に捕まえて投げ直しています。問題を隠しすぎない、慎重な作りです。
- **例外の種類ごとに処理を書く**: `catch` を並べて、上から順に種類を判定します。より具体的な種類（`RuntimeException`）を先に書くのが、正しい順番です。
- **同じ処理を 2 つの型に用意する**: `Closeable` と `AutoCloseable` の両方に、同じ名前の関数があります。どちらの型の値でも、同じように呼べます。
- **意図を名前で伝える**: 関数名の `Quietly`（静かに）が、「閉じる失敗は表に出さない」という意図を伝えています。

### 注意点: 無視された例外は、記録されない

このように無視すると、閉じるときの失敗は記録も表示もされません。データの書き込みが閉じるときに初めて完了するような場合は、無視すると気づけなくなります。そのため、閉じるのに失敗すると困る場面では、この関数を使わず、例外を扱う必要があります。

## まとめ

- 閉じる処理の失敗は、本来の結果を優先するために、無視してよい場合がある。
- ただし、実行時例外は無視せず、そのまま投げ直す。
- 無視した失敗は気づけないので、データの完了に関わる場面では使わない。

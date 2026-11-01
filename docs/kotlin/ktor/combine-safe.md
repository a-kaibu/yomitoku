---
title: "安全に子のパスを連結する combineSafe"
description: "基準のフォルダに相対パスを足すとき、親のフォルダ（..）を使って外へ出ようとするパスを拒否する combineSafe。正規化してから先頭を確かめ、危険なら例外で止める。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/jvm/src/io/ktor/util/NioPath.kt
lines: [51, 59]
function: "File.combineSafe"
difficulty: 3
tags: [セキュリティ, ファイル, 防御的プログラミング]
format: 2
---

## ひとことで

`combineSafe()` は、基準のフォルダに **相対パスを安全に連結する** 関数です。相対パスの中に `..`（ひとつ上のフォルダ）が含まれて、基準の外に出てしまうような入力は、例外で拒否します。

Web サーバーで、利用者が指定したファイル名を、公開フォルダの下だけに限りたいときに欠かせない考え方です。これを怠ると、利用者が `../../secret.txt` のような名前で、本来見せてはいけないファイルを読めてしまいます（パストラバーサル）。

## コード

```kotlin:line-numbers=51
public fun File.combineSafe(relativePath: Path): File {
    val normalized = relativePath.normalizeAndRelativize()
    if (normalized.startsWith("..")) {
        throw InvalidPathException(relativePath.toString(), "Relative path $relativePath beginning with .. is invalid")
    }
    check(!normalized.isAbsolute) { "Bad relative path $relativePath" }

    return File(this, normalized.toString())
}
```

## 前提知識

- **相対パス**: `/` から始まらず、基準の場所からの道順で書かれたパスです。`images/a.png` などが当てはまります。
- **`..`**: ひとつ上のフォルダを表す記号です。`a/../b` は `b` と同じ意味になります。
- **正規化（normalize）**: `.` や `..` を取り除いて、パスを簡単な形にすることです。
- **`File(this, path)`**: 基準のフォルダ `this` に、相対パスを足したファイルを作る書き方です。
- **`check`**: 条件が満たされないとき、例外を投げる関数です。ここでは絶対パスを拒否するために使われています。

## 何をしているか

### 1. 相対パスを正規化する

```kotlin:line-numbers=52
    val normalized = relativePath.normalizeAndRelativize()
```

`..` などを整理して、先頭に残る `..` も取り除いたパスにします。これで、見かけの書き方に惑わされず、実際にたどる道順だけを見られます。

### 2. 先頭が `..` なら拒否する

```kotlin:line-numbers=53
    if (normalized.startsWith("..")) {
        throw InvalidPathException(relativePath.toString(), "Relative path $relativePath beginning with .. is invalid")
    }
```

正規化したあとでもなお `..` から始まるなら、基準の外に出ようとしています。その場合は例外を投げて、連結を止めます。

### 3. 絶対パスを拒否する

```kotlin:line-numbers=56
    check(!normalized.isAbsolute) { "Bad relative path $relativePath" }
```

`/` から始まる絶対パスは、基準を無視して別の場所を指してしまうので、ここで止めます。

### 4. 安全になったら連結する

```kotlin:line-numbers=58
    return File(this, normalized.toString())
```

ここまで来たパスだけを、基準のフォルダの下に連結して返します。

## ここがすごい

- **正規化してから確かめる**: 生の文字列ではなく、整理されたパスで `..` を見ています。`a/../../b` のような遠回りの書き方も、正規化で本当の位置が分かります。
- **二重に止める**: `..` で始まるかと、絶対パスかの両方を確かめています。どちらか一方だけでは防げない抜け道を、順番に塞いでいます。
- **例外で止める**: 危険な入力を、黙って直して通すことをしていません。呼び出し側が問題に気づけるよう、明確な失敗にしています。
- **シンボリックリンクは別問題**: 文書には、シンボリックリンクやハードリンクがあれば、この検査だけでは防げないと明記されています。安全の範囲を正直に書いている点も大切です。

## まとめ

- `combineSafe` は、相対パスを正規化して、基準の外に出るものと絶対パスを例外で拒否する。
- 文字列の見かけでなく、正規化したパスで判定する。
- パストラバーサルを防ぐには、判定の順番と前提の両方を理解しておく必要がある。

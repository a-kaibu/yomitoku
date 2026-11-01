---
title: "パターン文字列から PathMatcher を作る pathMatcher"
description: "ファイルを選ぶためのパターン文字列を、Java の PathMatcher に変える pathMatcher。glob: を付けて補い、regex: は拒否する。解釈そのものは JDK に任せている。"
language: kotlin
project: "detekt"
repo: https://github.com/detekt/detekt
license: Apache-2.0
copyright: "Copyright 2016-2024 Artur Bosch and detekt contributors"
commit: "0887fcccf93842244ba851e970aa99c7da31ffbc"
file: detekt-utils/src/main/kotlin/dev/detekt/utils/PathMatchers.kt
lines: [12, 20]
function: "pathMatcher"
difficulty: 2
tags: [ファイル, API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`pathMatcher()` は、設定ファイルに書かれた **パターンの文字列** を、Java の `PathMatcher`（ファイルのパスが条件に合うかを調べる道具）に変える関数です。detekt（Kotlin のコードを静的に調べるツール）が、対象のファイルを絞り込むときに使っています。

## コード

```kotlin:line-numbers=12
internal fun pathMatcher(pattern: String): PathMatcher {
    val result = when (pattern.substringBefore(":")) {
        "glob" -> pattern
        "regex" -> throw IllegalArgumentException(USE_GLOB_MSG)
        else -> "glob:$pattern"
    }

    return FileSystems.getDefault().getPathMatcher(result)
}
```

## 前提知識

- **`PathMatcher`**: パスが、あるパターンに合うかを調べるための Java の型です。`matches(path)` で真偽が返ります。
- **`FileSystems.getDefault()`**: 今動いている OS のファイルシステムを表します。ここから `getPathMatcher` を呼びます。
- **`glob:` と `regex:` の接頭辞**: パターンの種類を表す `glob:` や `regex:` を、先頭に付けて書く約束です。`substringBefore(":")` で、その種類を取り出しています。
- **`substringBefore`**: 文字列で最初に現れた区切りの前の部分を返す関数です。区切りがなければ、文字列全体を返します。
- **`const val`**: コンパイル時に決まる定数です。ここでは、エラー文の文字列を保持しています。

## 何をしているか

### 1. 接頭辞で振り分ける

```kotlin:line-numbers=13
    val result = when (pattern.substringBefore(":")) {
```

パターンの先頭の、`:` より前の部分で、種類を判断します。

```kotlin:line-numbers=14
        "glob" -> pattern
```

`glob:` で始まっていれば、そのまま使います。

```kotlin:line-numbers=15
        "regex" -> throw IllegalArgumentException(USE_GLOB_MSG)
```

`regex:` は、OS に依存しない扱いを保つために、拒否します。エラー文には、glob の書式だけが使えると書かれています。

```kotlin:line-numbers=16
        else -> "glob:$pattern"
```

接頭辞がなければ、`glob:` を補って扱います。利用者は、ふつうのパターンをそのまま書けます。

### 2. JDK に解釈を任せる

```kotlin:line-numbers=19
    return FileSystems.getDefault().getPathMatcher(result)
```

完成した `glob:` のパターンを、JDK の `getPathMatcher` に渡します。ワイルドカードの解釈は、すべて JDK の仕事です。

## ここがすごい

- **書式の省略を許す**: 利用者は `glob:` を付けなくても使えます。接頭辞の補い方が 1 か所に決まっているので、読み手も迷いません。
- **方式を絞って安全に**: `regex:` を拒否することで、正規表現の複雑さや OS による違いを持ち込まないようにしています。
- **説明と実装の違いに注意**: KDoc には「内部でパターンを正規表現に変換する」と書かれていますが、この関数自身はそのような変換をしていません。実際の解釈は JDK が行っています。読むときは、コメントと実装を見比べる価値があります。
- **OS 非依存の約束**: 「glob だけを使う」と決めたことで、Windows と Unix の違いは JDK の仕様に任せられます。

## まとめ

- `pathMatcher` は、パターン文字列に `glob:` を補い、`regex:` は拒否して、`PathMatcher` を作る。
- ワイルドカードの解釈は、JDK の `getPathMatcher` に任せている。
- KDoc の説明と、関数の中身が違う点は、読み手が確かめておくと安心です。

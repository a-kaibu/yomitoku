---
title: "adb devices の出力から、端末の番号と状態を取り出す"
description: "adb devices の表示を行ごとに分け、見出しや空の行を捨てて、端末の番号と状態の組のリストにする parseDeviceLines。"
language: kotlin
project: "LeakCanary"
repo: https://github.com/square/leakcanary
license: Apache-2.0
copyright: "Copyright 2015 Square, Inc."
commit: "eb60b0be53732aa016c79b7774b497770ad1e4f3"
file: shark/shark-dive/shark-dive-core/src/main/java/shark/dive/Adb.kt
lines: [242, 248]
function: "parseDeviceLines"
difficulty: 1
tags: [文字列処理, パース, イディオム]
format: 2
---

## ひとことで

`parseDeviceLines` は、Android の開発用コマンド `adb devices` の表示結果を、**端末 1 台ぶんの「番号」と「状態」の組のリストに変換する** 関数です。

LeakCanary の中の `shark-dive` という、ヒープダンプを調べる道具が、接続されている端末を探すときに使っています。`adb devices` は、見出しの行と、端末の行が並んだ文字列を返します。この関数は、その文字列から必要な情報だけを取り出します。

## コード

```kotlin:line-numbers=242
internal fun parseDeviceLines(output: String): List<Pair<String, String>> = output.lines()
  .map { it.trim() }
  .filter { it.isNotEmpty() && !it.startsWith("List of devices") && !it.startsWith("*") }
  .mapNotNull { line ->
    val columns = line.split(WHITESPACE)
    if (columns.size < 2) null else columns[0] to columns[1]
  }
```

## 前提知識

- **`adb devices`**: パソコンに接続した Android 端末の一覧を表示するコマンドです。出力は「`List of devices attached`」という見出しから始まり、その下に `端末番号<タブ>状態` の行が続きます。
- **`String.lines()`**: 文字列を改行で区切って、行のリストにする標準関数です。
- **`map`、`filter`、`mapNotNull`**: リストの各要素を変換（`map`）、条件で絞る（`filter`）、変換と「無効な要素を捨てる」を同時にする（`mapNotNull`）関数です。`mapNotNull` は、結果が `null` の要素を取り除きます。
- **`Pair`**: 2 つの値を 1 つにまとめた組です。`a to b` と書くと `Pair(a, b)` になります。
- **`it`**: ラムダの中で、受け取った要素を指す暗黙の名前です。

## 何をしているか

### 1. 前後の空白を取って、空の行と見出しを捨てる

```kotlin:line-numbers=243
  .map { it.trim() }
  .filter { it.isNotEmpty() && !it.startsWith("List of devices") && !it.startsWith("*") }
```

まず各行の前後の空白を取り除きます。そのあと、空の行と、見出しの `List of devices` で始まる行を捨てます。`*` で始まる行も捨てています。これは、`adb` が通信の状況を知らせるために出す補足の行です。

### 2. 空白で分けて、先頭 2 つを組にする

```kotlin:line-numbers=245
  .mapNotNull { line ->
    val columns = line.split(WHITESPACE)
    if (columns.size < 2) null else columns[0] to columns[1]
  }
```

残った行を、空白の並び（`\s+`）で分けます。列が 2 つ以上あれば、先頭の番号と 2 番目の状態を `to` で組にします。列が 1 つしかない行は、`null` にして捨てます。`mapNotNull` が、その `null` を結果から取り除きます。

## ここがすごい

- **変換と絞り込みを 1 本の流れで書く**: 「整形する」「不要な行を捨てる」「必要な形にする」の 3 段階が、上から下へ並んでいます。読む人は、順番に読むだけで処理の全体が分かります。
- **捨てる条件を明示する**: 見出しや補足の行は、名前で指定して捨てています。出力の形が少し変わっても、どの行を無視するかが一目で分かります。
- **失敗を `null` で表す**: 壊れた行を例外にせず、`mapNotNull` で静かに取り除きます。1 行だけおかしくても、他の端末の情報は取れます。

## まとめ

- 外部コマンドの出力は、見出しや補足を含むので、まず不要な行を捨てる。
- 空白で分けて、必要な列だけを `Pair` にすると、後の処理が扱いやすくなる。
- `mapNotNull` を使うと、壊れた行を取り除く処理と変換を 1 回で書ける。

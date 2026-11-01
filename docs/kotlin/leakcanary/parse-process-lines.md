---
title: "ps の出力から、プロセス番号と名前を取り出す"
description: "ps -A -o PID,NAME の表示を行ごとに、先頭の番号と残りの名前に分ける parseProcessLines。番号が数値でない行は捨てる。"
language: kotlin
project: "LeakCanary"
repo: https://github.com/square/leakcanary
license: Apache-2.0
copyright: "Copyright 2015 Square, Inc."
commit: "eb60b0be53732aa016c79b7774b497770ad1e4f3"
file: shark/shark-dive/shark-dive-core/src/main/java/shark/dive/DeviceHeapDumps.kt
lines: [445, 450]
function: "parseProcessLines"
difficulty: 1
tags: [文字列処理, パース, 防御的プログラミング]
format: 2
---

## ひとことで

`parseProcessLines` は、`ps -A -o PID,NAME` の表示結果を、**プロセス 1 つぶんの「番号と名前」のリストに変換する** 関数です。

`ps` は、端末で動いているプロセスの一覧を表示するコマンドです。この関数は、その一覧から、番号と名前だけを取り出して `DeviceProcess` という型にまとめます。端末で動いているアプリを探して、ヒープダンプを取るために使われます。

## コード

```kotlin:line-numbers=445
internal fun parseProcessLines(output: String): List<DeviceProcess> = output.lines()
  .mapNotNull { line ->
    val columns = line.trim().split(PROCESS_COLUMNS, limit = 2)
    val processId = columns.firstOrNull()?.toIntOrNull()
    if (processId == null || columns.size < 2) null else DeviceProcess(processId, columns[1].trim())
  }
```

## 前提知識

- **プロセス番号（PID）**: 動いているプロセスに付けられた番号です。`ps` の 1 列目に表示されます。
- **`split(regex, limit = 2)`**: 正規表現で文字列を区切る関数です。`limit = 2` を付けると、区切りは最初の 1 回だけになり、残りの部分はそのまま 2 つ目になります。
- **`toIntOrNull()`**: 文字列を整数にします。数字でなければ例外ではなく `null` を返します。
- **`firstOrNull()`**: リストの最初の要素を返します。空なら `null` です。
- **`?.`（セーフコール）**: 値が `null` なら、以降の処理をせずに `null` を返す書き方です。

## 何をしているか

### 1. 空白で 2 つに分ける

```kotlin:line-numbers=447
    val columns = line.trim().split(PROCESS_COLUMNS, limit = 2)
```

行の前後の空白を取り、空白の並びで最大 2 つに分けます。`limit = 2` のおかげで、名前の中に空白が含まれていても、2 つ目の要素として丸ごと残ります。`PROCESS_COLUMNS` は `\s+` の正規表現です。

### 2. 先頭の列を整数として読む

```kotlin:line-numbers=448
    val processId = columns.firstOrNull()?.toIntOrNull()
```

先頭の列が数字なら、プロセス番号として読みます。数字でなければ `null` になります。見出しの行（`PID NAME`）は、ここで `null` になります。

### 3. 両方そろった行だけを残す

```kotlin:line-numbers=449
    if (processId == null || columns.size < 2) null else DeviceProcess(processId, columns[1].trim())
```

番号が読めない行や、名前の列がない行は `null` にして捨てます。そうでなければ、番号と名前から `DeviceProcess` を作ります。`mapNotNull` が、捨てた行を結果から取り除きます。

## ここがすごい

- **分けすぎない**: `limit = 2` を指定して、名前の中の空白を分けないようにしています。プロセス名には空白が含まれることがあるので、この指定がないと名前が途中で切れてしまいます。
- **見出しを例外にせず捨てる**: 見出しの行は数字でないので、`toIntOrNull` が `null` を返し、そのまま捨てられます。見出しを特別に取り除く処理がなくても、正しく動きます。
- **型で結果を表す**: 番号と名前をただの文字列のリストにせず、`DeviceProcess` という型にまとめると、後の処理で取り違えにくくなります。
- **短い分岐で判定を 1 か所に集める**: 「番号があるか」「名前があるか」の判定が、1 つの `if` にまとまっています。

## まとめ

- 2 列の表示は、`split` の `limit` を使うと、2 列目に空白が含まれていても正しく読める。
- 数字に変換できない行は `toIntOrNull` で自然に弾ける。
- 「読めなかった行を捨てる」は `mapNotNull` で書くと、見出しや壊れた行を一度に扱える。

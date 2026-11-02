---
title: "文字列を、引用符つきの書き方に変換する"
description: "FastParse の literalize。文字列を二重引用符で囲み、「\"」「\\」や制御文字を、ソースコードとして読める形の escape に書き換える。unicode のときは \\u で非 ASCII も書き換える。"
language: scala
project: "FastParse"
repo: https://github.com/com-lihaoyi/fastparse
license: "MIT"
copyright: "Copyright (c) 2014 Li Haoyi (haoyi.sg@gmail.com)"
commit: "475d042bc267c53e3ac7d383dc01271cdb4862a6"
file: "fastparse/src/fastparse/internal/Util.scala"
lines: [79, 102]
format: 2
function: "literalize"
difficulty: 2
tags: [文字列処理, 標準ライブラリ, パース]
---

## ひとことで

FastParse の `literalize` は、文字列を、Scala のソースコードの文字列リテラルとして読める形に変換します。二重引用符で囲み、引用符や改行などの特別な文字を、`\"` や `\n` のような書き方に置き換えます。エラーメッセージの中で、入力の文字をそのまま見せるときに使われます。

## コード

```scala:line-numbers=79
  def literalize(s: IndexedSeq[Char], unicode: Boolean = false) = {
    val sb = new StringBuilder
    sb.append('"')
    var i = 0
    val len = s.length
    while (i < len) {
      (s(i): @switch) match {
        case '"' => sb.append("\\\"")
        case '\\' => sb.append("\\\\")
        case '\b' => sb.append("\\b")
        case '\f' => sb.append("\\f")
        case '\n' => sb.append("\\n")
        case '\r' => sb.append("\\r")
        case '\t' => sb.append("\\t")
        case c =>
          if (c < ' ' || (c > '~' && unicode)) sb.append("\\u%04x" format c.toInt)
          else sb.append(c)
      }
      i += 1
    }
    sb.append('"')

    sb.result()
  }
```

## 前提知識

- 文字列リテラルは、`"..."` で囲んだ文字列です。中に引用符を入れるには `\"` と書きます。
- `\` 自体は、`\\` と書きます。
- `\n`、`\t` などは、改行やタブを表す escape（エスケープ）です。
- `A` のように、`\u` の後に 4 桁の 16 進数を書くと、任意の文字を表せます。
- `(s(i): @switch) match` は、文字の値で分岐する `match` を、テーブルのジャンプとして最適化してほしいという注釈です。

## 何をしているか

### 1. 特別な文字は、決まった escape に置き換える

`match` の各行では、引用符、バックスラッシュ、制御文字を、対応する 2 文字の escape に変えます。

```scala:line-numbers=86
        case '"' => sb.append("\\\"")
        case '\\' => sb.append("\\\\")
        case '\b' => sb.append("\\b")
        case '\f' => sb.append("\\f")
        case '\n' => sb.append("\\n")
        case '\r' => sb.append("\\r")
        case '\t' => sb.append("\\t")
```

### 2. 制御文字と、unicode の文字は \u で書く

どれにも当てはまらない文字は、`c` という名前で受けます。空白より小さい制御文字は、`unicode` の指定にかかわらず `\u` の形にします。`unicode` が真なら、`~` より大きい文字も同じ形にします。

```scala:line-numbers=94
          if (c < ' ' || (c > '~' && unicode)) sb.append("\\u%04x" format c.toInt)
          else sb.append(c)
```

`"\\u%04x" format c.toInt` は、4 桁の 16 進数に整えた `\u` の文字列を作ります。

### 3. 結果を引用符で囲んで返す

ループの最後に閉じの引用符を付けて、`sb.result()` で文字列にして返します。

## ここがすごい

- 変換を 1 回の走査で行い、特別な文字だけを書き換えます。通常の文字はそのまま `append` するので、無駄がありません。
- 制御文字や非 ASCII をどう扱うかを `unicode` の引数で切り替えられます。表示のための文字列と、ソースに貼る文字列を、同じ関数で作れます。
- `@switch` は、文字の値が連続しているときに、`match` を速いジャンプに変えるよう頼む注釈です。
- 文字ごとの分岐を `match` で一覧にしているので、どの文字がどう変わるかが読みやすくなっています。

## まとめ

- 文字列をソースの形に書き直すには、特別な文字だけを escape に置き換えます。
- 制御文字は \u の 16 進数で書くと、表示できない文字も安全に残せます。
- 分岐を `match` にまとめると、規則が一目でわかります。

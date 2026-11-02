---
title: "空白を飛ばし、# から行末までのコメントも読み飛ばす"
description: "FastParse の ScriptWhitespace。2 つの状態を持つ小さな状態機械で、空白と改行を飛ばし、# で始まるコメントは改行まで読み捨てる。ループは末尾再帰で書かれている。"
language: scala
project: "FastParse"
repo: https://github.com/com-lihaoyi/fastparse
license: "MIT"
copyright: "Copyright (c) 2014 Li Haoyi (haoyi.sg@gmail.com)"
commit: "475d042bc267c53e3ac7d383dc01271cdb4862a6"
file: "fastparse/src/fastparse/Whitespace.scala"
lines: [64, 87]
format: 2
function: "ScriptWhitespace.whitespace.apply"
difficulty: 3
tags: [パース, 状態機械, 文字列処理]
---

## ひとことで

Scala のパーサライブラリ FastParse で、スクリプトのように `#` で始まるコメントを使う言語の空白を読み飛ばす関数です。空白と改行は飛ばし、`#` を見たら行末まで読み捨てます。読み飛ばしが終わると、次の文字の位置を返します。

## コード

```scala:line-numbers=64
    def apply(ctx: ParsingRun[_]) = {
      val input = ctx.input
      @tailrec def rec(current: Int, state: Int): ParsingRun[Unit] = {
        if (!input.isReachable(current)) {
          if (ctx.verboseFailures) ctx.reportTerminalMsg(current, Msgs.empty)
          ctx.freshSuccessUnit(current)
        }
        else {
          val currentChar = input(current)
          (state: @switch) match{
            case 0 =>
              (currentChar: @switch) match{
                case ' ' | '\t' | '\n' | '\r' => rec(current + 1, state)
                case '#' => rec(current + 1, state = 1)
                case _ =>
                  if (ctx.verboseFailures) ctx.reportTerminalMsg(current, Msgs.empty)
                  ctx.freshSuccessUnit(current)
              }
            case 1 => rec(current + 1, state = if (currentChar == '\n') 0 else state)
          }
        }
      }
      rec(current = ctx.index, state = 0)
    }
```

## 前提知識

- パーサは、入力を先頭から読みながら、決まった形を見つける部品です。「その前にある空白やコメント」を飛ばす処理は、ほぼすべてのパーサで必要です。
- `ParsingRun` は、FastParse で現在の読み取り位置や結果を運ぶ型です。`ctx.index` は現在の位置です。
- 状態機械は、`state` の値によって、次に何をするかを決める仕組みです。ここでは 0 が「空白の中」、1 が「コメントの中」です。
- `(state: @switch) match` は、整数の値で分岐する `match` を、速いジャンプに変えるよう頼む注釈です。
- `freshSuccessUnit(current)` は、位置 `current` で、値のない成功を作る関数です。

## 何をしているか

### 1. 空白と # を見分ける（空白の状態）

`state` が 0 のとき、空白や改行なら次の位置へ進みます。`#` なら、コメントの状態 1 に切り替えて進みます。それ以外の文字に来たら、ここで読み飛ばしを終えます。

```scala:line-numbers=76
                case ' ' | '\t' | '\n' | '\r' => rec(current + 1, state)
                case '#' => rec(current + 1, state = 1)
```

### 2. コメントの中は、改行まで読み捨てる

`state` が 1 のとき、改行 `\n` が来るまで、どの文字も無視して進みます。改行を見つけたら `state` を 0 に戻し、また空白として読める状態にします。

```scala:line-numbers=82
            case 1 => rec(current + 1, state = if (currentChar == '\n') 0 else state)
```

### 3. 入力の終わりでも、ここで止まる

入力の範囲外に出たら、そこで成功として止まります。読み飛ばした後の位置を、そのまま結果にします。

## ここがすごい

- 空白とコメントを、2 つの状態と 1 つの再帰だけで書いています。正規表現を使うより軽く、どの位置で何が起きたかが追いやすいです。
- 末尾再帰として書いているので、長い空白やコメントがあっても、スタックを増やしません。
- 「改行でコメントを終える」という規則が、`state = if (currentChar == '\n') 0 else state` の 1 行に入っています。
- コメントの開始記号を `#` にする、スクリプト言語向けの規則を、そのまま 1 つの関数で表しています。

## まとめ

- 空白やコメントを読み飛ばすには、状態を持った小さな状態機械が使えます。
- 状態の値で分岐すると、規則が 1 か所に集まります。
- 末尾再帰で書けば、長い入力でも安全です。

---
title: "long の値を短い文字列に変換する base64 風の関数"
description: "Apache Pekko の Helpers.base64。Long を 6 ビットずつ 64 文字の表で文字に変え、末尾まで再帰的に文字を積んで短い名前を作る。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/Helpers.scala"
lines: [119, 125]
format: 2
function: "Helpers.base64"
difficulty: 2
tags: [文字列処理, 再帰, 数値計算]
---

## ひとことで

Apache Pekko の `Helpers` にある `base64` は、`Long` の数値を 64 種類の文字で書き直す関数です。下位の 6 ビットずつを 1 文字に変え、値が 0 になるまで文字を後ろに足します。`@tailrec` が付いているので、長い数値でもスタックを増やさずに進みます。

## コード

```scala:line-numbers=119
  @tailrec
  def base64(l: Long, sb: java.lang.StringBuilder = new java.lang.StringBuilder("$")): String = {
    sb.append(base64chars.charAt(l.toInt & 63))
    val next = l >>> 6
    if (next == 0) sb.toString
    else base64(next, sb)
  }
```

## 前提知識

- 64 種類の文字で表す方式を base64 と呼びます。1 文字で 6 ビット分の情報を表せます。
- `l.toInt & 63` は、下位 6 ビットを取り出す計算です。63 は 2 進数で 111111 です。
- `>>> 6` は、符号なしで 6 ビット右にずらす操作です。下位の 6 ビットを捨てて、次の 6 ビットを下位へ運びます。
- `StringBuilder` は文字列を効率よく組み立てるための可変のオブジェクトです。
- `@tailrec` は、末尾の再帰呼び出しをループに変えることをコンパイラに確かめさせる注釈です。

## 何をしているか

### 1. 下位 6 ビットを文字にして、後ろに足す

関数は、まず `l` の下位 6 ビットを取り出し、`base64chars` の対応する文字を `sb` に追加します。

```scala:line-numbers=121
    sb.append(base64chars.charAt(l.toInt & 63))
```

`base64chars` には、英小文字、英大文字、数字、`+` と `~` の 64 文字が並んでいます。`& 63` の結果は 0 から 63 の数なので、必ずこの表のどれかに当たります。

### 2. 残りのビットを右にずらして次へ

次に `l >>> 6` で 6 ビット右にずらし、残りの数値を作ります。

```scala:line-numbers=122
    val next = l >>> 6
```

### 3. 残りが 0 になったら終わる

残りが 0 なら、文字列を返して終わります。0 でなければ、次の 6 ビットを同じ方法で処理するために自分を呼びます。

```scala:line-numbers=123
    if (next == 0) sb.toString
    else base64(next, sb)
```

`sb` は再帰の間に共有されるので、文字を毎回コピーせずに済みます。既定値の `"$"` は、先頭に付ける記号です。

## ここがすごい

- 数値を文字列にするとき、10 進数の変換のような割り算を使わず、ビットのシフトとマスクだけで済ませています。計算がとても軽くなります。
- 再帰で書いても、`@tailrec` によってループに変わるので、長い数値でもスタックを使い切りません。
- 文字列を先頭から足すのではなく、下位から順に足すので、途中の計算が単純になります。
- 既定値の `StringBuilder` を引数に持たせることで、外からは 1 つの引数で呼べるまま、内部だけで効率のよい組み立てをしています。

## まとめ

- 数値を短い文字列にするには、6 ビットずつ文字へ変える方法が使えます。
- `& 63` と `>>> 6` の組み合わせで、ビットを順に取り出せます。
- `@tailrec` の再帰は、ループと同じくらい安全に書けます。

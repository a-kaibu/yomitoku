---
title: "末尾が一致したときだけ、その部分を取り除く"
description: "Scala 標準ライブラリの StringOps.stripSuffix。文字列が指定の末尾で終わっていれば、その部分を取り除く。終わっていなければ、元の文字列をそのまま返す。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/StringOps.scala"
lines: [738, 740]
format: 2
function: "StringOps.stripSuffix"
difficulty: 1
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

Scala の標準ライブラリにある `stripSuffix` は、文字列の末尾が指定した文字列と一致するときに、その部分だけを取り除きます。一致しなければ、元の文字列を変えずに返します。たとえば `"file.scala".stripSuffix(".scala")` は `"file"` になります。

## コード

```scala:line-numbers=738
  def stripSuffix(suffix: String) =
    if (s endsWith suffix) s.substring(0, s.length - suffix.length)
    else s
```

## 前提知識

- 「末尾（suffix）」は、文字列の最後の部分のことです。`"abc"` の末尾には `"c"` や `"bc"` があります。
- `endsWith` は、文字列が指定の文字列で終わっているかを真偽値で返します。
- `substring(0, n)` は、先頭から `n` 文字の手前までを切り出します。取り除いた残りを作るために使います。
- `s.length - suffix.length` は、取り除いた後に残る長さです。
- Scala では、`if` も式として値を返すので、結果を直接返せます。

## 何をしているか

### 1. 末尾が一致するかを調べる

`s endsWith suffix` で、文字列が指定の末尾で終わっているかを調べます。中置記法なので、`s.endsWith(suffix)` と同じ意味です。

```scala:line-numbers=739
    if (s endsWith suffix) s.substring(0, s.length - suffix.length)
```

### 2. 一致したら、末尾を除いた部分を返す

一致したら、先頭から「全体の長さ − 末尾の長さ」までを切り出します。これで、末尾だけが取り除かれます。

```scala:line-numbers=739
    if (s endsWith suffix) s.substring(0, s.length - suffix.length)
```

### 3. 一致しなければ、そのまま返す

末尾が一致しなければ、取り除くものがないので `s` をそのまま返します。

```scala:line-numbers=740
    else s
```

## ここがすごい

- 一致しない場合は、新しい文字列を作らず、元の値を返します。`stripSuffix` を何度呼んでも、無駄なコピーが増えません。
- 「取り除く長さ」を `suffix.length` で計算するので、末尾が何文字でも同じ書き方で動きます。
- 同じ仕組みの `stripPrefix` と対になっていて、先頭と末尾を同じ書き方で扱えます。
- 一致しないときに例外を投げず、元の文字列を返すので、呼び出し側は条件を書かずに済みます。

## まとめ

- 末尾だけを取り除くには、一致を確かめてから、残りの長さで切り出します。
- 一致しない場合は元の値を返すと、使う側が安全に書けます。
- 先頭用と末尾用を対で覚えると、文字列の整形が楽になります。

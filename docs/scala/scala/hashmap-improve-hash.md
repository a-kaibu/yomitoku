---
title: "上位 16 ビットを下位へ混ぜて、バケットの偏りを減らす"
description: "Scala の mutable.HashMap.improveHash。ハッシュ値の上位 16 ビットを XOR で下位 16 ビットに混ぜ、下位ビットだけでバケットを決めても偏らないようにする。java.util.HashMap と同じ改善。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/HashMap.scala"
lines: [66, 75]
format: 2
function: "HashMap.improveHash"
difficulty: 2
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

Scala の標準の `mutable.HashMap` で、キーのハッシュ値を内部のバケットに振り分ける前に使う `improveHash` です。上位 16 ビットを下位 16 ビットへ XOR で混ぜます。バケットを下位ビットだけで決めても、上位に偏ったハッシュ値で一か所に集中しないようにしています。

## コード

::: code-group

```scala:line-numbers=66 [日本語訳]
  @`inline` private[this] def improveHash(originalHash: Int): Int = {
    // 念のため、上位 16 ビットを下位 16 ビットへ XOR で混ぜます。ハッシュの値が上位に偏っている場合に備えるためです。
    // 上位のビットに偏りがあっても、バケットは下位ビットだけで決めるので、この改善が必要です。
    // java.util.HashMap と同じ改善の方法です。
    //
    // この関数は自分自身が逆変換になります。すべての整数 i について improveHash(improveHash(i)) は i と等しくなります。
    // そのため、元のハッシュが必要なとき（たとえば immutable.HashMap へ追加するとき）にも取り出せます。
    // だから unimproveHash は、このメソッドをそのまま呼びます。
    originalHash ^ (originalHash >>> 16)
  }
```

```scala:line-numbers=66 [原文]
  @`inline` private[this] def improveHash(originalHash: Int): Int = {
    // Improve the hash by xoring the high 16 bits into the low 16 bits just in case entropy is skewed towards the
    // high-value bits. We only use the lowest bits to determine the hash bucket. This is the same improvement
    // algorithm as in java.util.HashMap.
    //
    // This function is also its own inverse. That is, for all ints i, improveHash(improveHash(i)) = i
    // this allows us to retrieve the original hash when we need it, for instance when appending to an immutable.HashMap
    // and that is why unimproveHash simply forwards to this method
    originalHash ^ (originalHash >>> 16)
  }
```

:::

## 前提知識

- `HashMap` は、キーのハッシュ値からバケット（格納場所の番号）を決めて、値を保存します。
- バケットの番号は、ハッシュ値の下位の数ビットで決めることが多いです。そのため、上位ビットしか違わないキーは、同じバケットに集まりやすくなります。
- `>>>` は符号なしの右シフトです。`originalHash >>> 16` は、上位 16 ビットを下位に移します。
- `^` は XOR で、同じビットなら 0、違うなら 1 を返します。
- `@inline` は、関数を呼び出しの場所に展開してもらうための注釈です。

## 何をしているか

### 1. 上位 16 ビットを下位へ運んで、XOR で混ぜる

`improveHash` の本体は 1 行です。元のハッシュ値と、それを 16 ビット右にずらした値を XOR します。

```scala:line-numbers=74
    originalHash ^ (originalHash >>> 16)
```

上位 16 ビットが下位の 16 ビットに混ざるので、上位だけが違うキーも、下位ビットの値が変わります。

### 2. なぜ 16 ビットなのか

ハッシュ表の大きさが小さいと、バケットの番号は下位の数ビットだけで決まります。上位 16 ビットを下位に混ぜておけば、上位の情報もバケットに反映されます。

### 3. 2 回かけると元に戻る

コメントにあるように、この関数は自分自身が逆変換です。`improveHash` を 2 回かけると、元のハッシュ値に戻ります。そのため、元のハッシュ値が必要な場面でも、同じ関数で取り出せます。

## ここがすごい

- 1 回の右シフトと 1 回の XOR だけで、上位ビットの情報を下位に運べます。計算がとても軽いです。
- 自分自身が逆変換になるように作られているので、保存用の変換と取り出し用の変換を別に作らずに済みます。
- コメントに、この改善が `java.util.HashMap` と同じ方法だと書かれています。ほかの言語の標準の仕組みと同じ考えを使うことで、ハッシュの偏りを抑えています。
- 関数を `private[this]` にして外から使わせないのは、バケットの決め方を内部だけに閉じ込めるためです。

## まとめ

- ハッシュ表では、上位ビットの情報も下位に混ぜると、バケットの偏りを減らせます。
- 1 回のシフトと XOR で、軽く混ぜられます。
- 逆変換が自分自身になる関数は、保存と取り出しの両方に使えます。

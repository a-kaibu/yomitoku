---
title: "配列の再構成の印を、インデックスの最下位ビットに隠す"
description: "Caffeine の MpscGrowableArrayQueue.modifiedCalcElementOffset。生産者のインデックスの最下位ビットを、配列を作り直し中かどうかの印に使い、位置を求めるときは 1 ビット右へずらして印を捨てる。"
language: java
project: Caffeine
repo: https://github.com/ben-manes/caffeine
license: Apache-2.0
copyright: "Copyright Ben Manes. All Rights Reserved."
commit: "10646b00c14a7837fe16a16a2a7b1f82e5fa3155"
file: caffeine/src/main/java/com/github/benmanes/caffeine/cache/MpscGrowableArrayQueue.java
lines: [633, 635]
function: "MpscGrowableArrayQueue.modifiedCalcElementOffset"
difficulty: 3
format: 2
tags: [並行処理, ビット演算, データ構造]
---

## ひとことで

Caffeine の `MpscGrowableArrayQueue` は、複数の生産者が 1 つの消費者へ値を渡す、並行キューです。配列が一杯になると、配列を大きく作り直します（再構成）。その間、他の生産者は、古い配列に書き込んでしまわないように待つ必要があります。

このキューは、その「作り直し中」の印を、生産者のインデックスの最下位ビットに入れています。`modifiedCalcElementOffset` は、そのビットを取り除いて、配列の中の位置を求めるメソッドです。

## コード

```java:line-numbers=633
  static long modifiedCalcElementOffset(long index, long mask) {
    return (index & mask) >> 1;
  }
```

## 前提知識

- **生産者のインデックス**: 生産者が次に書く位置を表す、`long` の値です。ここでは、実際の位置を 1 ビット左へずらした形で持っています。
- **最下位ビット**: 2 進数の最も下の桁です。`pIndex & 1` で取り出せます。
- **マスク**: `producerMask` は、配列の大きさに合わせた、ビットの 1 の並びです。インデックスの位置のビットだけを残すのに使います。
- **CAS**: 値が期待どおりなら書き換える、並行処理の基本の操作です。このメソッドの周辺で、インデックスを進めるのに使われます。

## 何をしているか

### 1. 印のビットを見て、待つかどうかを決める

```java:line-numbers=262
      if ((pIndex & 1) == 1) {
        continue;
      }
```

生産者は、インデックスの最下位ビットが 1 なら、作り直し中とみなして、読み直します。0 なら、インデックスは有効なので、先に進みます。

### 2. 印を捨てて、配列の位置を求める

`modifiedCalcElementOffset` は、`(index & mask) >> 1` を計算します。`mask` でインデックスの位置の部分を残し、`>> 1` で最下位ビットを捨てます。結果として、配列の中の位置が得られます。

このメソッドのコメントは、定数の畳み込みによってコストがかからないと説明しています。

## ここがすごい

- **印を追加のフィールドにしない**: 作り直し中の印を、インデックスの最下位ビットに入れているので、同じ値を 1 回の読み取りで確認できます。別の変数を、同時に読む必要がありません。
- **位置の計算がシフト 1 回で済む**: インデックスが 1 ビットずらされているので、位置を求める計算は、マスクとシフトだけになります。
- **マスクの作り方と対になる**: 配列を作り直すとき、新しいマスクも同じように 1 ビットずらして作られます。そのため、印のビットはいつも、マスクの外側に残ります。
- **待ちは短い**: 印が立っているときは、生産者は `continue` で読み直すだけです。作り直しが終わるまで、同じ処理を繰り返します。

## まとめ

- 生産者のインデックスの最下位ビットは、配列を作り直し中かどうかの印として使う。
- `modifiedCalcElementOffset` は、マスクで位置の部分を残し、`>> 1` で印のビットを捨てて、配列の位置を求める。
- 印をインデックスに埋め込むので、1 回の読み取りで、位置と作り直しの状態を同時に判断できる。

---
title: "MIN_VALUE を足すだけで「符号なし比較」に変える"
description: "Java には符号なし整数型がない。compareUnsigned は両方に MIN_VALUE を足すだけで、ふつうの符号付き比較を符号なし比較に変えてしまう。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Integer.java
lines: [1447, 1450]
function: "Integer.compareUnsigned"
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, ハック]
---

## ひとことで

Java の `int` は常に「符号付き」で、`-1` は `-1` として扱われます。でも、ネットワークやファイル形式では、同じ 32 ビットを **0〜約 42 億の符号なしの数** として扱いたいことがあります。そのとき `-1`（全ビット 1）は最大値 `4294967295` です。

`Integer.compareUnsigned(x, y)` は、2 つの `int` を符号なしの数とみなして大小を比べます。実装は **両方に `MIN_VALUE` を足してから、ふつうに比べる** だけです。

## コード

```java:line-numbers=1447
    @IntrinsicCandidate
    public static int compareUnsigned(int x, int y) {
        return compare(x + MIN_VALUE, y + MIN_VALUE);
    }
```

## 前提知識

- **符号付きと符号なし**: 同じ 32 ビットでも、最上位ビットを「マイナスの印」と読むか（符号付き）、「2^31 の位」と読むか（符号なし）で値が変わります。`0xFFFFFFFF` は符号付きなら `-1`、符号なしなら `4294967295` です。
- **`MIN_VALUE`**: `Integer.MIN_VALUE` = `-2147483648`。ビットでは `1000…000`（最上位ビットだけが 1）です。
- **`compare(a, b)`**: 同じクラスの `Integer.compare` で、`a < b` なら負、等しければ 0、`a > b` なら正を返します。
- **オーバーフロー**: `int` の足し算は 32 ビットからあふれても例外にならず、回り込みます。
- **`@IntrinsicCandidate`**: JVM が CPU の「符号なし比較」命令に置き換えてよい、という印です。

## 何をしているか

### MIN_VALUE を足すと何が起きるか

```java:line-numbers=1449
        return compare(x + MIN_VALUE, y + MIN_VALUE);
```

`MIN_VALUE` は最上位ビットだけが 1 の数です。これを足すと、**最上位ビットだけが反転** します（下位 31 ビットは 0 を足すだけなので変わらず、最上位からの繰り上がりは捨てられます）。

符号なしの世界では、`0` から `0x7FFFFFFF` が小さい側、`0x80000000` から `0xFFFFFFFF` が大きい側です。ところが符号付きの世界では、後者が負の数になってしまうので、順番が逆に見えます。

最上位ビットを反転すると、

| 元のビット | 符号なしの値 | 反転後を符号付きで読むと |
| --- | --- | --- |
| `0x00000000` | 0 | `-2147483648`（最小） |
| `0x7FFFFFFF` | 2147483647 | `-1` |
| `0x80000000` | 2147483648 | `0` |
| `0xFFFFFFFF` | 4294967295 | `2147483647`（最大） |

となり、**符号なしの順番が、そのまま符号付きの順番に並び替わります**。あとはふつうの `compare` を使えばよいのです。

### 具体例

`compareUnsigned(-1, 1)` を考えます。符号なしでは `4294967295` と `1` なので、`-1` の方が大きいはずです。

- `-1 + MIN_VALUE` = `2147483647`
- `1 + MIN_VALUE` = `-2147483647`
- `compare(2147483647, -2147483647)` は正

正しく「`-1` の方が大きい」と判定されました。

## ここがすごい

- **新しい型を作らずに符号なしを扱う**: Java の設計者は、混乱を避けるために符号なし整数型を言語に入れませんでした。その代わりに、Java 8 で `compareUnsigned` や `divideUnsigned` などのメソッドが追加されました。このメソッドは、既存の符号付き比較を再利用して、たった 1 行で符号なし比較を実現しています。
- **数直線をずらすという発想**: 符号なしの範囲 `[0, 2^32)` を、`MIN_VALUE` ぶんずらして符号付きの範囲 `[-2^31, 2^31)` に重ねています。ずらしても大小関係は変わらないので、比較の結果も変わりません。ビット演算で言えば「最上位ビットの反転」で、`x ^ MIN_VALUE` と書いても同じ意味になります。
- **場合分けがいらない**: 素直に書くと「両方正」「両方負」「片方だけ負」で場合分けが必要ですが、この方法なら 1 回の比較だけです。

## まとめ

- 最上位ビットを反転すると、符号なしの大小と符号付きの大小が一致する。
- `x + MIN_VALUE`（あるいは `x ^ MIN_VALUE`）はその反転を 1 演算で行う。
- Java で符号なし整数を扱うときは、`Integer.compareUnsigned` などの専用メソッドを使う。

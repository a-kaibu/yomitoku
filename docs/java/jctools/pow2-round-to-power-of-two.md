---
title: "2 のべき乗へ切り上げて、範囲外を弾く"
description: "JCTools の Pow2.roundToPowerOfTwo。与えた値以上で最小の 2 のべき乗を、先頭ゼロの数で求める。上限と負の数を先に弾く防御的な書き方に注目する。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/util/Pow2.java
lines: [29, 42]
function: "Pow2.roundToPowerOfTwo"
difficulty: 2
format: 2
tags: [ビット演算, 防御的プログラミング, 数値計算]
---

## ひとことで

`Pow2.roundToPowerOfTwo(value)` は、与えられた値以上で一番小さい 2 のべき乗を返します。たとえば 5 なら 8、16 なら 16 を返します。キューの容量をちょうど 2 のべき乗にしたいときに使われます。

2 のべき乗にすると、「添字を計算するための割り算」を「ビットの AND」に置き換えられます。そのため、並行処理の高速なキューでは、このような丸め処理が欠かせません。

## コード

```java:line-numbers=29
    public static int roundToPowerOfTwo(final int value)
    {
        if (value > MAX_POW2)
        {
            throw new IllegalArgumentException("There is no larger power of 2 int for value:" + value +
                " since it exceeds 2^31.");
        }
        if (value < 0)
        {
            throw new IllegalArgumentException("Given value:" + value + ". Expecting value >= 0.");
        }
        final int nextPow2 = 1 << (32 - Integer.numberOfLeadingZeros(value - 1));
        return nextPow2;
    }
```

このコードが使う上限の定数は、同じファイルで次のように定義されています。

```java:line-numbers=22
    public static final int MAX_POW2 = 1 << 30;
```

## 前提知識

- **2 のべき乗**: 1, 2, 4, 8, 16 のように、2 を何回か掛けた数です。2 進数では 1 つのビットだけが立っています。
- **`Integer.numberOfLeadingZeros(x)`**: `x` の最上位の 1 より上にある 0 の個数を返します。たとえば 1 は 31 個、8 は 28 個です。
- **`1 << n`**: 1 を `n` 桁左にずらした値で、2 の `n` 乗になります。
- **`IllegalArgumentException`**: 引数が不正なときに投げられる例外です。呼び出し側が間違いに気づけるようにします。
- **`value - 1` の意味**: 2 のべき乗ちょうどの値を正しく扱うために、1 を引いてから桁を数えます。

## 何をしているか

### 1. 上限を先にチェックする

```java:line-numbers=31
        if (value > MAX_POW2)
        {
            throw new IllegalArgumentException("There is no larger power of 2 int for value:" + value +
                " since it exceeds 2^31.");
        }
```

`value` が `MAX_POW2`（2^30）より大きいと、次の 2 のべき乗は `int` に収まりません。そこで例外を投げます。

### 2. 負の値を弾く

```java:line-numbers=36
        if (value < 0)
        {
            throw new IllegalArgumentException("Given value:" + value + ". Expecting value >= 0.");
        }
```

負の数は、2 のべき乗を考える意味がありません。ここで例外を投げて、計算に入る前に止めます。

### 3. 最上位ビットから次の 2 のべき乗を作る

```java:line-numbers=40
        final int nextPow2 = 1 << (32 - Integer.numberOfLeadingZeros(value - 1));
        return nextPow2;
```

`value - 1` の先頭の 1 の位置を求め、そこから 1 を左にずらします。`32 - numberOfLeadingZeros(value - 1)` は、`value - 1` を表すのに必要な桁数です。その桁数だけ 1 を左にずらすと、`value` 以上の 2 のべき乗が得られます。

- `value = 5`: `value - 1 = 4`（`100`、桁数 3）なので、`1 << 3 = 8`。
- `value = 8`: `value - 1 = 7`（`111`、桁数 3）なので、`1 << 3 = 8`。ちょうど 2 のべき乗はそのまま返ります。

## ここがすごい

- **1 を引くのがこつ**: `value` をそのまま数えると、8 は 16 に丸められてしまいます。`value - 1` を使うことで、ちょうど 2 のべき乗の値はそのまま返せます。
- **ループを使わない**: 2 のべき乗を探すために、1 から順に倍にしていく必要がありません。先頭の 1 の位置を一度の計算で求めて、そこから 2 のべき乗を作っています。
- **上限の理由が書いてある**: 例外メッセージに「2^31 を超える」と書かれていて、なぜ弾くのかがすぐ分かります。整数のあふれを、静かに壊れた値にせず、はっきり失敗させる書き方です。
- **負の値も明示的に弾く**: 負の数を入れると桁数の計算が崩れます。その前提を、コードの中で宣言しています。

## まとめ

- 2 のべき乗への切り上げは、`value - 1` の桁数から 1 を左へずらして求める。
- 上限と負の値を先に弾くと、あふれや誤った結果を防げる。
- 2 のべき乗にすると、添字の計算をビットの AND で済ませられる。

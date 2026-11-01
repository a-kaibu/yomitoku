---
title: "負の側で数を組み立てて MIN_VALUE までこぼさず読む parseInt"
description: "文字列を int に変換する parseInt。数をあえて負の数として積み上げることで、-2147483648 まで正しく読み、オーバーフローを掛け算の前に見抜く。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Integer.java
lines: [494, 542]
function: "Integer.parseInt(String, int)"
difficulty: 3
tags: [パース, 数値計算, 防御的プログラミング]
---

## ひとことで

`Integer.parseInt("123", 10)` は、文字列 `"123"` を整数 `123` に変換します。第 2 引数は基数（10 進数なら 10、16 進数なら 16）です。

この実装の最大の特徴は、**数を負の数として組み立てる** ことです。`"123"` なら `-1 → -12 → -123` と積み上げ、最後に符号を反転します。こうすると、`int` の最小値 `-2147483648` も正しく読めます。

## コード

```java:line-numbers=494
    public static int parseInt(String s, int radix)
                throws NumberFormatException {
        /*
         * WARNING: This method may be invoked early during VM initialization
         * before IntegerCache is initialized. Care must be taken to not use
         * the valueOf method.
         */

        if (s == null) {
            throw new NumberFormatException("Cannot parse null string");
        }

        if (radix < Character.MIN_RADIX) {
            throw new NumberFormatException(String.format(
                "radix %s less than Character.MIN_RADIX", radix));
        }

        if (radix > Character.MAX_RADIX) {
            throw new NumberFormatException(String.format(
                "radix %s greater than Character.MAX_RADIX", radix));
        }

        int len = s.length();
        if (len == 0) {
            throw NumberFormatException.forInputString("", radix);
        }
        int digit = ~0xFF;
        int i = 0;
        char firstChar = s.charAt(i++);
        if (firstChar != '-' && firstChar != '+') {
            digit = digit(firstChar, radix);
        }
        if (digit >= 0 || digit == ~0xFF && len > 1) {
            int limit = firstChar != '-' ? MIN_VALUE + 1 : MIN_VALUE;
            int multmin = limit / radix;
            int result = -(digit & 0xFF);
            boolean inRange = true;
            /* Accumulating negatively avoids surprises near MAX_VALUE */
            while (i < len && (digit = digit(s.charAt(i++), radix)) >= 0
                    && (inRange = result > multmin
                        || result == multmin && digit <= radix * multmin - limit)) {
                result = radix * result - digit;
            }
            if (inRange && i == len && digit >= 0) {
                return firstChar != '-' ? -result : result;
            }
        }
        throw NumberFormatException.forInputString(s, radix);
    }
```

## 前提知識

- **`int` の範囲は非対称**: 最大値は `2147483647`、最小値は `-2147483648` です。負の側が 1 つ多いので、`2147483648` という正の数は `int` で表せません。
- **`throws NumberFormatException`**: 数として読めない文字列が来たら、この例外を投げることを示しています。
- **`s.charAt(i++)`**: `i` 番目の文字を取り出し、そのあと `i` を 1 増やします。
- **`digit(ch, radix)`**: `Character.digit` のことで、文字を数字の値に変えます。`'7'` なら 7、16 進数の `'f'` なら 15、数字でなければ `-1` です。
- **`~0xFF`**: `0xFF` のビットを反転した値で、`-256` です。ここでは「まだ数字を読んでいない」ことを表す目印として使われています。
- **`&&` と `||` の中の代入**: `(digit = …) >= 0` のように、条件式の中で変数に代入しつつ値を比べることができます。

## 何をしているか

### 1. 入力のチェック（502〜519 行目）

`null`、基数の範囲外（2〜36 以外）、空文字列はすぐに例外にします。

### 2. 先頭の符号（520〜525 行目）

最初の文字が `-` か `+` でなければ、それを数字として読みます。符号なら `digit` は目印の `~0xFF` のままです。

526 行目の条件は「最初の文字が数字だった」または「符号で、しかも後ろに文字がある」です。`"-"` だけの文字列はここではじかれます。

### 3. 限界値の準備（527〜528 行目）

- `limit`: 許される最小の値。負の数なら `MIN_VALUE`、正の数なら `MIN_VALUE + 1`（= `-2147483647`、最後に反転すると最大値になる）。
- `multmin`: `limit / radix`。「これより小さくなったら、あと 1 回 `radix` 倍するとあふれる」という境目です。

### 4. 負の数として積み上げる（529〜536 行目）

`result = radix * result - digit` で、1 桁ずつ「10 倍して、その桁を引く」を繰り返します。`"-2147483648"` なら、最後に `-2147483648` ちょうどになります。もし正の数で積み上げると、途中で `2147483648` という表せない数が必要になり、あふれてしまいます。

ループを続ける条件の `inRange` は、**掛け算の前に** あふれを予測します。

- `result > multmin` なら、10 倍しても `limit` 以上なので安全。
- `result == multmin` のときだけ、次の桁が十分小さいか（`digit <= radix * multmin - limit`）を確かめます。

### 5. 結果を返す（537〜540 行目）

途中で数字以外の文字があれば `digit` が負に、あふれそうなら `inRange` が偽になってループを抜けます。最後まで読めていれば、正の数なら符号を反転して返します。

## ここがすごい

- **負の側で積み上げる**: 負の範囲の方が 1 つ広いという `int` の性質を利用して、最小値まで 1 つのループで読めるようにしています。コメントの "Accumulating negatively avoids surprises near MAX_VALUE" がその意図です。
- **あふれる前に止める**: 計算してからあふれを調べるのではなく、`multmin` との比較で「次の計算があふれるか」を先に判断しています。あふれた値はもう信用できないからです。
- **目印の値で状態を表す**: `~0xFF` は `digit` の取りうる値（-1〜35）と決して重ならないので、「符号だった」という状態を別の変数を使わずに表せます。`digit & 0xFF` で目印を 0 にしてから使っている点も巧妙です。
- **起動直後でも安全に**: 冒頭のコメントにある通り、このメソッドは JVM の初期化中にも呼ばれるので、まだ準備できていない機能（`Integer.valueOf` のキャッシュ）を使わないよう注意されています。

## まとめ

- `int` は負の側が 1 つ広い。最小値まで読みたければ負の数として組み立てる。
- オーバーフローは、計算の前に「境目の値」と比べて予測する。
- 取りうる値と重ならない目印の値を使うと、状態を少ない変数で表せる。

---
title: "後ろから比べて、大きく飛ばす Boyer–Moore の探索"
description: "Java の正規表現エンジン Pattern の BnM.match。パターンを右から左へ比べ、不一致のとき「悪い文字」と「良い接尾辞」の 2 つの表から大きい方の距離だけ進める Boyer–Moore 法の探索。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1999, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/regex/Pattern.java
lines: [5716, 5749]
function: "Pattern.BnM.match"
difficulty: 3
format: 2
tags: [アルゴリズム, 文字列処理, 正規表現]
---

## ひとことで

`BnM.match` は、正規表現の中の「ただの文字列」のパターンを、テキストの中から探す処理です。Java の `Pattern` は、パターンが十分な長さの文字列のとき、この Boyer–Moore（BM）法を使います。

BM 法は、パターンを左から比べるのではなく、右から比べます。不一致が見つかったとき、大きく飛ばせる距離を事前に計算しておいた表から求め、テキストの読み取り位置を一度に進めます。

## コード

::: code-group

```java:line-numbers=5716 [日本語訳]
        boolean match(Matcher matcher, int i, CharSequence seq) {
            int[] src = buffer;
            int patternLength = src.length;
            int last = matcher.to - patternLength;

            // テキストの中で、可能なすべての一致位置を順に見る
NEXT:       while (i <= last) {
                // パターンを右から左へ見る
                for (int j = patternLength - 1; j >= 0; j--) {
                    int ch = seq.charAt(i+j);
                    if (ch != src[j]) {
                        // 不一致のとき、悪い文字の移動量と良い接尾辞の移動量の大きい方だけ右へずらす
                        // 悪い文字の移動量と、良い接尾辞の移動量の大きい方だけ右へ進める
                        i += Math.max(j + 1 - lastOcc[ch&0x7F], optoSft[j]);
                        continue NEXT;
                    }
                }
                // パターン全体が、位置 i から一致した
                matcher.first = i;
                boolean ret = next.match(matcher, i + patternLength, seq);
                if (ret) {
                    matcher.first = i;
                    matcher.groups[0] = matcher.first;
                    matcher.groups[1] = matcher.last;
                    return true;
                }
                i++;
            }
            // BnM は、非アンカーの場合の先頭ノードとしてだけ使われる
            // そのため BnM は Start() の代わりを務める。Start() は、見つからなければ末尾まで探す
            // 見つからなければ、hitEnd が true になる
            matcher.hitEnd = true;
            return false;
        }
```

```java:line-numbers=5716 [原文]
        boolean match(Matcher matcher, int i, CharSequence seq) {
            int[] src = buffer;
            int patternLength = src.length;
            int last = matcher.to - patternLength;

            // Loop over all possible match positions in text
NEXT:       while (i <= last) {
                // Loop over pattern from right to left
                for (int j = patternLength - 1; j >= 0; j--) {
                    int ch = seq.charAt(i+j);
                    if (ch != src[j]) {
                        // Shift search to the right by the maximum of the
                        // bad character shift and the good suffix shift
                        i += Math.max(j + 1 - lastOcc[ch&0x7F], optoSft[j]);
                        continue NEXT;
                    }
                }
                // Entire pattern matched starting at i
                matcher.first = i;
                boolean ret = next.match(matcher, i + patternLength, seq);
                if (ret) {
                    matcher.first = i;
                    matcher.groups[0] = matcher.first;
                    matcher.groups[1] = matcher.last;
                    return true;
                }
                i++;
            }
            // BnM is only used as the leading node in the unanchored case,
            // and it replaced its Start() which always searches to the end
            // if it doesn't find what it's looking for, so hitEnd is true.
            matcher.hitEnd = true;
            return false;
        }
```

:::

## 前提知識

- **文字列の探索**: 長いテキストの中から、短いパターンが現れる位置を見つける作業です。
- **悪い文字（bad character）の移動量**: テキストの中の文字が、パターンのどこに現れるかで決まる、飛ばせる距離です。`lastOcc` という表に事前に入っています。
- **良い接尾辞（good suffix）の移動量**: 一致した後ろの部分が、パターン内の別の場所にも現れるなら、その分だけ飛ばせる距離です。`optoSft` という表です。
- **`lastOcc`**: 文字の下位 7 ビットごとに、パターンの中で最後に現れた位置を記録した表です。
- **`matcher.to`**: 検索の対象になっているテキストの終わりの位置です。

## 何をしているか

### 1. 探せる最後の位置を決める

```java:line-numbers=5717
            int[] src = buffer;
            int patternLength = src.length;
            int last = matcher.to - patternLength;
```

パターンの長さを `patternLength` とし、一致を始められる最後の位置を `last` とします。`last` より後ろからは、パターン全体が入りきらないので探しません。

### 2. パターンを右から比べる

```java:line-numbers=5721
            // テキストの中で、可能なすべての一致位置を順に見る
NEXT:       while (i <= last) {
                // パターンを右から左へ見る
                for (int j = patternLength - 1; j >= 0; j--) {
                    int ch = seq.charAt(i+j);
                    if (ch != src[j]) {
                        // 不一致のとき、悪い文字の移動量と良い接尾辞の移動量の大きい方だけ右へずらす
                        // 悪い文字の移動量と、良い接尾辞の移動量の大きい方だけ右へ進める
                        i += Math.max(j + 1 - lastOcc[ch&0x7F], optoSft[j]);
                        continue NEXT;
                    }
```

各位置 `i` で、パターンの右端から左へ 1 文字ずつ比べます。不一致になったら、`lastOcc`（悪い文字の移動量）と `optoSft`（良い接尾辞の移動量）の大きい方を求めて、`i` をその分だけ進めます。どちらの表も、パターンだけから事前に計算してあります。

### 3. 全部一致したら、続きを確かめる

```java:line-numbers=5734
                matcher.first = i;
                boolean ret = next.match(matcher, i + patternLength, seq);
                if (ret) {
                    matcher.first = i;
                    matcher.groups[0] = matcher.first;
                    matcher.groups[1] = matcher.last;
                    return true;
                }
                i++;
```

パターン全体が一致したら、その位置から後ろの正規表現の残りを、`next` に任せて確かめます。残りも一致すれば、グループの範囲を記録して `true` を返します。残りが一致しなければ、1 つ先へ進んで探し続けます。

### 4. 見つからなければ末尾まで探した印を付ける

```java:line-numbers=5747
            matcher.hitEnd = true;
            return false;
        }
```

探し終わっても一致がなければ、`hitEnd` を `true` にして `false` を返します。Java のマッチャーは、この印を見て、テキストの末尾まで探したことを知ります。

## ここがすごい

- **右から比べると大きく飛べる**: 左から比べると、一致しない文字が見つかっても 1 つしか進めないことが多いです。右から比べて最初に不一致になった文字の情報を使うと、大きな距離を飛ばせます。
- **2 つの表の大きい方を使う**: 悪い文字の表と良い接尾辞の表は、それぞれ別の理由で安全な移動量を教えてくれます。両方を比べて、より大きい方を採用するので、無駄な確認が減ります。
- **表は前もって作る**: 表は、パターンが決まったときに一度だけ計算します。テキストを探す時間には、表を引くだけです。
- **短いパターンは使わない**: 長さが 4 未満のパターンでは、表の計算の手間が見合わないので、この方法を使いません。実用的な判断が、コードに書かれています。

## まとめ

- Boyer–Moore 法は、パターンを右から比べ、不一致のときに 2 つの表から大きい方の距離だけ進める。
- 表はパターンから事前に計算し、探索中は表を引くだけで済む。
- 一致が見つかれば、後ろの正規表現を続けて確かめ、見つからなければ `hitEnd` で末尾まで探したことを示す。

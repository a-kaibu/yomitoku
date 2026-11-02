---
title: "一致が外れたとき、失敗テーブルで途中から再開する"
description: "Netty の KmpSearchProcessorFactory。探すバイト列の接頭辞と接尾辞の一致の長さを表に作り、ずれたときに最初から比べ直さずに続きの位置へ飛ぶ KMP 法の仕組み。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2020 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/search/KmpSearchProcessorFactory.java
lines: [67, 81]
function: "KmpSearchProcessorFactory"
difficulty: 3
format: 2
tags: [文字列処理, アルゴリズム, 探索]
---

## ひとことで

KMP 法は、長いバイト列の中から短いバイト列（針）を探すアルゴリズムです。普通の探し方は、途中で一致が外れると、探す位置を 1 つ進めて最初から比べ直します。KMP 法は、それまでに読んだ内容を生かして、針のどこから比べ直せばよいかを、あらかじめ表にしておきます。

Netty の `KmpSearchProcessorFactory` は、この表を針から作り、バッファを 1 バイトずつ読みながら、針の出現を探します。

## コード

```java:line-numbers=67
    KmpSearchProcessorFactory(byte[] needle) {
        this.needle = needle.clone();
        this.jumpTable = new int[needle.length + 1];

        int j = 0;
        for (int i = 1; i < needle.length; i++) {
            while (j > 0 && needle[j] != needle[i]) {
                j = jumpTable[j];
            }
            if (needle[j] == needle[i]) {
                j++;
            }
            jumpTable[i + 1] = j;
        }
    }
```

## 前提知識

- **針（needle）**: 探したいバイト列です。
- **接頭辞と接尾辞の一致（border）**: 針の先頭から長さ `k` の部分と、末尾から長さ `k` の部分が一致するとき、その長さ `k` を border と呼びます。この長さが、どこから比べ直せるかを決めます。
- **`jumpTable[k]`**: 針の先頭から `k` バイトまでの部分について、一致が外れたときに戻るべき長さです。これが失敗テーブルです。
- **`currentPosition`**: いまの針の一致の長さです。`process` の中で増えたり、表で戻されたりします。

## 何をしているか

### 1. 失敗テーブルを作る

```java:line-numbers=71
        int j = 0;
        for (int i = 1; i < needle.length; i++) {
            while (j > 0 && needle[j] != needle[i]) {
                j = jumpTable[j];
            }
            if (needle[j] == needle[i]) {
                j++;
            }
            jumpTable[i + 1] = j;
        }
```

`j` は、いまの接頭辞の一致の長さです。針の `i` 番目の文字を読むとき、`needle[j]` と合わなければ、`j = jumpTable[j]` で一致の長さを戻します。一致したときだけ `j` を 1 増やし、`jumpTable[i + 1] = j` として記録します。この繰り返しで、針の各位置に、その位置までの border の長さが入ります。

### 2. バイトを読みながら、表で位置を戻す

```java:line-numbers=46
        public boolean process(byte value) {
            while (currentPosition > 0 && PlatformDependent.getByte(needle, currentPosition) != value) {
                currentPosition = PlatformDependent.getInt(jumpTable, currentPosition);
            }
            if (PlatformDependent.getByte(needle, currentPosition) == value) {
                currentPosition++;
            }
            if (currentPosition == needle.length) {
                currentPosition = PlatformDependent.getInt(jumpTable, currentPosition);
                return false;
            }

            return true;
        }
```

`process` は、バイトを 1 つずつ受け取ります。一致しないときは、`currentPosition` を `jumpTable` の値に戻して、比べ直します。一致が続いて針の長さに達したら、見つかったことを示して、次の一致のために表の値へ位置を戻します。

## ここがすごい

- **入力の位置を戻さない**: 一致が外れても、読んだバイトを読み直すことはありません。入力は常に前へ進むだけです。
- **比べ直しの量が抑えられる**: 針の中で既に一致していた部分を、表が覚えています。同じ比較を繰り返さずに、続きの位置から比べられます。
- **表は針から 1 回だけ作る**: 失敗テーブルは `KmpSearchProcessorFactory` のコンストラクタで作られ、検索の度に作り直す必要がありません。
- **ストリームに向いている**: `process` は 1 バイトずつ処理するので、データが分割されて届く場合にも、途中の状態を `currentPosition` に保ったまま続けられます。

## まとめ

- KMP 法は、針の接頭辞と接尾辞の一致の長さを表にし、一致が外れたら、その表の値の位置から比べ直す。
- コンストラクタで、針の各位置の border の長さを `jumpTable` に作る。
- `process` は、1 バイトずつ読み、外れたら表の値へ戻る。入力を戻さずに、途中の一致を生かして探せる。

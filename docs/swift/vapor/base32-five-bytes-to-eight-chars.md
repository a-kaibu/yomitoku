---
title: "5 バイトの 40 ビットを、5 ビットずつ 8 文字に切る"
description: "Base32 の変換で、入力の 5 バイトを 8 文字の表記へ変える Vapor の処理。ビットシフトと AND で、5 ビットずつ取り出す。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/Base32.swift
lines: [25, 41]
function: "encode32(_:pad:using:)"
difficulty: 2
tags: [ビット演算, 文字列処理, 低レイヤ]
format: 2
---
## ひとことで

バイナリのデータを、英字と数字だけの文字列に変えるのが Base32 です。入力を 5 バイト（40 ビット）ずつ読み、それを 5 ビットずつ 8 つに切って、表の文字に置き換えます。

## コード

```swift:line-numbers=25
            while inp.count &- idx >= 5 {
                let b0 = get(0)
                let b1 = get(1)
                let b2 = get(2)
                let b3 = get(3)
                let b4 = get(4)

                span.append(tab[((b0 & 0xf8) &>> 3)])
                span.append(tab[((b0 & 0x07) &<< 2) | (b1 &>> 6)])
                span.append(tab[((b1 & 0x3e) &>> 1)])
                span.append(tab[((b1 & 0x01) &<< 4) | (b2 &>> 4)])
                span.append(tab[((b2 & 0x0f) &<< 1) | (b3 &>> 7)])
                span.append(tab[((b3 & 0x7c) &>> 2)])
                span.append(tab[((b3 & 0x03) &<< 3) | (b4 &>> 5)])
                span.append(tab[((b4 & 0x1f))])
                idx &+= 5
            }
```

## 前提知識

- **Base32**: 32 種類の文字（A〜Z と 2〜7）だけを使って、バイナリを表す方式です。1 文字は 5 ビットを表します。
- **ビットシフト**: `&>>` は右へ、`&<<` は左へずらします。`&` で始まる演算子は、はみ出しても止まらない版です。
- **マスク**: `0xf8` は `11111000`、`0x07` は `00000111` のように、ほしいビットだけを残す数値です。
- **表（tab）**: 0 から 31 までの値を、対応する文字へ変える配列です。

## 何をしているか

### 1. 5 バイトを読む

5 バイトは 40 ビットです。`b0` から `b4` の 5 つの値として読みます。

```swift:line-numbers=26
                let b0 = get(0)
                let b1 = get(1)
                let b2 = get(2)
                let b3 = get(3)
                let b4 = get(4)
```
### 2. 最初の 3 文字を作る

`b0` の上位 5 ビットは、そのまま 1 文字目になります。`b0` の下位 3 ビットと `b1` の上位 2 ビットを合わせると、2 文字目になります。`b1` の中の 5 ビットは、3 文字目になります。

```swift:line-numbers=32
                span.append(tab[((b0 & 0xf8) &>> 3)])
                span.append(tab[((b0 & 0x07) &<< 2) | (b1 &>> 6)])
                span.append(tab[((b1 & 0x3e) &>> 1)])
```
### 3. 残りの文字も、同じように切る

4 文字目から 8 文字目も、同じ考え方で 5 ビットずつ取り出します。最後の文字は、下位 5 ビットをマスクで取るだけです。

```swift:line-numbers=35
                span.append(tab[((b1 & 0x01) &<< 4) | (b2 &>> 4)])
                span.append(tab[((b2 & 0x0f) &<< 1) | (b3 &>> 7)])
                span.append(tab[((b3 & 0x7c) &>> 2)])
                span.append(tab[((b3 & 0x03) &<< 3) | (b4 &>> 5)])
                span.append(tab[((b4 & 0x1f))])
```
### 4. 次の 5 バイトへ進む

5 バイト分を処理したら、入力の位置を 5 つ進めて、残りがあれば続けます。

```swift:line-numbers=40
                idx &+= 5
            }
```
## ここがすごい

- **ビットを数えて切る**: 8 文字と 5 バイトの対応を、ビット数で決めています。規則を式にしているので、読めば仕組みがわかります。
- **表で文字を選ぶ**: 取り出した 5 ビットの値を、そのまま表の添字にします。文字の対応は、表を変えるだけで差し替えられます。
- **残りを別に扱う**: 5 バイトに満たない端数は、このループの後で別に処理しています。ループの中は、いつも 5 バイトそろった場合だけ書けます。

## まとめ

- 5 バイト（40 ビット）を、5 ビットずつ 8 つの値に切る。
- 切った値を表の添字として、文字に変える。
- 5 バイトずつ繰り返し、端数は別に処理する。

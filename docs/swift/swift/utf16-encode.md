---
title: "番号の大きな文字を UTF-16 のサロゲートペアに分ける"
description: "Unicode のコードポイントを UTF-16 に変換する関数。65536 未満ならそのまま、それ以上なら 0x10000 を引いた 20 ビットを上下 10 ビットに分けて 2 つの 16 ビットにする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF16.swift
lines: [314, 327]
function: "UTF16.encode(_:)"
difficulty: 2
tags: [Unicode, ビット演算, 文字列処理, 標準ライブラリ]
format: 2
---
## ひとことで

文字の番号（コードポイント）を UTF-16 に変換する関数です。番号が `0xFFFF` 以下なら 16 ビット 1 つで、それより大きければ **サロゲートペア**（16 ビット 2 つ）で表します。
たとえば「あ」（`U+3042`）は `0x3042` 1 つ、「😀」（`U+1F600`）は `0xD83D 0xDE00` の 2 つになります。結果は、32 ビットの入れ物（`_storage`）と、何ビット使っているか（`_bitCount`）の組で返します。

## コード

```swift:line-numbers=314
  @inlinable
  public static func encode(
    _ source: Unicode.Scalar
  ) -> EncodedScalar? {
    let x = source.value
    if _fastPath(x < ((1 as UInt32) << 16)) {
      return EncodedScalar(_storage: x, _bitCount: 16)
    }
    let x1 = x - ((1 as UInt32) << 16)
    var r = (0xdc00 + (x1 & 0x3ff))
    r &<<= 16
    r |= (0xd800 + (x1 &>> 10 & 0x3ff))
    return EncodedScalar(_storage: r, _bitCount: 32)
  }
```

## 前提知識

- **`Unicode.Scalar` と `.value`**: 1 つの文字の番号を表す型と、その番号（`UInt32`）です。
- **`EncodedScalar?`**: 戻り値がオプショナル（`nil` になりうる）なのは、他のエンコーディングと同じ形のプロトコルに合わせているためです。UTF-16 ではすべての文字を表せるので、実際には `nil` を返しません。
- **`(1 as UInt32) << 16`**: `UInt32` の 1 を 16 ビット左へずらした値、つまり 65536（`0x10000`）です。
- **`_fastPath(条件)`**: 「たいてい真」というヒントです。ほとんどの文字は 16 ビットに収まるので付いています。
- **`&<<=` / `|=`**: チェックなしの左シフトで代入、OR で代入。
- **`&>>`**: チェックなしの右シフト。

## 何をしているか

### 16 ビットに収まる場合

```swift:line-numbers=319
    if _fastPath(x < ((1 as UInt32) << 16)) {
      return EncodedScalar(_storage: x, _bitCount: 16)
    }
```
「あ」は `0x3042 < 0x10000` なので、そのまま `_bitCount: 16` で返します。

### サロゲートペアにする場合

```swift:line-numbers=322
    let x1 = x - ((1 as UInt32) << 16)
    var r = (0xdc00 + (x1 & 0x3ff))
    r &<<= 16
    r |= (0xd800 + (x1 &>> 10 & 0x3ff))
    return EncodedScalar(_storage: r, _bitCount: 32)
```
「😀」（`x = 0x1F600`）で追います。

1. `x1 = 0x1F600 - 0x10000 = 0xF600`。これは 20 ビットに収まります（最大 `0xFFFFF`）。
2. 下位 10 ビット `0xF600 & 0x3FF = 0x200` に `0xDC00` を足して、後半サロゲート `0xDE00` を作ります。
3. それを 16 ビット左へずらします。`r = 0xDE00_0000`。
4. 上位 10 ビット `(0xF600 >> 10) & 0x3FF = 0x3D` に `0xD800` を足して前半サロゲート `0xD83D` を作り、下位に OR します。`r = 0xDE00_D83D`。
5. `_bitCount: 32` で返します。

前半サロゲートが下位 16 ビット、後半が上位 16 ビットに入っています。読み出すときは下位から順に取り出すので、`0xD83D, 0xDE00` の順番になります。

## ここがすごい

- **`0x10000` を引くことの意味**: サロゲートペアで表すのは `0x10000` 以上の文字だけです。先に `0x10000` を引くことで、使える 20 ビット（約 100 万通り）を無駄なく使えます。もし引かなければ、`0x0000`〜`0xFFFF` に当たるペアは使われない無駄な組み合わせになります。
- **割り算ではなくシフトとマスク**: 20 ビットを上下 10 ビットに分けるのは、`x1 / 1024` と `x1 % 1024` でもできます。1024 は 2 の 10 乗なので、シフトとマスクで計算しています。
- **整数 1 つで結果を返す**: 配列を作らず、32 ビットの整数 1 つに 2 つの 16 ビットを詰めて返します。メモリの確保がなく、呼び出し側でもすぐに取り出せます。
- **よく通る道を最初に**: 日本語も英語も、ほぼすべての文字は 16 ビットに収まります。`_fastPath` で最初の判定を速くしているのは、実際の文字の分布をふまえた最適化です。

## まとめ

- UTF-16 は、`0xFFFF` 以下の文字は 16 ビット 1 つ、それより上は 2 つ（サロゲートペア）で表す。
- サロゲートペアは「`0x10000` を引いた 20 ビットを、上下 10 ビットずつ `0xD800` と `0xDC00` に足したもの」。
- 2 のべき乗での割り算と余りは、シフトとマスクで計算できる。

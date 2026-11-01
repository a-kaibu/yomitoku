---
title: "SipHash の仕上げ：長さを混ぜて 3 回まわす"
description: "ハッシュ計算の最後の一押し。データの長さと端数バイトを 1 つにまとめて混ぜ、定数 0xff を XOR してから 3 ラウンド回して値を確定させる。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/SipHash.swift
lines: [78, 95]
function: "Hasher._State.finalize(tailAndByteCount:)"
difficulty: 2
tags: [ハッシュ, ビット演算, 標準ライブラリ]
---
## ひとことで

SipHash は、8 バイトずつ入力を混ぜ込む「圧縮」と、最後に値を確定させる「仕上げ（finalize）」の 2 段階でハッシュ値を作ります。
このコードには両方が入っています。`compress` は 8 バイトを状態に混ぜる関数、`finalize` は「余りのバイトと全体の長さ」を 1 つにまとめた値を混ぜてから、さらに 3 回かき混ぜて結果を返す関数です。

## コード

```swift:line-numbers=78
extension Hasher._State {
  @inline(__always)
  internal mutating func compress(_ m: UInt64) {
    v3 ^= m
    _round()
    v0 ^= m
  }

  @inline(__always)
  internal mutating func finalize(tailAndByteCount: UInt64) -> UInt64 {
    compress(tailAndByteCount)
    v2 ^= 0xff
    for _ in 0..<3 {
      _round()
    }
    return _extract()
  }
}
```

## 前提知識

- **`mutating func`**: 構造体の中身（ここでは `v0`〜`v3`）を書き換えるメソッドには `mutating` が必要です。
- **`^=`**: XOR して代入します。
- **`for _ in 0..<3`**: 3 回繰り返すループです。`_` は「ループ変数は使わない」という意味です。`0..<3` は 0, 1, 2 の範囲（3 を含まない）。
- **`_round()`**: 状態をかき混ぜる 1 ラウンドの処理です（同じファイルで定義）。
- **`_extract()`**: 4 つの状態を XOR して 1 つの値にまとめる関数です。
- **SipHash-1-3**: SipHash には「圧縮で何ラウンド、仕上げで何ラウンド」という変種があります。Swift は圧縮 1 回・仕上げ 3 回の SipHash-1-3 を使っています（`compress` の `_round()` が 1 回、`finalize` のループが 3 回）。

## 何をしているか

### compress（80〜84 行目）

8 バイトの入力 `m` を、まず `v3` に XOR で混ぜます。1 ラウンド回したあと、同じ `m` を今度は `v0` に XOR します。入力を「前」と「後」の 2 か所で混ぜることで、ラウンドの前後で入力の影響が打ち消されるのを防ぎます。

### finalize（87〜94 行目）

引数 `tailAndByteCount` は、呼び出し側で「端数の 0〜7 バイト」と「入力全体の長さ」を 1 つの 64 ビット値に詰めたものです。上位 8 ビットに長さ、下位に端数バイトが入っています。

1. 88 行目: その値を `compress` で混ぜます。
2. 89 行目: `v2` に `0xff` を XOR します。
3. 90〜92 行目: 3 ラウンド回します。
4. 93 行目: 4 つの状態をまとめて返します。

## ここがすごい

- **長さを必ず混ぜる**: 長さを混ぜないと、`"a"` と `"a\0"` のように、末尾に 0 のバイトが付いただけの入力が同じハッシュになりかねません。端数を 0 で埋めて読むので、区別がつかなくなるのです。長さを一緒に詰めることで、どんな長さの違いも結果に反映されます。しかも端数と長さを 1 回の `compress` で済ませているので無駄がありません。
- **`0xff` で「ここで終わり」と印を付ける**: 仕上げの前に定数を XOR することで、圧縮のラウンドと仕上げのラウンドが同じ形にならないようにしています。もし区別がないと、「途中までの状態」と「完成した状態」の関係を攻撃者が利用できてしまいます。
- **速度と安全のバランス**: 元の SipHash 論文の推奨は SipHash-2-4（圧縮 2 回・仕上げ 4 回）です。Swift はハッシュテーブル用途ならこれで十分という判断で、より軽い 1-3 を採用しています。Rust など他の言語の標準ライブラリにも同じ選択をしているものがあります。

## まとめ

- ハッシュ関数は「入力を少しずつ混ぜる段階」と「最後に固める段階」に分かれることが多い。
- 入力の長さを混ぜないと、末尾が 0 の入力どうしが衝突する。
- 仕上げの前に定数を混ぜて、途中の状態と最終結果を区別する。

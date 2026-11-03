---
title: "ハッシュ値を 5 ビットずつ切り分け、木の段を決める"
description: "unordered-containers の HAMT（ハッシュ配列マップトライ）で、木の何段目の枝を選ぶかを、ハッシュ値の 5 ビットから取り出す index。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [2927, 2928]
function: "index"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, ビット演算]
---

## ひとことで

`index` は、ハッシュ値（`Hash`）と段の深さ（`Shift`）を受け取り、その段で使う枝の番号（0 から 31 のどれか）を返す関数です。`HashMap` は、キーのハッシュ値を使って木をたどるので、この番号が次に進む方向を決めます。

ハッシュ値は 64 ビットの数です。その中の、段の深さに応じた 5 ビットを取り出すことで、1 段ごとに 32 通りの枝へ分かれます。

## コード

```haskell:line-numbers=2927
index :: Hash -> Shift -> Int
index w s = fromIntegral $ unsafeShiftR w s .&. subkeyMask
```

## 前提知識

- **HAMT（Hash Array Mapped Trie）**: ハッシュ値を桁のように使って、木を分けていくデータ構造です。ハッシュ値の一部ずつで枝を選びます。
- **ハッシュ値**: キーから作った、固定長の整数です。同じキーには必ず同じ値が出ます。
- **`Shift`**: 段の深さを表す整数です。段が 1 つ深くなるごとに、5 ビットずつずらします。
- **`unsafeShiftR`**: 右へビットをずらす演算です。`unsafe` は、ずらす量の範囲を確かめないという意味です。
- **`.&.`**: 2 つの値のビットの「かつ」を取る演算です。

## 何をしているか

### 1. 必要なビットを右へ寄せる

```haskell:line-numbers=2927
index :: Hash -> Shift -> Int
```

`unsafeShiftR w s` は、ハッシュ値 `w` を右へ `s` ビットずらします。段が深いほど `s` は大きいので、取り出したいビットが下のほうに寄ります。

### 2. 下位 5 ビットだけを残す

```haskell:line-numbers=2919
subkeyMask :: Word
subkeyMask = 1 `unsafeShiftL` bitsPerSubkey - 1
```

`subkeyMask` は、下位 5 ビットがすべて 1 の値（`0b11111`、つまり 31）です。`bitsPerSubkey` は、64 ビット環境では 5、32 ビット環境では 4 です。

ずらした値と `subkeyMask` の「かつ」を取ると、下位 5 ビットだけが残り、結果は 0 から 31 の数になります。これが、その段で選ぶ枝の番号です。

具体的に見てみます。ドキュメントの例では、`index 0b0010_0010 0` は `0b0000_0010` になります。段が 0 のときは、下位 5 ビットの `00010` を取り出し、その数は 2 です。

## ここがすごい

1 つのハッシュ値を、段ごとに 5 ビットずつ使い回すことで、木の深さは最大でも約 13 段（64 ビット ÷ 5）に抑えられます。そして、どの段も同じ計算で番号が出るので、コードがとても単純です。

また、この関数は `INLINE` の指定を受けていて、呼び出し先に直接展開されます。木をたどるたびに何度も呼ばれるので、小さく速い関数にしておくことが大事です。

コメントの `>>>` の例は、ドキュメントを読んだ人がそのまま試せるように書かれています。仕様を、例で示す書き方の良い見本です。

## まとめ

- ハッシュ値の一部を段ごとに使うと、木の枝を素早く決められる。
- ビットずらしと「かつ」を組み合わせると、一定の幅の番号を取り出せる。
- 環境によって幅を変えるときは、その理由をコメントに残すと親切。

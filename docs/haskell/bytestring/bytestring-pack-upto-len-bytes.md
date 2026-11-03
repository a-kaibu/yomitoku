---
title: "上限つきで、リストからバイト列を作る"
description: "リストのバイトを、指定した長さまで詰めてバイト列を作る packUptoLenBytes。詰めきれなかった残りのリストも一緒に返す。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [550, 557]
function: "packUptoLenBytes"
difficulty: 3
format: 2
tags: [文字列処理, 入出力, 最適化]
---

## ひとことで

`packUptoLenBytes` は、バイトのリストを受け取り、**最大で指定した長さまで** バイト列にまとめる関数です。バイト列にできなかった残りのリストも、一緒に返します。

リストは遅延して作られることが多く、全部を先に読むと無駄です。この関数は、必要な長さの分だけリストを読み、その先は触らずに残します。

## コード

```haskell:line-numbers=550
packUptoLenBytes :: Int -> [Word8] -> (ByteString, [Word8])
packUptoLenBytes len xs0 =
    unsafeCreateFpUptoN' len $ \p0 ->
      let p_end = plusForeignPtr p0 len
          go !p []              = return (p `minusForeignPtr` p0, [])
          go !p xs | p == p_end = return (len, xs)
          go !p (x:xs)          = pokeFp p x >> go (p `plusForeignPtr` 1) xs
      in go p0 xs0
```

## 前提知識

- **リストの組 `(バイト列, 残り)`**: 結果は 2 つの値の組です。1 つ目が作ったバイト列、2 つ目が使わなかったリストです。
- **`unsafeCreateFpUptoN'`**: 作るバイト列の上限を決めて、書き込んだ分だけの長さで確定させる内部の関数です。
- **`plusForeignPtr`**: メモリの位置を先へずらす関数です。
- **`pokeFp`**: メモリの位置に値を書き込む関数です。
- **ローカルの `go`**: 位置 `p` とリストを受け取る再帰の関数です。

## 何をしているか

### 1. 終端の位置を決める

```haskell:line-numbers=551
packUptoLenBytes len xs0 =
    unsafeCreateFpUptoN' len $ \p0 ->
      let p_end = plusForeignPtr p0 len
```

`p_end` は、上限の長さに対応するメモリの位置です。ここまで書いたら、もうそれ以上は詰めません。

### 2. リストが空なら終わり

```haskell:line-numbers=554
          go !p []              = return (p `minusForeignPtr` p0, [])
```

リストを使い切ったら、そこまでに書いた長さと、残りの空リストを返します。

### 3. 上限に達したら、残りを返す

```haskell:line-numbers=555
          go !p xs | p == p_end = return (len, xs)
```

書き込み位置が上限に達したら、残りのリスト `xs` を手つかずで返します。読んだ分だけで、バイト列が完成します。

### 4. 1 バイトずつ書く

```haskell:line-numbers=556
          go !p (x:xs)          = pokeFp p x >> go (p `plusForeignPtr` 1) xs
      in go p0 xs0
```

先頭の値 `x` をメモリに書き込み、位置を 1 つ進めて続けます。

## ここがすごい

この関数は、リストの「どこまで読んだか」を、結果の 2 つ目の値として正直に返します。読まなかった部分を捨てずに渡せるので、呼ぶ側は続きから処理を再開できます。

また、3 つの条件（空、上限、書き込み）の順番を工夫して、上限に達したときに余計な要素を読まないようにしています。遅延するリストを扱う、ライブラリらしい慎重さです。

## まとめ

- 上限つきの変換は、読んだ分と残りを分けて返すと使いやすい。
- 遅延するリストは、必要な分だけ読むと無駄が減る。
- 条件の順番は、どちらを先に確かめるかで動きが変わる。

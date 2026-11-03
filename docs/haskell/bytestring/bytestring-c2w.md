---
title: "Char を 1 バイトに切り詰める、速い変換"
description: "Char を Word8 に変える c2w。Latin-1 より大きい文字は、黙って下位 8 ビットだけに切り詰められる。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [1089, 1090]
function: "c2w"
difficulty: 2
format: 2
tags: [文字列処理, 型システム, 防御的プログラミング]
---

## ひとことで

`c2w` は、`Char` を `Word8` に変換する関数です。`c2w` の `c` は Char、`w` は Word8 です。

文字の番号が 255 以下なら、そのまま 1 バイトになります。255 より大きい文字は、下位の 8 ビットだけが残り、上位は捨てられます。ドキュメントにもそう明記されています。

## コード

```haskell:line-numbers=1089
c2w :: Char -> Word8
c2w = fromIntegral . ord
```

## 前提知識

- **`ord`**: 文字の番号（コードポイント）を整数として返す関数です。
- **`fromIntegral`**: 整数の型を変換する関数です。`Word8` の範囲に収まらない値は、上位ビットが捨てられます。
- **Haddock のコメント `-- |`**: 関数の説明を書くための書き方です。
- **`INLINE`**: 呼び出し先に直接展開してよいと伝える指示です。

## 何をしているか

### 1. 文字を整数にする

```haskell:line-numbers=1090
c2w = fromIntegral . ord
```

`ord` で文字の番号を取り出し、`fromIntegral` で `Word8` に変えます。ここで、256 以上の値の上位ビットは捨てられます。

具体例で見ます。`'A'`（番号 65）は、そのまま `65` になります。一方、`'\256'`（番号 256、二進数で 1 ビット目が立つ）は、下位 8 ビットの `0` になります。`'Ā'` は `'\0'` に化けます。

## ここがすごい

この関数は、切り詰めを「黙って行う」ことを、名前と説明で正直に伝えています。エラーを投げないのは、速さを優先するからです。ByteString を組み立てるときは、利用者が Latin-1 の文字だけを渡す前提です。

また、関数名が 2 文字（`c2w`）なので、コードの中でとても短く書けます。よく使う変換を短い名前にするのは、ライブラリの読みやすさに効きます。

## まとめ

- 変換で範囲を超える値は、どう扱うかを仕様で決めて、説明に書いておく。
- 速さのためにエラーを省くなら、その前提を利用者に伝える。
- よく使う変換は、短い名前にすると書きやすい。

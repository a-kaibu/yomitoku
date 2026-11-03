---
title: "1 バイトの「ふるい」で、文字列の一致候補を先に絞る"
description: "Data.Text の部分文字列検索 indices'。Boyer-Moore-Horspool 系の飛ばし幅と、64 ビットのビットマスクを組み合わせて、一致しそうにない位置を素早く読み飛ばす。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Search.hs
lines: [59, 90]
function: "indices'"
difficulty: 3
format: 2
tags: [文字列処理, アルゴリズム, 最適化]
---

## ひとことで

`indices'` は、ある文字列（針, needle）が、別の文字列（干し草, haystack）の中のどこに現れるかを、すべて位置の一覧で返す関数です。たとえば `"ab"` が `"abcab"` の中で 0 と 3 にあれば、`[0,3]` を返します。

素直に 1 文字ずつ比べると遅くなります。この関数は、「針の中にない文字が来たら、その分だけ先へ飛ぶ」という考えで、比べる回数を減らしています。

## コード

```haskell:line-numbers=59
indices' :: Text -> Text -> [Int]
indices' (Text narr noff nlen) (Text harr@(A.ByteArray harr#) hoff hlen) = loop (hoff + nlen)
  where
    nlast    = nlen - 1
    !z       = nindex nlast
    nindex k = A.unsafeIndex narr (noff+k)
    buildTable !i !msk !skp
        | i >= nlast           = (msk .|. swizzle z) :* skp
        | otherwise            = buildTable (i+1) (msk .|. swizzle c) skp'
        where !c               = nindex i
              skp' | c == z    = nlen - i - 2
                   | otherwise = skp
    !(mask :* skip) = buildTable 0 0 (nlen-2)

    swizzle :: Word8 -> Word64
    swizzle !k = 1 `unsafeShiftL` (word8ToInt k .&. 0x3f)

    loop !i
      | i > hlen + hoff
      = []
      | A.unsafeIndex harr (i - 1) == z
      = if A.equal narr noff harr (i - nlen) nlen
        then i - nlen - hoff : loop (i + nlen)
        else                   loop (i + skip + 1)
      | i == hlen + hoff
      = []
      | mask .&. swizzle (A.unsafeIndex harr i) == 0
      = loop (i + nlen + 1)
      | otherwise
      = case memchr harr# i (hlen + hoff - i) z of
        -1 -> []
        x  -> loop (i + x + 1)
```

## 前提知識

- **`Text` と `Word8`**: `Text` は UTF-8 のバイト列を持つ文字列型です。`Word8` は 1 バイトの符号なし整数です。ここでは、文字列の中身をバイトとして比べています。
- **`where` と局所の定義**: `where` の中で、補助の値や関数を定義できます。この関数の中の `nindex` や `loop` は、その例です。
- **`!`（厳密評価）**: `!z` のように書くと、その値をすぐに計算します。
- **ビット演算**: `.|.`（または）、`.&.`（かつ）、`unsafeShiftL`（左シフト）を使っています。1 つのバイトを、64 ビットの中の 1 ビットに対応させるのに使います。
- **`memchr`**: 特定のバイトを高速に探す、C 言語の関数です。ここでは、最後の文字を探すために使われています。

## 何をしているか

### 1. 針の最後の文字と、飛ばし幅を準備する

```haskell:line-numbers=62
    nlast    = nlen - 1
    !z       = nindex nlast
    nindex k = A.unsafeIndex narr (noff+k)
```

針の最後の文字 `z` を基準にします。`nindex k` は、針の `k` 番目のバイトを取り出す関数です。

### 2. ビットマスクを作る

```haskell:line-numbers=73
    swizzle :: Word8 -> Word64
    swizzle !k = 1 `unsafeShiftL` (word8ToInt k .&. 0x3f)
```

`swizzle` は、1 バイトを 0 から 63 のどれかのビットに対応させます。`0x3f` との論理積は、下位 6 ビットだけを残す操作です。こうして、どの文字が針に含まれるかを、1 つの 64 ビット整数に記録します。

`buildTable` は、針の各文字をこのマスクに足していきます。同時に、最後の文字と同じ文字が途中にあれば、その位置から飛ばし幅 `skp` を決めます。

### 3. 干し草を読み進める

```haskell:line-numbers=85
      | mask .&. swizzle (A.unsafeIndex harr i) == 0
      = loop (i + nlen + 1)
```

現在の位置の文字が、マスクに入っていなければ、針の長さ分まとめて先へ進みます。針に含まれない文字は、一致の候補になり得ないからです。

```haskell:line-numbers=88
      = case memchr harr# i (hlen + hoff - i) z of
        -1 -> []
        x  -> loop (i + x + 1)
```

マスクに入っている場合は、`memchr` で最後の文字を探します。見つかったら、その位置から針を実際に比べます。一致していれば、位置を結果に入れて、針の長さだけ先へ進みます。

## ここがすごい

このアルゴリズムの中心は、「針に存在しない文字は、まとめて飛ばせる」ことです。干し草の文字が 1 つでもマスクになければ、そこを起点とする一致はあり得ないので、比較を一切しません。

マスクは 64 ビットの整数 1 つで済むので、メモリも時間もほとんどかかりません。文字の種類を 64 個に畳み込んでいるので、完全な一致の判定ではなく「候補かどうか」の粗い判定ですが、それで十分速く動きます。

コメントには書かれていませんが、最悪の場合は `O(n*m)` に近づくと、関数の説明にあります。その代わり、ふつうの文章では非常に速く動きます。

## まとめ

- 部分文字列検索は、「候補にならない位置」を素早く飛ばすと速くなる。
- 文字の集合を 64 ビットのマスクに畳み込むと、判定を安く済ませられる。
- 速さと最悪ケースの性能のトレードオフは、ドキュメントに明記しておくと親切。

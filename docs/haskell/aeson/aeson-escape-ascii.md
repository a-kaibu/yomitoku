---
title: "JSON の文字列を、1 文字ずつ正しくエスケープする"
description: "aeson の escapeAscii。引用符・バックスラッシュ・制御文字を JSON の規則どおりに書き換える。BoundedPrim で、出力先へ直接書き込む。"
language: haskell
project: "aeson"
repo: https://github.com/haskell/aeson
license: "BSD-3-Clause"
copyright: "Copyright (c) 2011, MailRank, Inc. 2014-2026 Aeson project contributors"
commit: "1dd465c115ccface4cbb5f17f038c5843d4d4ed9"
file: src/Data/Aeson/Encoding/Builder.hs
lines: [124, 136]
function: "escapeAscii"
difficulty: 3
format: 2
tags: [文字列処理, 入出力, 最適化]
---

## ひとことで

`escapeAscii` は、1 バイトの値を受け取り、JSON の文字列の中で正しく書ける形に変換する関数です。引用符 `"` は `\"` に、改行は `\n` に、といった置き換えを行います。

JSON では、文字列の中に生の引用符や制御文字を書けません。この関数は、その規則を 1 文字ずつ当てはめるための部品です。

## コード

::: code-group

```haskell:line-numbers=124 [日本語訳]
escapeAscii :: BP.BoundedPrim Word8
escapeAscii =
    BP.condB (== c2w '\\'  ) (ascii2 ('\\','\\')) $
    BP.condB (== c2w '\"'  ) (ascii2 ('\\','"' )) $
    BP.condB (>= c2w '\x20') (BP.liftFixedToBounded BP.word8) $
    BP.condB (== c2w '\n'  ) (ascii2 ('\\','n' )) $
    BP.condB (== c2w '\r'  ) (ascii2 ('\\','r' )) $
    BP.condB (== c2w '\t'  ) (ascii2 ('\\','t' )) $
    BP.liftFixedToBounded hexEscape -- 0x20 未満の制御文字は、後ろの処理で \uXXXX の形にする
  where
    hexEscape :: BP.FixedPrim Word8
    hexEscape = (\c -> ('\\', ('u', fromIntegral c))) BP.>$<
        BP.char8 >*< BP.char8 >*< BP.word16HexFixed
```

```haskell:line-numbers=124 [原文]
escapeAscii :: BP.BoundedPrim Word8
escapeAscii =
    BP.condB (== c2w '\\'  ) (ascii2 ('\\','\\')) $
    BP.condB (== c2w '\"'  ) (ascii2 ('\\','"' )) $
    BP.condB (>= c2w '\x20') (BP.liftFixedToBounded BP.word8) $
    BP.condB (== c2w '\n'  ) (ascii2 ('\\','n' )) $
    BP.condB (== c2w '\r'  ) (ascii2 ('\\','r' )) $
    BP.condB (== c2w '\t'  ) (ascii2 ('\\','t' )) $
    BP.liftFixedToBounded hexEscape -- fallback for chars < 0x20
  where
    hexEscape :: BP.FixedPrim Word8
    hexEscape = (\c -> ('\\', ('u', fromIntegral c))) BP.>$<
        BP.char8 >*< BP.char8 >*< BP.word16HexFixed
```

:::

## 前提知識

- **JSON の文字列**: `"` で囲み、中の `"` と `\` と制御文字は、必ずエスケープ（`\` で始まる書き方）します。
- **`BoundedPrim`**: 出力先のバッファへ、上限つきで値を直接書き込む仕組みです。途中の文字列を作らずに済みます。
- **`condB`**: 条件を満たすかで、書き込み方を切り替える部品です。
- **`c2w`**: 文字を 1 バイトの値に変換する関数です。
- **`where`**: `hexEscape` という補助の定義を置いています。

## 何をしているか

### 1. 条件を順に当てはめる

```haskell:line-numbers=126
    BP.condB (== c2w '\\'  ) (ascii2 ('\\','\\')) $
    BP.condB (== c2w '\"'  ) (ascii2 ('\\','"' )) $
```

先頭から、バックスラッシュと引用符を確かめます。一致すれば、`\\` や `\"` の 2 文字を書き込みます。

### 2. 普通の文字と、改行などの置き換え

```haskell:line-numbers=128
    BP.condB (>= c2w '\x20') (BP.liftFixedToBounded BP.word8) $
    BP.condB (== c2w '\n'  ) (ascii2 ('\\','n' )) $
    BP.condB (== c2w '\r'  ) (ascii2 ('\\','r' )) $
    BP.condB (== c2w '\t'  ) (ascii2 ('\\','t' )) $
```

0x20 以上の文字は、そのまま 1 バイト書きます。改行とキャリッジリターン、タブは、`\n`、`\r`、`\t` の 2 文字に置き換えます。

### 3. 残りの制御文字は \u で書く

::: code-group

```haskell:line-numbers=132 [日本語訳]
    BP.liftFixedToBounded hexEscape -- 0x20 未満の制御文字は、後ろの処理で \uXXXX の形にする
```

```haskell:line-numbers=132 [原文]
    BP.liftFixedToBounded hexEscape -- fallback for chars < 0x20
```

:::

上の条件に当てはまらない、0x20 未満の文字は、`\u00XX` の形の 6 文字で書きます。`hexEscape` が、その形を組み立てます。

## ここがすごい

条件を `condB` で鎖のようにつなぐと、「どの規則に当てはまるか」を上から順に判定できます。判定の順番がそのまま、規則の優先順位になっています。

また、結果を文字列として作らず、`BoundedPrim` で出力先へ直接書き込みます。エスケープが必要ない文字は、1 バイトの書き込みで済み、途中の一時的な文字列を作りません。JSON を大量に出力するサーバーでは、この差が効きます。

## まとめ

- 規則が複数あるときは、判定の順番を決めて上から書くと読みやすい。
- 出力を直接書き込むと、一時的な文字列を作らずに済む。
- 特殊な文字の扱いは、1 つずつ条件を分けて書くと確かめやすい。

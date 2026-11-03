---
title: "文字列を JSON の文字列リテラルに変える"
description: "aeson の string。両端の引用符で囲み、ASCII の範囲はエスケープし、それ以外の文字は UTF-8 のまま書き出す。"
language: haskell
project: "aeson"
repo: https://github.com/haskell/aeson
license: "BSD-3-Clause"
copyright: "Copyright (c) 2011, MailRank, Inc. 2014-2026 Aeson project contributors"
commit: "1dd465c115ccface4cbb5f17f038c5843d4d4ed9"
file: src/Data/Aeson/Encoding/Builder.hs
lines: [120, 122]
function: "string"
difficulty: 2
format: 2
tags: [文字列処理, 入出力, Unicode]
---

## ひとことで

`string` は、Haskell の `String` を、JSON の文字列として出力する `Builder` を作る関数です。前後に `"` を付け、中身は 1 文字ずつ変換します。

ASCII の範囲は、前の記事の `escapeAscii` でエスケープします。それより大きい文字は、UTF-8 として書き出します。

## コード

```haskell:line-numbers=120
string :: String -> Builder
string t = B.char8 '"' <> BP.primMapListBounded go t <> B.char8 '"'
  where go = BP.condB (> '\x7f') BP.charUtf8 (c2w >$< escapeAscii)
```

## 前提知識

- **`Builder`**: バイト列を効率よく連結するための型です。文字列を一度に作らず、必要なものを後ろへ足していきます。
- **`<>`**: 2 つの `Builder` をつなぐ演算子です。
- **`B.char8`**: 1 文字を 1 バイトとして書く `Builder` です。
- **`primMapListBounded`**: リストの各要素を、`BoundedPrim` の規則で書き出す関数です。
- **`\x7f`**: 16 進数の 7F、つまり ASCII の最後の文字です。

## 何をしているか

### 1. 両端の引用符

```haskell:line-numbers=121
string t = B.char8 '"' <> BP.primMapListBounded go t <> B.char8 '"'
```

`B.char8 '"'` で、前後に引用符を書きます。中身は、その間に並べます。

### 2. 文字ごとの書き方を決める

```haskell:line-numbers=122
  where go = BP.condB (> '\x7f') BP.charUtf8 (c2w >$< escapeAscii)
```

`condB (> '\x7f')` で、0x7F より大きい文字なら `charUtf8`、つまり UTF-8 で書きます。それ以外は、`c2w` で 1 バイトにしてから `escapeAscii` を通します。

具体例で見ます。`"a\"b"` という文字列は、`"a\"b"` と書き出されます。日本語の「あ」は、そのまま UTF-8 として書かれます。

## ここがすごい

ASCII と、それより大きい文字で、書き方を条件で分けています。ASCII の範囲だけをエスケープすれば、JSON として正しいまま、日本語などを短い形で出力できます。

また、2 つの書き方を、`condB` という 1 つの部品で切り替えています。同じ仕組みで、文字ごとに最適な書き方を選べるので、読みやすくも速くもなります。

## まとめ

- 文字の種類ごとに書き方を変えるとき、条件付きの部品を使うと分かりやすい。
- JSON では、ASCII の範囲だけをエスケープすれば足りる。
- 文字列の連結は、`Builder` を使うと途中の割り当てを減らせる。

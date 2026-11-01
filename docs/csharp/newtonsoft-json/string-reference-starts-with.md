---
title: "文字の配列の一部を、コピーせずに先頭から比べる"
description: "Newtonsoft.Json の StringReference.StartsWith。文字の配列の中の一部分（開始位置と長さで指定）を、文字列を作らずに、先頭から順に比べる。JSON の解析で、文字列を何度も作らないための仕組み。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringReference.cs
lines: [70, 88]
function: "StringReferenceExtensions.StartsWith(StringReference, string)"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 入出力]
---

## ひとことで

`StringReference` は、文字の配列の **一部分を指すだけの入れ物** です。
開始位置と長さを持つので、大きな配列の中の、ある範囲を「文字列のように」扱えます。

`StartsWith(text)` は、その範囲が `text` で始まるかを調べます。たとえば `{ } ,` の中の範囲が `"abc"` で始まるかを、新しい文字列を作らずに確かめられます。

## コード

```csharp:line-numbers=70
        public static bool StartsWith(this StringReference s, string text)
        {
            if (text.Length > s.Length)
            {
                return false;
            }

            char[] chars = s.Chars;

            for (int i = 0; i < text.Length; i++)
            {
                if (text[i] != chars[i + s.StartIndex])
                {
                    return false;
                }
            }

            return true;
        }
```

## 前提知識

- **文字の配列の一部**: 大きな `char[]` の中の、開始位置から長さの分だけの範囲です。
- **前方一致（StartsWith）**: 文字列の先頭が、指定の文字列と同じかどうかを調べることです。
- **`StartIndex`**: 範囲の先頭の、配列の中での位置です。
- **構造体（struct）**: 値を入れて持ち運ぶ、軽い入れ物の型です。ここでは、配列への参照と位置、長さを持つだけです。
- **`readonly struct`**: 中身を変えられない構造体です。

## 何をしているか

### 1. 長さを確かめる

```csharp:line-numbers=72
            if (text.Length > s.Length)
            {
                return false;
            }
```

指定の文字列が、範囲の長さより長ければ、先頭が一致するはずがないので、`false` を返します。

### 2. 先頭から 1 文字ずつ比べる

```csharp:line-numbers=77
            char[] chars = s.Chars;

            for (int i = 0; i < text.Length; i++)
            {
                if (text[i] != chars[i + s.StartIndex])
                {
                    return false;
                }
            }
```

配列の `StartIndex` から、指定の文字列の文字と順に比べます。1 文字でも違えば、すぐに `false` を返します。

### 3. すべて一致したら true

```csharp:line-numbers=87
            return true;
```

指定の文字列の文字がすべて一致したら、`true` を返します。

### 具体例で確かめる

配列 `{ 'x', 'a', 'b', 'c', 'd' }`、開始位置 1、長さ 3 の範囲は `"abc"` です。

```
StartsWith("ab") → 長さ 2 ≤ 3。'a' = 'a', 'b' = 'b' → true
StartsWith("ax") → 'a' = 'a', 'x' ≠ 'b' → false
StartsWith("abcd") → 長さ 4 > 3 → false
```

## ここがすごい

- **文字列を作らない**: 範囲を取り出して新しい文字列にする必要がないので、メモリの確保が減ります。
- **早く打ち切る**: 違う文字が見つかった時点で終わるので、長い文字列でも速く判定できます。
- **長さの事前確認**: 範囲より長い文字列は、最初から除外するので、配列の外を読むことがありません。
- **`EndsWith` も同じ考え方**: 末尾の一致は、範囲の終わりの位置から比べることで、同じ仕組みで扱います。

## まとめ

- `StartsWith` は、文字の配列の一部分の先頭が、指定の文字列と一致するかを調べる。
- 文字列を新しく作らず、配列の中の位置を直接読んで比べる。
- 長さの確認を先に行い、配列の範囲を越えないようにしている。

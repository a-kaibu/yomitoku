---
title: "0 から 15 の数を、16 進数の 1 文字に直す"
description: "Newtonsoft.Json の MathUtils.IntToHex。0 から 9 は数字の文字、10 から 15 は a から f の文字になるように、文字コードの差を使って計算する。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MathUtils.cs
lines: [120, 128]
function: "MathUtils.IntToHex(int)"
difficulty: 1
format: 2
tags: [文字列処理, 数値計算, 低レイヤ]
---

## ひとことで

`IntToHex` は、`0` から `15` までの数を、16 進数の **1 文字** に直す関数です。
たとえば `7` は `'7'`、`11` は `'b'` になります。

数字の文字（`'0'` から `'9'`）と、英字（`'a'` から `'f'`）は、文字コードが連続しているので、足し算だけで求められます。

## コード

```csharp:line-numbers=120
        public static char IntToHex(int n)
        {
            if (n <= 9)
            {
                return (char)(n + 48);
            }

            return (char)((n - 10) + 97);
        }
```

## 前提知識

- **16 進数**: 0 から 15 までの 16 個の数字で数を表す書き方です。10 から 15 は `a` から `f` の文字で書きます。
- **文字コード**: 文字ごとに決められた番号です。`'0'` は 48、`'a'` は 97 です。
- **`char` へのキャスト（`(char)`）**: 整数を文字コードとみなして、文字に変える書き方です。
- **条件分岐（`if`）**: 条件によって、処理を分ける書き方です。

## 何をしているか

### 1. 0 から 9 は数字の文字にする

```csharp:line-numbers=122
            if (n <= 9)
            {
                return (char)(n + 48);
            }
```

`n` が 9 以下なら、`'0'` の文字コード（48）を足します。たとえば `7` は `7 + 48 = 55` で、文字 `'7'` になります。

### 2. 10 から 15 は英字にする

```csharp:line-numbers=127
            return (char)((n - 10) + 97);
```

10 以上の場合は、10 を引いて `0` から `5` に直し、`'a'` の文字コード（97）を足します。たとえば `11` は `(11 - 10) + 97 = 98` で、文字 `'b'` になります。

## ここがすごい

- **表を持たない**: 16 個の文字を並べた配列を使わず、文字コードの連続性だけで求めています。
- **計算が単純**: 足し算と 1 回の比較だけなので、速く動きます。
- **数の範囲が狭い前提**: 0 から 15 に限った関数なので、余計な検査がなく短く書けています。

## まとめ

- 9 以下は、`'0'` の文字コードを足して数字の文字にする。
- 10 以上は、10 を引いてから `'a'` の文字コードを足して英字にする。

---
title: "文字列に、JavaScript として書き出す前にエスケープが必要な文字があるかを調べる"
description: "Newtonsoft.Json の JavaScriptUtils.ShouldEscapeJavaScriptString。1 文字ずつ、エスケープ対象の表を引く。表の範囲外の文字（ASCII 以外）は、必ずエスケープ対象とみなす。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/JavaScriptUtils.cs
lines: [128, 145]
function: "JavaScriptUtils.ShouldEscapeJavaScriptString(string?, bool[])"
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, 最適化]
---

## ひとことで

`ShouldEscapeJavaScriptString` は、文字列の中に、**エスケープ（別の書き方への置き換え）が必要な文字があるか** を調べる関数です。
たとえば、引用符（`"`）や改行を含む文字列なら `true` を返します。普通の英数字だけなら `false` です。

エスケープが不要なら、文字列をそのまま出力できるので、処理を省けます。

## コード

```csharp:line-numbers=128
        public static bool ShouldEscapeJavaScriptString(string? s, bool[] charEscapeFlags)
        {
            if (s == null)
            {
                return false;
            }

            for (int i = 0; i < s.Length; i++)
            {
                char c = s[i];
                if (c >= charEscapeFlags.Length || charEscapeFlags[c])
                {
                    return true;
                }
            }

            return false;
        }
```

## 前提知識

- **エスケープ**: 特別な意味を持つ文字や、表せない文字を、別の書き方（`\"` や `\n` など）に置き換えることです。
- **`bool[]` の表（`charEscapeFlags`）**: 文字コードを添字にして、その文字をエスケープするかを `true` / `false` で引ける配列です。
- **文字コード**: 文字ごとに決められた番号です。ここでは、0 から 127 までの ASCII の範囲を表に入れています。
- **`null` の扱い**: 文字列が `null` なら、エスケープの必要はないので `false` を返します。

## 何をしているか

### 1. `null` なら不要とする

```csharp:line-numbers=130
            if (s == null)
            {
                return false;
            }
```

文字列が `null` なら、調べる文字がないので、`false` を返します。

### 2. 1 文字ずつ調べる

```csharp:line-numbers=135
            for (int i = 0; i < s.Length; i++)
            {
                char c = s[i];
```

文字列を先頭から 1 文字ずつ取り出します。

### 3. 表の範囲外か、表で対象なら必要とみなす

```csharp:line-numbers=138
                if (c >= charEscapeFlags.Length || charEscapeFlags[c])
                {
                    return true;
                }
```

文字コードが表の範囲（128 未満）を超えていれば、ASCII 以外の文字なので、エスケープが必要とみなして `true` を返します。範囲内でも、表でエスケープ対象になっていれば、同じく `true` を返します。

### 4. どれにも当てはまらなければ不要

```csharp:line-numbers=144
            return false;
```

すべての文字が表で対象外だったら、`false` を返します。

## ここがすごい

- **表を引くだけ**: 文字ごとの判定は、配列の添字で値を読むだけです。大きな文字列でも速く調べられます。
- **範囲外を安全側に倒す**: 表にない文字は、エスケープしておけば安全なので、必ず対象とみなします。
- **早く終わる**: 1 文字でも対象が見つかれば、残りを調べずに `true` を返します。

## まとめ

- `null` は、エスケープ不要として `false` を返す。
- 文字ごとに、表で対象かを調べる。
- 表の範囲外か、対象の文字が 1 つでもあれば `true` を返す。

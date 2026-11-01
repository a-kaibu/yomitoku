---
title: "文字が空白かどうかを、Latin-1 の表と Unicode の表で分けて調べる"
description: ".NET の Char.IsWhiteSpace(char)。よく使う Latin-1 の範囲は、あらかじめ作った表を 1 回引いて判定し、それ以外の文字だけを Unicode の情報から調べる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Char.cs
lines: [427, 435]
function: "Char.IsWhiteSpace(char)"
difficulty: 2
format: 2
tags: [文字列処理, Unicode, 最適化]
---

## ひとことで

`Char.IsWhiteSpace(c)` は、1 文字が **空白文字**（スペース、タブ、改行など）かどうかを `true` か `false` で返す関数です。
たとえば `' '` や `'\t'` は `true`、`'a'` は `false` です。全角スペースのような、Unicode の空白も `true` になります。

文字列の前後を取り除く処理や、単語の区切りを見つける処理で、よく呼ばれます。

## コード

```csharp:line-numbers=427
        public static bool IsWhiteSpace(char c)
        {
            if (IsLatin1(c))
            {
                return IsWhiteSpaceLatin1(c);
            }

            return CharUnicodeInfo.GetIsWhiteSpace(c);
        }
```

## 前提知識

- **空白文字**: 画面に文字として表示されない、区切りの役目をする文字です。スペース、タブ、改行などがあります。
- **Latin-1**: 0 から 255 までの文字の範囲です。英字、数字、記号、ASCII の制御文字などを含みます。
- **表（テーブル）**: 文字の番号を添字にして、あらかじめ決めた情報を読むための配列です。
- **Unicode**: 世界中の文字に番号を付けた規格です。空白として扱う文字の範囲も、この規格で決まっています。
- **`CharUnicodeInfo`**: Unicode の文字の性質（記号の種類や空白かどうかなど）を持つ、標準の表です。

## 何をしているか

### 1. Latin-1 の文字なら、表を引く

```csharp:line-numbers=416
        private static bool IsWhiteSpaceLatin1(char c)
        {
            Debug.Assert(IsLatin1(c));
            return (Latin1CharInfo[c] & IsWhiteSpaceFlag) != 0;
        }
```

Latin-1 の文字は、`Latin1CharInfo` という表の中の、空白を表すビットを確かめるだけで判定できます。ビットの論理積（`&`）で、その 1 ビットを取り出します。

### 2. Latin-1 以外は、Unicode の情報を調べる

```csharp:line-numbers=429
            if (IsLatin1(c))
            {
                return IsWhiteSpaceLatin1(c);
            }

            return CharUnicodeInfo.GetIsWhiteSpace(c);
```

まず `IsLatin1(c)` で、Latin-1 の範囲かどうかを調べます。範囲内なら上の表で判定し、そうでなければ `CharUnicodeInfo.GetIsWhiteSpace` に任せます。

## ここがすごい

- **よく使う文字は速い**: 英字や記号など、大半の文字は Latin-1 の範囲に入るので、表を 1 回読むだけで答えが出ます。
- **広い範囲は正しく扱う**: 全角スペースのような、表の外の空白も、Unicode の情報で正しく判定できます。
- **判定を 1 つにまとめる**: 利用する側は、Latin-1 かどうかを意識せずに `IsWhiteSpace` を呼ぶだけで済みます。
- **ビット演算で表を小さく**: 1 文字の情報を、ビットの組として 1 つの値にまとめているので、表が小さくなります。

## まとめ

- `IsWhiteSpace` は、Latin-1 の範囲では表を引き、それ以外は Unicode の情報で判定する。
- 大半の文字は表を 1 回読むだけで済むので、速く判定できる。
- 利用する側は、この 2 つの経路の違いを意識しなくてよい。

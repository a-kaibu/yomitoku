---
title: "「XMLHttpRequest」を「xmlHttpRequest」に変える、先頭の大文字の読み方"
description: "Newtonsoft.Json の ToCamelCase。連続する大文字の並びを、最後の大文字だけ小文字に戻さずに残すという規則で、頭字語を含む名前を正しくキャメルケースにする。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringUtils.cs
lines: [155, 194]
function: "StringUtils.ToCamelCase"
difficulty: 3
format: 2
tags: [文字列処理, 可読性, 正規表現]
---

## ひとことで

`ToCamelCase` は、文字列の先頭にある大文字を、JSON の名前の慣習である **キャメルケース**（先頭だけ小文字の書き方）に直す関数です。
たとえば `"Name"` は `"name"` に、`"XMLHttpRequest"` は `"xmlHttpRequest"` になります。

単純に先頭 1 文字を小文字にするだけでは、`"XML"` が `"xML"` になってしまいます。この関数は、頭字語（`XML` など）の大文字を正しく小文字にする読み方をしています。

## コード

::: code-group

```csharp:line-numbers=155 [日本語訳]
        public static string ToCamelCase(string s)
        {
            if (StringUtils.IsNullOrEmpty(s) || !char.IsUpper(s[0]))
            {
                return s;
            }

            char[] chars = s.ToCharArray();

            for (int i = 0; i < chars.Length; i++)
            {
                if (i == 1 && !char.IsUpper(chars[i]))
                {
                    break;
                }

                bool hasNext = (i + 1 < chars.Length);
                if (i > 0 && hasNext && !char.IsUpper(chars[i + 1]))
                {
                    // 次の文字が空白のときは、空白は大文字とみなされない。
                    // （そうでなければ、ここには来ないはず）
                    // 次のような変換を保証したい:
                    // 'FOO bar' は 'foo bar' になるべきで、'foO bar' にはならない
                    // 最初の単語の大文字は、大文字の後に小文字が続く場所で終わる。
                    // その場所は、大文字の後に小文字が来るところで見つかる。
                    // 空白（(char)32）は大文字ではない。
                    // その場合でも、今の文字は小文字にしたい。
                    if (char.IsSeparator(chars[i + 1]))
                    {
                        chars[i] = ToLower(chars[i]);
                    }

                    break;
                }

                chars[i] = ToLower(chars[i]);
            }

            return new string(chars);
        }
```

```csharp:line-numbers=155 [原文]
        public static string ToCamelCase(string s)
        {
            if (StringUtils.IsNullOrEmpty(s) || !char.IsUpper(s[0]))
            {
                return s;
            }

            char[] chars = s.ToCharArray();

            for (int i = 0; i < chars.Length; i++)
            {
                if (i == 1 && !char.IsUpper(chars[i]))
                {
                    break;
                }

                bool hasNext = (i + 1 < chars.Length);
                if (i > 0 && hasNext && !char.IsUpper(chars[i + 1]))
                {
                    // if the next character is a space, which is not considered uppercase 
                    // (otherwise we wouldn't be here...)
                    // we want to ensure that the following:
                    // 'FOO bar' is rewritten as 'foo bar', and not as 'foO bar'
                    // The code was written in such a way that the first word in uppercase
                    // ends when if finds an uppercase letter followed by a lowercase letter.
                    // now a ' ' (space, (char)32) is considered not upper
                    // but in that case we still want our current character to become lowercase
                    if (char.IsSeparator(chars[i + 1]))
                    {
                        chars[i] = ToLower(chars[i]);
                    }

                    break;
                }

                chars[i] = ToLower(chars[i]);
            }

            return new string(chars);
        }
```

:::

## 前提知識

- **`char.IsUpper(c)`**: 文字 `c` が大文字かどうかを判定します。
- **`char[]` と `ToCharArray()`**: 文字の配列です。`string` は変更できませんが、文字の配列は 1 文字ずつ書き換えられます。
- **`new string(chars)`**: 文字の配列から文字列を作ります。
- **`char.IsSeparator(c)`**: 空白などの区切り文字かどうかを判定します。
- **`break`**: ループを途中で抜けます。

## 何をしているか

### 1. 先頭が大文字でなければ何もしない

```csharp:line-numbers=157
            if (StringUtils.IsNullOrEmpty(s) || !char.IsUpper(s[0]))
            {
                return s;
            }
```

`null` や空の文字列、先頭が大文字でない文字列は、そのまま返します。

### 2. 先頭から 1 文字ずつ小文字にする

```csharp:line-numbers=162
            char[] chars = s.ToCharArray();

            for (int i = 0; i < chars.Length; i++)
            {
                if (i == 1 && !char.IsUpper(chars[i]))
                {
```

文字の配列を作り、先頭から見ていきます。2 文字目（`i == 1`）が大文字でなければ、先頭だけを小文字にするべきなので、ここで止めます。

`"Name"` では、`N` だけを `n` にして `"name"` になります。

### 3. 頭字語の終わりを見つける

```csharp:line-numbers=171
                bool hasNext = (i + 1 < chars.Length);
                if (i > 0 && hasNext && !char.IsUpper(chars[i + 1]))
```

次の文字が大文字でないところが、頭字語の終わりの目安です。

`"XMLHttp"` で追うと、`X` と `M` は次も大文字なので小文字にしません。`L` の次の `H` は大文字ですが、`H` の次の `t` は小文字です。ここで `H` を小文字にすれば、`"xmlHttp"` になります。

### 4. 区切りの扱い

```csharp:line-numbers=174
                    // 次の文字が空白のときは、空白は大文字とみなされない。
                    // （そうでなければ、ここには来ないはず）
                    // 次のような変換を保証したい:
                    // 'FOO bar' は 'foo bar' になるべきで、'foO bar' にはならない
                    // 最初の単語の大文字は、大文字の後に小文字が続く場所で終わる。
                    // その場所は、大文字の後に小文字が来るところで見つかる。
                    // 空白（(char)32）は大文字ではない。
                    // その場合でも、今の文字は小文字にしたい。
                    if (char.IsSeparator(chars[i + 1]))
                    {
                        chars[i] = ToLower(chars[i]);
                    }
```

`"FOO bar"` のように、大文字の後に空白が来る場合は、現在の文字も小文字にします。そうしないと `"foO bar"` になってしまうからです。

### 5. 残りはそのまま

```csharp:line-numbers=187
                    break;
                }

                chars[i] = ToLower(chars[i]);
            }

            return new string(chars);
```

ループを抜けたあとの文字は元のまま使います。最後に文字の配列を文字列に戻して返します。

## ここがすごい

- **頭字語を崩さない**: `"XMLHttpRequest"` を `"xmlHttpRequest"` にするには、「大文字が続く部分の最後の 1 文字だけは大文字のまま残す」という判断が必要です。この関数は、次の文字が小文字かどうかを見て、その境目を見つけています。
- **空白の扱いを考えている**: 大文字が続いた後に空白が来るところには、`"FOO bar"` を `"foo bar"` にするための特例があります。空白は大文字ではないので、普通に書くと規則が崩れます。その理由をコメントで説明しています。
- **元の文字列を変えない**: 文字列はそのままでは書き換えられないので、配列にコピーしてから直します。元の値を壊さない書き方です。
- **早めに抜ける**: 先頭 2 文字で判定が済む場合は、残りを見ずにループを抜けます。

## まとめ

- 頭字語を含む名前は、「大文字が続く部分の最後の文字」を境目として見ると正しく変換できる。
- 区切り文字の扱いは、コメントに例を書いて残すと後の人が理解しやすい。
- 文字列は配列にしてから 1 文字ずつ直すと、書き換えが簡単になる。

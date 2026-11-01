---
title: "文字列が空白だけでできているかを、1 文字ずつ調べる"
description: "Newtonsoft.Json の StringUtils.IsWhiteSpace。空の文字列は false とし、中身がすべて空白文字のときだけ true を返す。途中で 1 文字でも違えば、すぐ false を返す。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringUtils.cs
lines: [90, 110]
function: "StringUtils.IsWhiteSpace(string)"
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, 可読性]
---

## ひとことで

`IsWhiteSpace(s)` は、文字列が **空白文字だけでできているか** を調べて、`true` か `false` を返す関数です。
たとえば `"   \t "` は `true` です。`"  a  "` は途中に `a` があるので `false` です。空の文字列 `""` は `false` になります。

名前は似ていますが、標準の `string.IsNullOrWhiteSpace` とは、空の文字列の扱いが違います。

## コード

```csharp:line-numbers=90
        public static bool IsWhiteSpace(string s)
        {
            if (s == null)
            {
                throw new ArgumentNullException(nameof(s));
            }

            if (s.Length == 0)
            {
                return false;
            }

            for (int i = 0; i < s.Length; i++)
            {
                if (!char.IsWhiteSpace(s[i]))
                {
                    return false;
                }
            }

            return true;
```

## 前提知識

- **空白文字**: スペース、タブ、改行など、画面に何も表示しない文字です。
- **`null`**: 値が何もないことを表す特別な値です。文字列の場合、そもそも中身がありません。
- **`ArgumentNullException`**: 引数に `null` が渡されたときに投げる例外です。呼び出し側の間違いを知らせます。
- **`char.IsWhiteSpace`**: 1 文字が空白文字かどうかを調べる、標準の関数です。
- **`bool` の戻り値**: 条件を満たすかどうかを `true` か `false` で返します。

## 何をしているか

### 1. null を弾く

```csharp:line-numbers=92
            if (s == null)
            {
                throw new ArgumentNullException(nameof(s));
            }
```

`null` が渡されたら、例外で知らせます。空白かどうかを判断できないからです。

### 2. 空の文字列を弾く

```csharp:line-numbers=97
            if (s.Length == 0)
            {
                return false;
            }
```

長さが 0 の文字列は、空白だけでできているとは判断せず、`false` を返します。

### 3. 1 文字ずつ調べる

```csharp:line-numbers=102
            for (int i = 0; i < s.Length; i++)
            {
                if (!char.IsWhiteSpace(s[i]))
                {
                    return false;
                }
```

先頭から 1 文字ずつ `char.IsWhiteSpace` で調べます。空白でない文字を 1 つでも見つけたら、すぐ `false` を返します。

### 4. すべて空白なら true

```csharp:line-numbers=109

```

すべての文字が空白だったときだけ、ここまで来ます。その場合に `true` を返します。

## ここがすごい

- **途中で打ち切る**: 空白でない文字が見つかった時点で終わるので、長い文字列でも無駄な確認をしません。
- **空の文字列の扱いを明示**: 空の文字列を `false` にすることで、「空白だけの文字列」と「何もない文字列」を区別します。呼び出し側で意味を取り違えにくくなります。
- **null は例外で知らせる**: 判断できない入力をごまかさず、早く気づけるようにしています。
- **標準の関数を組み合わせる**: 空白の判定そのものは `char.IsWhiteSpace` に任せ、この関数は全体の判断だけを担当しています。

## まとめ

- `IsWhiteSpace` は、文字列の全文字が空白かどうかを 1 文字ずつ調べる。
- 空の文字列は `false`、`null` は例外で扱う。
- 空白でない文字が 1 つでもあれば、すぐ `false` を返す。

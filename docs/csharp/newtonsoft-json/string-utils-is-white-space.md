---
title: "文字列がすべて空白文字だけかを調べる"
description: "Newtonsoft.Json の StringUtils.IsWhiteSpace。文字列の全部の文字が空白かを 1 文字ずつ調べ、1 つでも空白でなければ false を返す。空の文字列は false。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringUtils.cs
lines: [90, 111]
function: "StringUtils.IsWhiteSpace(string)"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, 防御的プログラミング]
---

## ひとことで

`IsWhiteSpace` は、文字列が **すべて空白文字だけでできているか** を調べる関数です。
たとえば `"   "`（空白 3 つ）は `true`、`"  a "` は `false` です。

空の文字列 `""` は、空白が 1 つもないので `false` になります。

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
        }
```

## 前提知識

- **空白文字**: 半角スペース、タブ、改行などの、目に見えない区切りの文字です。`char.IsWhiteSpace` で判定できます。
- **`char`**: 文字 1 つを表す型です。文字列は `char` の並びとして扱えます。
- **`s.Length`**: 文字列の長さ（文字数）です。
- **`ArgumentNullException`**: 引数に `null` が渡されたときに投げる例外です。
- **`for` 文**: 番号を 0 から増やしながら、同じ処理を繰り返す書き方です。

## 何をしているか

### 1. `null` を受け付けない

```csharp:line-numbers=92
            if (s == null)
            {
                throw new ArgumentNullException(nameof(s));
```

`null` の文字列が来たら、例外を投げます。`null` は調べられないので、呼び出し側の誤りとして知らせます。

### 2. 空の文字列は `false` にする

```csharp:line-numbers=97
            if (s.Length == 0)
            {
                return false;
```

長さが 0 なら、空白文字が 1 つもないので `false` を返します。「すべてが空白」かどうかは、1 文字もない場合は言えないためです。

### 3. 1 文字ずつ空白かを調べる

```csharp:line-numbers=102
            for (int i = 0; i < s.Length; i++)
            {
                if (!char.IsWhiteSpace(s[i]))
                {
                    return false;
                }
            }
```

先頭から順に `char.IsWhiteSpace` で調べます。空白でない文字が 1 つでも見つかったら、すぐに `false` を返します。

### 4. すべて空白なら `true`

```csharp:line-numbers=110
            return true;
```

ループを最後まで抜けたら、すべての文字が空白だったことになるので、`true` を返します。

## ここがすごい

- **早く抜ける**: 空白でない文字が見つかった時点で、残りを調べずに終わります。
- **空の文字列の扱いを明確にしている**: 空の文字列を `false` にすることで、「空白だけの文字列」と「何もない文字列」を区別しています。
- **`null` を明示的に拒否**: 例外を投げることで、呼び出し側の問題を隠さずに知らせます。

## まとめ

- `null` は例外、空の文字列は `false` とする。
- 1 文字ずつ空白かを調べ、空白でない文字があれば `false`。
- 全部が空白なら `true`。

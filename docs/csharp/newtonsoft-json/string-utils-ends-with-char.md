---
title: "文字列の末尾が、指定した 1 文字と同じかを調べる"
description: "Newtonsoft.Json の StringUtils の EndsWith(string, char) の拡張メソッド。空の文字列は false とし、末尾の 1 文字だけを比べて判定する。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/StringUtils.cs
lines: [329, 332]
function: "StringUtils.EndsWith(string, char)"
difficulty: 1
format: 2
tags: [文字列処理, 防御的プログラミング, 可読性]
---

## ひとことで

`EndsWith(string, char)` は、文字列の **末尾が、指定した 1 文字と同じか** を調べる関数です。
たとえば `"abc/"` を `'/'` で調べると、`true` になります。

文字列全体を比べず、末尾の 1 文字だけを見るので、短い文字列でも長い文字列でも、同じように素早く答えられます。

## コード

```csharp:line-numbers=329
        public static bool EndsWith(this string source, char value)
        {
            return (source.Length > 0 && source[source.Length - 1] == value);
        }
```

## 前提知識

- **拡張メソッド（`this string source`）**: 既存の `string` に、あたかも自分のメソッドがあるかのように呼べる書き方です。
- **文字列の長さ（`Length`）**: 文字数です。`source.Length - 1` が、末尾の文字の位置になります。
- **`char`**: 1 文字を表す型です。
- **論理積（`&&`）**: 両方が `true` のときだけ `true` になる書き方です。ここでは、空の文字列を先に弾くのに使います。

## 何をしているか

### 1. 空の文字列を弾き、末尾の文字を比べる

```csharp:line-numbers=331
            return (source.Length > 0 && source[source.Length - 1] == value);
```

文字列の長さが 0 より大きいことを確かめてから、末尾の文字（`source[source.Length - 1]`）と `value` を比べます。

空の文字列には末尾がないので、長さの確認が先に来ています。順番を入れ替えると、添字の範囲外で例外になります。

## ここがすごい

- **1 文字だけを比べる**: 文字列全体を複製したり、比べ直したりしないので、速く終わります。
- **空の文字列も安全**: `Length > 0` を先に確かめるので、範囲外の例外が起きません。
- **1 行で読める**: 条件が 1 行にまとまっているので、意味がすぐ分かります。

## まとめ

- 文字列が空でないかを、先に確かめる。
- 末尾の 1 文字と、指定の文字を比べる。
- 空の文字列は `false`、末尾が一致すれば `true` を返す。

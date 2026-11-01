---
title: "JSON のトークンが、閉じの記号かを判定する"
description: "Newtonsoft.Json の JsonTokenUtils.IsEndToken。オブジェクト、配列、コンストラクターの終わりを表すトークンなら true を返す。switch の case の並びで判定する。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/JsonTokenUtils.cs
lines: [30, 41]
function: "JsonTokenUtils.IsEndToken(JsonToken)"
difficulty: 1
format: 2
tags: [パース, 型システム, イディオム]
---

## ひとことで

`IsEndToken` は、JSON を読んでいる途中のトークンが、**閉じの記号** かを判定する関数です。
たとえば、オブジェクトの終わり `}`、配列の終わり `]`、コンストラクターの終わりを表すトークンなら `true` を返します。

閉じの記号は、そこまでの構造が終わったことを表すので、読み取りの処理で、階層を 1 つ戻るかどうかを決めるのに使われます。

## コード

```csharp:line-numbers=30
        internal static bool IsEndToken(JsonToken token)
        {
            switch (token)
            {
                case JsonToken.EndObject:
                case JsonToken.EndArray:
                case JsonToken.EndConstructor:
                    return true;
                default:
                    return false;
            }
        }
```

## 前提知識

- **`JsonToken`**: JSON のトークンの種類を表す列挙型です。`EndObject`、`EndArray`、`EndConstructor` などの値があります。
- **`switch` 文の `case` の並び**: 同じ結果になる値を、`case` を連続させて並べると、まとめて書けます。
- **`default`**: どの `case` にも当てはまらないときに実行される部分です。

## 何をしているか

### 1. 閉じの記号を並べる

```csharp:line-numbers=34
                case JsonToken.EndObject:
                case JsonToken.EndArray:
                case JsonToken.EndConstructor:
```

`EndObject`、`EndArray`、`EndConstructor` は、どれも閉じの記号です。同じ結果になるので、`case` を続けて書いています。

### 2. 閉じの記号なら true、それ以外は false

```csharp:line-numbers=37
                    return true;
                default:
                    return false;
```

閉じの記号なら `true` を返し、それ以外の場合は `false` を返します。

## ここがすごい

- **分類が一覧で読める**: 閉じの記号が、1 か所に並んでいるので、どれが対象かがすぐ分かります。
- **ほかの分類と対になる**: 開きの記号を判定する `IsStartToken` と、同じ形で書かれています。
- **分岐が単純**: 値を返すだけの単純な構造なので、誤りが入りにくいです。

## まとめ

- 閉じの記号の 3 種類を、`case` でまとめて並べる。
- 閉じの記号なら `true`、それ以外は `false` を返す。

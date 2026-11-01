---
title: "JSON のトークンが、値だけを表すものかを判定する"
description: "Newtonsoft.Json の JsonTokenUtils.IsPrimitiveToken。数、文字列、真偽値などの値を表すトークンの種類かを switch で調べる。開始・終了の記号は含まない。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/JsonTokenUtils.cs
lines: [56, 72]
function: "JsonTokenUtils.IsPrimitiveToken(JsonToken)"
difficulty: 1
format: 2
tags: [パース, 型システム, イディオム]
---

## ひとことで

`IsPrimitiveToken` は、JSON を読んでいる途中のトークン（部品）が、**値そのもの** を表すかを判定する関数です。
たとえば、数（`Integer`）、文字列（`String`）、真偽値（`Boolean`）、`null` は値なので `true` になります。

`{` や `[` のような、構造を表す記号は値ではないので `false` になります。

## コード

```csharp:line-numbers=56
        internal static bool IsPrimitiveToken(JsonToken token)
        {
            switch (token)
            {
                case JsonToken.Integer:
                case JsonToken.Float:
                case JsonToken.String:
                case JsonToken.Boolean:
                case JsonToken.Undefined:
                case JsonToken.Null:
                case JsonToken.Date:
                case JsonToken.Bytes:
                    return true;
                default:
                    return false;
            }
        }
```

## 前提知識

- **JSON のトークン**: JSON の文書を、意味のある最小単位に分けたものです。`{`、`[`、値、`:` などがあります。
- **`JsonToken` 列挙型**: トークンの種類を表す型です。`Integer`、`String`、`StartObject` などの値があります。
- **`switch` 文の `case` の並び**: 同じ結果になる値を、`case` の連続で並べると、まとめて書けます。
- **`default`**: どの `case` にも当てはまらないときに実行される部分です。

## 何をしているか

### 1. 数と文字列のトークンを判定する

```csharp:line-numbers=60
                case JsonToken.Integer:
                case JsonToken.Float:
                case JsonToken.String:
```

`Integer`、`Float`、`String` のトークンは、値そのものです。`case` を並べて、同じ結果にしています。

### 2. 真偽値と null を判定する

```csharp:line-numbers=63
                case JsonToken.Boolean:
                case JsonToken.Undefined:
                case JsonToken.Null:
```

`Boolean`、`Undefined`、`Null` も、値として扱います。`Undefined` は、JavaScript の値に対応するための種類です。

### 3. 日付とバイト列を判定する

```csharp:line-numbers=66
                case JsonToken.Date:
                case JsonToken.Bytes:
                    return true;
```

`Date` と `Bytes` も、値として扱います。JSON の文字列から、読み取り側で日付やバイト列に変換される種類です。

### 4. それ以外は値ではない

```csharp:line-numbers=69
                default:
                    return false;
```

ここに当てはまらないトークン（`StartObject`、`EndArray` などの構造を表すもの）は、`false` を返します。

## ここがすごい

- **分類の表を 1 か所に集める**: 「値かどうか」の判定を 1 つの関数にまとめているので、新しい種類を追加するときは、ここだけを直せば済みます。
- **構造と値を分ける**: 読み取りの処理は、値のときと構造のときで流れが違います。この関数で分けられます。
- **分岐が読みやすい**: 同じ結果の `case` を並べているので、どの種類が値かが一覧で分かります。

## まとめ

- 数、文字列、真偽値、`null` などの値を表すトークンは `true` になる。
- `{` や `[` のような構造の記号は `false` になる。
- 種類の一覧を `switch` にまとめて、判定を 1 か所に集めている。

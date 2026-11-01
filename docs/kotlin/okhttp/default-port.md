---
title: "スキームから既定のポート番号を求める defaultPort"
description: "\"http\" なら 80、\"https\" なら 443、それ以外は -1 を返す defaultPort。-1 を「既定がない」の印に使い、URL を組み立てるときにポートを省略するかどうかを決める。"
language: kotlin
project: "OkHttp"
repo: https://github.com/square/okhttp
license: Apache-2.0
copyright: "Copyright (C) 2015 Square, Inc."
commit: "16fb6aef3aee1c4645fc8d24af01f8a4dc128ebf"
file: okhttp/src/commonJvmAndroid/kotlin/okhttp3/HttpUrl.kt
lines: [1713, 1718]
function: "HttpUrl.Companion.defaultPort"
difficulty: 1
tags: [ネットワーク, API設計, イディオム]
format: 2
---

## ひとことで

`defaultPort()` は、URL の **スキーム**（`http` や `https` のような、通信の種類を表す部分）から、**既定のポート番号** を返す関数です。`http` なら 80、`https` なら 443 です。知らないスキームなら、`-1` を返して「既定のポートはない」ことを示します。

OkHttp（HTTP クライアントのライブラリ）が、URL を扱うときに、ポート番号を省略できるかを判断するのに使っています。

## コード

```kotlin:line-numbers=1713
    fun defaultPort(scheme: String): Int =
      when (scheme) {
        "http" -> 80
        "https" -> 443
        else -> -1
      }
```

## 前提知識

- **ポート番号**: 1 台のコンピュータの中で、通信の行き先を区別するための番号です。HTTP は 80、HTTPS は 443 が標準の番号として決まっています。
- **スキーム**: URL の先頭にある `https://` の `https` の部分です。通信の方式を表します。
- **`companion object`**: クラスに付随する、クラス名だけで呼べる部分です。`HttpUrl.defaultPort(...)` のように呼べます。
- **`@JvmStatic`**: Java から見たときに、static のメソッドとして呼べるようにする印です。
- **`when` 式**: 値によって結果を変える書き方です。ここでは文字列の一致で 3 つに分かれます。

## 何をしているか

### 1. http と https の標準の番号

```kotlin:line-numbers=1715
        "http" -> 80
        "https" -> 443
```

スキームが `http` なら 80、`https` なら 443 を返します。どちらも、HTTP と HTTPS の仕様で決まっている番号です。

### 2. それ以外は -1

```kotlin:line-numbers=1717
        else -> -1
```

知らないスキームでは、既定のポートがありません。そこで `-1` を返します。ポート番号は 1 から 65535 の範囲なので、`-1` はどの本当のポートとも重なりません。

## ここがすごい

- **番号を使い分けの印にする**: 「既定のポートはない」を、例外や `null` ではなく `-1` で表しています。呼び出し側は、数値の比較だけで判断できます。
- **一覧が短く読みやすい**: 3 つの枝だけなので、どのスキームがどのポートになるかが一目で分かります。
- **文字列の一致で判定**: `when (scheme)` は、文字列が完全に一致するかを調べます。大文字や余計な空白は、呼び出し側で正規化されている前提です。
- **ドキュメントの説明と一致**: KDoc に書かれた「80、443、それ以外は -1」と、実際の枝が一致しています。読み手は、ドキュメントを信頼して読めます。

## まとめ

- `defaultPort` は、`http` なら 80、`https` なら 443、それ以外は -1 を返す。
- `-1` は「既定のポートがない」の印として使われ、どの実在のポートとも重ならない。
- 3 つの枝だけの単純な `when` で、標準の番号の一覧を表している。

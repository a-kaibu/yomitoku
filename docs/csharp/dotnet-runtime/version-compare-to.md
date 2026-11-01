---
title: "バージョン番号を、大きい部分から順に比べる"
description: ".NET Runtime の Version.CompareTo。メジャー、マイナー、ビルド、リビジョンの順に比べ、最初に違った部分で大小を決める。null は常に小さいとみなす。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Version.cs
lines: [127, 137]
function: "Version.CompareTo(Version?)"
difficulty: 2
format: 2
tags: [可読性, イディオム, 型システム]
---

## ひとことで

`CompareTo` は、2 つのバージョン番号（たとえば `1.2.3.4`）の **大小** を求める関数です。
結果が負なら、今のバージョンが小さく、正なら大きく、0 なら同じです。

大きい部分（メジャー）から順に比べ、最初に違った部分で大小を決めます。たとえば `1.2` と `1.10` は、マイナーの `2` と `10` を比べて、`1.2` が小さいと判定されます。

## コード

```csharp:line-numbers=127
        public int CompareTo(Version? value)
        {
            return
                ReferenceEquals(value, this) ? 0 :
                value is null ? 1 :
                _Major != value._Major ? (_Major > value._Major ? 1 : -1) :
                _Minor != value._Minor ? (_Minor > value._Minor ? 1 : -1) :
                _Build != value._Build ? (_Build > value._Build ? 1 : -1) :
                _Revision != value._Revision ? (_Revision > value._Revision ? 1 : -1) :
                0;
        }
```

## 前提知識

- **バージョン番号**: `メジャー.マイナー.ビルド.リビジョン` の 4 つの数の並びです。
- **`ReferenceEquals`**: 2 つの参照が同じオブジェクトかを調べる関数です。同じなら、値を比べる必要がありません。
- **三項演算子の連鎖（`a ? x : b ? y : z`）**: 条件を順に並べて、最初に当てはまったものを選ぶ書き方です。
- **`null` の扱い**: `null` より大きいとみなすのが、この実装の決まりです。
- **数の比較**: `1.10` の `10` は、文字の `1` と `0` ではなく、数としての 10 として比べられます。

## 何をしているか

### 1. 同じオブジェクトなら 0

```csharp:line-numbers=130
                ReferenceEquals(value, this) ? 0 :
```

比べる相手が自分自身なら、同じなので `0` を返します。

### 2. 相手が null なら 1

```csharp:line-numbers=131
                value is null ? 1 :
```

相手が `null` なら、今のバージョンの方が大きいので `1` を返します。

### 3. メジャーから順に比べる

```csharp:line-numbers=132
                _Major != value._Major ? (_Major > value._Major ? 1 : -1) :
```

メジャーの番号が違えば、その大小で決めます。同じなら、次の部分へ進みます。

### 4. マイナー、ビルド、リビジョンを順に比べる

```csharp:line-numbers=133
                _Minor != value._Minor ? (_Minor > value._Minor ? 1 : -1) :
                _Build != value._Build ? (_Build > value._Build ? 1 : -1) :
                _Revision != value._Revision ? (_Revision > value._Revision ? 1 : -1) :
```

マイナー、ビルド、リビジョンも、同じように順に比べます。最初に違った部分で、大小が決まります。

### 5. すべて同じなら 0

```csharp:line-numbers=136
                0;
```

4 つの部分がすべて同じなら、`0` を返します。

## ここがすごい

- **文字列にしない**: 文字列にして比べると `1.10` が `1.2` より小さくなってしまいます。数として比べるので、この誤りを避けられます。
- **早く終わる**: 大きい部分で違いが見つかれば、残りの部分は比べません。
- **判定の順番が明確**: 「同じか、null か、メジャー、マイナー……」の順に並んでいるので、読みながら優先順位が追えます。

## まとめ

- 同じオブジェクトなら 0、`null` の相手には 1 を返す。
- メジャーからリビジョンまで、数として順に比べる。
- 最初に違った部分で大小を決め、すべて同じなら 0 を返す。

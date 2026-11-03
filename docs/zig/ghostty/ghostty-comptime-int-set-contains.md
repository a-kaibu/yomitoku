---
title: コンパイル時の整数集合に、キーが含まれるかを調べる
description: Ghostty の ComptimeIntSet.contains。indexOf の結果が null でないかを返すだけの関数。inline として呼び出し先に展開される。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/comptime_int_set.zig
lines: [114, 116]
function: ComptimeIntSet.contains
difficulty: 1
format: 2
tags: [データ構造, イディオム, メタプログラミング]
---

## ひとことで

`contains` は、コンパイル時に決まった整数の集合に、キーが入っているかを `true` か `false` で返す関数です。中身は `indexOf` の結果を、`null` かどうかで判定するだけです。

## コード

```zig:line-numbers=114
        pub inline fn contains(key: T) bool {
            return indexOf(key) != null;
        }
```

## 前提知識

- **`ComptimeIntSet`**: コンパイル時に与えられた整数の集合を表す型です。集合の中身は、実行時には探索用の表として持たれます。
- **`indexOf`**: 同じファイルにある関数で、キーの位置を `?Index` で返します。見つからなければ `null` です。
- **`!= null`**: 値が `null` でないかを調べる比較です。オプションの値の有無を、真偽値にできます。
- **`pub inline fn`**: 呼び出し先に展開される関数です。小さな関数を、呼び出しの負担なしで使えます。
- **`bool`**: 真か偽の値です。

## 何をしているか

### 1. indexOf の結果を調べる

```zig:line-numbers=115
            return indexOf(key) != null;
```

`indexOf(key)` を呼び、その結果が `null` でないかを `!= null` で比べます。位置が見つかれば `true`、見つからなければ `false` になります。

## ここがすごい

- **探索の結果を再利用**: 中身の二分探索は `indexOf` に任せています。判定だけの関数が、探索の仕組みを重複して持ちません。
- **`inline` で呼び出しが消える**: 小さな関数が呼び出し元に展開されるので、判定の処理が直接書かれたのと同じになります。
- **オプションの型で存在を表す**: `?Index` の `null` で、見つからない場合を型で表しています。
- **読み手が意図をすぐ理解**: `contains` という名前が、集合の所属判定だと明示しています。

## まとめ

- `contains` は、`indexOf` の結果が `null` でないかで、キーの所属を判定します。
- 探索は `indexOf` に任せ、この関数は判定だけを行います。
- `inline` で展開されるので、呼び出しの負担がありません。

---
title: "ホスト名を、長い名前と短い名前のどちらの形にそろえるか決める"
description: "net_adm:longshort/1 は、Erlang の長名（ドットを含む完全な名前）の設定に合わせて、ホスト名の形を整える。短名のときはドット以降を捨てる。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/net_adm.erl
lines: [331, 340]
function: "net_adm:longshort/1"
difficulty: 2
format: 2
tags: ["ネットワーク", "文字列処理", "標準ライブラリ"]
---
## ひとことで

`net_adm:longshort/1` は、ホスト名を、分散 Erlang の名前の設定に合った形に直します。
長い名前（`host.example.com` のような完全な名前）を使う設定なら、そのまま返します。短い名前（`host` だけ）を使う設定なら、最初のドットより後ろを捨てます。

## コード

```erlang:line-numbers=331
longshort(Host) ->
    case net_kernel:longnames() of
	false -> uptodot(Host);
	true -> Host;
	ignored -> ignored
    end.

uptodot([$.|_]) -> [];
uptodot([])-> [];
uptodot([H|T]) -> [H|uptodot(T)].
```

## 前提知識

- **長名（longnames）と短名（shortnames）**: 分散 Erlang のノードは、完全な名前か、ドットを含まない短い名前のどちらかで動きます。
- **`net_kernel:longnames()`**: 現在の設定を返します。`true` なら長名、`false` なら短名、`ignored` なら分散が動いていないことを表します。
- **`uptodot/1`**: 最初のドットまでの文字を残し、ドット以降を捨てる補助関数です。
- **文字のリスト**: ホスト名は、文字のリストとして扱われます。`$.` は、ドットの文字です。

## 何をしているか

### 1. 設定を確かめて、三通りに分ける

```erlang:line-numbers=331
longshort(Host) ->
    case net_kernel:longnames() of
	false -> uptodot(Host);
	true -> Host;
	ignored -> ignored
    end.
```

`net_kernel:longnames()` の結果で分岐します。
- `false`（短名）なら、`uptodot/1` でドット以降を捨てます。
- `true`（長名）なら、ホスト名をそのまま返します。
- `ignored` なら、そのまま `ignored` を返します。

### 2. ドットの前までを残す

```erlang:line-numbers=338
uptodot([$.|_]) -> [];
uptodot([])-> [];
uptodot([H|T]) -> [H|uptodot(T)].
```

`uptodot/1` は、先頭の文字がドットなら、空のリストで止まります。そうでなければ、その文字を残して、残りを同じ方法で処理します。
空のリストは、そのまま空です。

## ここがすごい

### 設定を読んで、結果を変える

ホスト名の扱いは、ノードを動かす環境の設定で決まります。
この関数は、設定を毎回読んで、その時点で正しい形を返します。呼び出す側は、設定の違いを気にしなくて済みます。

### ドットで切るのは、一文字ずつ

`uptodot/1` は、ドットに当たるまで、文字を一つずつ残します。
ドットに当たった節で、残りを捨てる、という単純な形です。文字列を分割する関数を使わず、リストの先頭だけを見て判断しています。

### 三つの戻り値を、そのまま渡す

`ignored` は、「まだ分散が動いていない」ことを表す特別な値です。
それを、加工せずそのまま返します。呼び出し側は、三つの状態を区別して扱えます。

## まとめ

`net_adm:longshort("host.example.com")` は、長名の設定なら `"host.example.com"`、短名の設定なら `"host"` を返します。

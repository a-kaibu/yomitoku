---
title: "ネットワークのフラグを、inet 形式の名前に対応づける"
description: "inet:net_flag_to_inet_flag/1 は、OS のインターフェースのフラグを、inet の表す名前へ変換する。対応表を先頭から順に探し、見つかった値を {value, Flag} で返す。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/inet.erl
lines: [1947, 1960]
function: "inet:net_flag_to_inet_flag/1"
difficulty: 3
format: 2
tags: ["ネットワーク", "データ構造", "イディオム"]
---
## ひとことで

`inet:net_flag_to_inet_flag/1` は、インターフェースのフラグ一つを、`inet` が使う名前に読み替えます。
対応する名前があれば `{value, 名前}`、無ければ `false` を返します。対応表は、関数の中に、リストとして書かれています。

## コード

```erlang:line-numbers=1947
net_flag_to_inet_flag(InFlag) ->
    InetFlags = [up, broadcast, loopback,
                 {pointopoint, pointtopoint},
                 running, multicast],
    net_flag_to_inet_flag(InFlag, InetFlags).

net_flag_to_inet_flag(_InFlag, []) ->
    false;
net_flag_to_inet_flag(InFlag, [InFlag|_]) ->
    {value, InFlag};
net_flag_to_inet_flag(InFlag, [{InFlag, OutFlag}|_]) ->
    {value, OutFlag};
net_flag_to_inet_flag(InFlag, [_|InetFlags]) ->
    net_flag_to_inet_flag(InFlag, InetFlags).
```

## 前提知識

- **フラグ**: インターフェースの性質を表すアトムです。`up`（起動中）、`broadcast`（ブロードキャスト可能）などがあります。
- **対応表**: 変換の元と先を、一覧にしたものです。アトムそのものは、そのまま対応づけられ、タプル `{In, Out}` は、別の名前に読み替えられます。
- **`{value, X}` と `false`**: 対応が見つかったかどうかを、戻り値の形で表す約束です。
- **二引数版**: 一引数版の関数が、表を用意して、二引数版の補助関数に渡します。

## 何をしているか

### 1. 表を用意して、補助関数に渡す

```erlang:line-numbers=1947
net_flag_to_inet_flag(InFlag) ->
    InetFlags = [up, broadcast, loopback,
                 {pointopoint, pointtopoint},
                 running, multicast],
    net_flag_to_inet_flag(InFlag, InetFlags).
```

関数の中に、変換の表 `InetFlags` を書きます。表には、アトムそのものと、タプル `{pointopoint, pointtopoint}` のような読み替えが並びます。その表を、二引数版に渡します。

### 2. 表が尽きたら、見つからなかった

```erlang:line-numbers=1953
net_flag_to_inet_flag(_InFlag, []) ->
    false;
```

表の残りが空なら、対応が無かったので、`false` を返します。

### 3. 表の先頭が、そのままの名前なら、その値を返す

```erlang:line-numbers=1955
net_flag_to_inet_flag(InFlag, [InFlag|_]) ->
    {value, InFlag};
```

表の先頭が、探すフラグ `InFlag` と同じアトムなら、それを `{value, InFlag}` で返します。

### 4. 読み替えの組なら、対応する名前を返す

```erlang:line-numbers=1957
net_flag_to_inet_flag(InFlag, [{InFlag, OutFlag}|_]) ->
    {value, OutFlag};
```

表の先頭が `{InFlag, OutFlag}` の組なら、読み替え後の名前 `OutFlag` を `{value, OutFlag}` で返します。

### 5. どれにも当たらなければ、表の残りを探す

```erlang:line-numbers=1959
net_flag_to_inet_flag(InFlag, [_|InetFlags]) ->
    net_flag_to_inet_flag(InFlag, InetFlags).
```

どの条件にも当たらなければ、表の先頭を捨てて、残りの表で同じ関数を続けます。

## ここがすごい

### 表を、データとして並べる

変換の規則を、関数の中の大量の節として書くこともできます。
この関数は、表を一つのリストに並べ、それを順に探すだけです。新しい対応を足すときは、リストに一行加えれば済みます。

### 節の順で、優先順位を決める

同じ名前の対応が複数あるとき、先に書かれたものが選ばれます。
表の順番が、そのまま優先順位になっています。読み手は、表を上から読むだけで、どちらが先に当たるかが分かります。

### 見つからないことを、false で返す

対応が無いフラグは、エラーにせず `false` で伝えます。
呼び出し側は、対応できないフラグを、無視するか別の扱いにするかを選べます。

## まとめ

`inet:net_flag_to_inet_flag(running)` は、`{value, running}` を返します。
`inet:net_flag_to_inet_flag(unknown)` は、表に無いので `false` を返します。

---
title: "ネットワークインターフェースの名前を、重複を消して元の順番で残す"
description: "inet:net_unique_if_names/1 は、インターフェースの一覧から名前だけを取り出し、同じ名前を二つ目以降は捨てる。最初に現れた順番を保ち、一覧を前から一度だけ進める。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/inet.erl
lines: [1699, 1710]
function: "inet:net_unique_if_names/1"
difficulty: 2
format: 2
tags: ["ネットワーク", "データ構造", "アルゴリズム"]
---
## ひとことで

`inet:net_unique_if_names/1` は、ネットワークのインターフェースの一覧から、名前の重複を取り除きます。
一つのインターフェースに、複数の住所が付いていると、同じ名前が何度も現れます。この関数は、最初に現れた名前だけを、元の順番で残します。

## コード

```erlang:line-numbers=1699
net_unique_if_names(Ifs) ->
    net_unique_if_names(Ifs, []).

net_unique_if_names([], IfNames) ->
    lists:reverse(IfNames);
net_unique_if_names([#{name := IfName}|Ifs], IfNames) ->
    case lists:member(IfName, IfNames) of
        true ->
            net_unique_if_names(Ifs, IfNames);
        false ->
            net_unique_if_names(Ifs, [IfName|IfNames])
    end.
```

## 前提知識

- **インターフェースの一覧**: 各要素は、`#{name := IfName}` の形の写像です。キー `name` に、インターフェースの名前が入っています。
- **アキュムレータ `IfNames`**: ここまでに見つけた名前を、逆順で積んでいく引数です。
- **`lists:member/2`**: 名前がすでに積まれているかを、先頭から調べます。
- **`lists:reverse/1`**: 積んだ名前の順番を、元に戻します。

## 何をしているか

### 1. 入口で、空の名前リストから始める

```erlang:line-numbers=1699
net_unique_if_names(Ifs) ->
    net_unique_if_names(Ifs, []).
```

`net_unique_if_names/1` は、名前を積むための空のリストを用意して、補助関数に渡します。

### 2. 一覧が空になったら、順番を戻して返す

```erlang:line-numbers=1702
net_unique_if_names([], IfNames) ->
    lists:reverse(IfNames);
```

一覧を読み終わったら、積んだ名前を `lists:reverse/1` で元の順番に戻します。

### 3. 名前がすでに積まれていれば、捨てる

```erlang:line-numbers=1704
net_unique_if_names([#{name := IfName}|Ifs], IfNames) ->
    case lists:member(IfName, IfNames) of
        true ->
            net_unique_if_names(Ifs, IfNames);
        false ->
            net_unique_if_names(Ifs, [IfName|IfNames])
```

先頭の要素から名前 `IfName` を取り出し、`lists:member/2` で積み済みかを調べます。
すでにあれば、名前を積まずに、残りの一覧を続けます。無ければ、名前を積んでから続けます。

### 4. 関数の終わり

```erlang:line-numbers=1710
    end.
```

補助関数の最後で、一覧に対して再帰を続けるか、結果を返すかが決まります。

## ここがすごい

### 最初に現れた順番を保つ

重複を取り除くとき、並べ替えてから消す方法もあります。
しかし、この関数は、一覧の順番どおりに一度ずつ進み、初めて見た名前だけを残します。元の並びの意味を保ったまま、重複を消せます。

### 積んでから、最後に戻す

名前は、先頭に積んでいくので、逆順になります。
最後に一度だけ `reverse` で戻す、という定番の形です。末尾に付けるより、一回ごとの作業が軽く済みます。

### 重複の判定を、一つの節で決める

積み済みの名前が見つかったら、積まずに進む。無ければ積んで進む。
この二つの枝で、重複を消す規則が、そのまま表されています。判定の仕組みを読めば、関数の全体が分かります。

## まとめ

`inet:net_unique_if_names([#{name => "eth0"}, #{name => "eth0"}, #{name => "lo"}])` は、`["eth0", "lo"]` を返します。
二つ目の `eth0` は、最初の一つを残して捨てられます。

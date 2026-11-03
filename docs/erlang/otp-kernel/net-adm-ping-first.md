---
title: "ノードの一覧から、最初に応答するノードまで順に確かめる"
description: "net_adm:ping_first/2 は、ノードの一覧を先頭から見て、すでに接続済みのものは通し、未接続のものは ping で確かめる。最初に pong が返ったノードで止まる。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/net_adm.erl
lines: [202, 212]
function: "net_adm:ping_first/2"
difficulty: 3
format: 2
tags: ["ネットワーク", "並行処理", "エラー処理"]
---
## ひとことで

`net_adm:ping_first/2` は、分散 Erlang のノードの一覧を先頭から順に確かめ、最初に応答したノードで止まる関数です。
すでに接続しているノードは、ping せずに通します。ネットワーク上で、とにかく一つ生きているノードに接続したいときの、基本の部品です。

## コード

```erlang:line-numbers=202
ping_first([], _S) ->
    [];
ping_first([Node|Nodes], S) ->
    case lists:member(Node, S) of
	true -> [Node | ping_first(Nodes, S)];
	false ->
	    case ping(Node) of
		pong -> [Node];
		pang -> ping_first(Nodes, S)
	    end
    end.
```

## 前提知識

- **ノード**: 分散 Erlang で、一つの Erlang 実行環境を表す名前です。
- **`ping(Node)`**: 相手のノードに接続を試み、応答があれば `pong`、無ければ `pang` を返します。
- **`nodes()`**: いま接続しているノードの一覧です。`S` に、この一覧を渡しています。
- **`lists:member/2`**: 一覧に、そのノードが含まれるかを調べます。
- **`pong` と `pang`**: 応答があったか、なかったかを表すアトムです。

## 何をしているか

### 1. 一覧が空なら、結果も空

```erlang:line-numbers=202
ping_first([], _S) ->
    [];
```

確かめるノードが無くなったら、空のリストを返します。

### 2. すでに接続しているノードは、ping せずに通す

```erlang:line-numbers=204
ping_first([Node|Nodes], S) ->
    case lists:member(Node, S) of
	true -> [Node | ping_first(Nodes, S)];
```

先頭のノード `Node` が、接続済みの `S` に含まれていれば、ping はしません。`Node` を結果に残し、残りの一覧を続けて確かめます。

### 3. 未接続のノードは、ping で確かめる

```erlang:line-numbers=207
	false ->
	    case ping(Node) of
		pong -> [Node];
		pang -> ping_first(Nodes, S)
	    end
```

未接続のノードは、`ping(Node)` で確かめます。
- `pong` なら、応答があったので、`[Node]` を返して止まります。
- `pang` なら、応答が無かったので、残りの一覧を続けて確かめます。

### 4. 外側の `end.` で、関数の形がそろう

```erlang:line-numbers=212
    end.
```

`case` の二つの枝で、関数の全体の形が決まります。

## ここがすごい

### 応答する一つを見つけたら止まる

全部のノードに ping する必要はありません。最初に `pong` が返った時点で、それ以上の確かめは止めます。
ネットワークの負担を減らし、待ち時間も短くなります。

### 接続済みを、無駄に ping しない

すでに繋がっているノードに、もう一度 ping を送るのは無駄です。
`lists:member/2` で先に調べて、接続済みのものは素通りさせます。結果として、確かめる数が減ります。

### 失敗と成功を、同じ再帰で扱う

`pang` のときも `pong` のときも、関数の形は同じ再帰です。
違いは、次の一覧を続けるかどうかだけです。`case` の中の二つの枝で、その分かれ道が一目で読めます。

## まとめ

`net_adm:ping_first(['a@host', 'b@host'], [])` は、`a@host` に応答があればその一つだけ、無ければ `b@host` を確かめます。
応答が一つもなければ、空のリストを返します。

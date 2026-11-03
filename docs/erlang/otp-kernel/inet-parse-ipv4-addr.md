---
title: "IPv4 の文字列を、フィールドの数で場合分けして数に戻す"
description: "inet_parse:ipv4_address/1 は、10.0.0.1 のような IPv4 の文字列を 4 バイトのタプルに変える。フィールドの数ごとに節を分け、最後のフィールドが残りのバイトを表す、inet_aton と同じ書き方を受け付ける。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/inet_parse.erl
lines: [492, 525]
function: "inet_parse:ipv4_addr/1"
difficulty: 3
format: 2
tags: ["ネットワーク", "文字列処理", "パース"]
---
## ひとことで

`inet_parse` は、IP アドレスの文字列を、数の並びに変えるモジュールです。`ipv4_addr/1` は、フィールド（`.` で区切られた部分）を受け取り、4 バイトのタプル `{A, B, C, D}` にします。
`192.168.0.1` のような普通の形だけでなく、フィールドが 1 個から 4 個まで、少ない形も受け付けます。その数に応じて、場合分けの節を書き分けています。

## コード

::: code-group

```erlang:line-numbers=492 [日本語訳]
ipv4_addr(Cs) ->
    case ipv4_addr(Cs, []) of
        [D] when
              is_integer(D, 0, 16#ffff_ffff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            Db = Da bsr 8,
            D2 = Db band 16#ff,
            D1 = Db bsr 8,
            {D1,D2,D3,D4};
        [D,D1] when
              is_integer(D,  0, 16#ff_ffff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            D2 = Da bsr 8,
            {D1,D2,D3,D4};
        [D,D2,D1] when
              is_integer(D,  0, 16#ffff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            D3 = D bsr 8,
            {D1,D2,D3,D4};
        [D4,D3,D2,D1] when
              is_integer(D4, 0, 16#ff),
              is_integer(D3, 0, 16#ff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            {D1,D2,D3,D4};
        Ds when length(Ds) =< 4 ->      throw(error) % 値が範囲を超えている（フィールドの大きさが合わない）
    end.
```

```erlang:line-numbers=492 [原文]
ipv4_addr(Cs) ->
    case ipv4_addr(Cs, []) of
        [D] when
              is_integer(D, 0, 16#ffff_ffff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            Db = Da bsr 8,
            D2 = Db band 16#ff,
            D1 = Db bsr 8,
            {D1,D2,D3,D4};
        [D,D1] when
              is_integer(D,  0, 16#ff_ffff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            D2 = Da bsr 8,
            {D1,D2,D3,D4};
        [D,D2,D1] when
              is_integer(D,  0, 16#ffff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            D3 = D bsr 8,
            {D1,D2,D3,D4};
        [D4,D3,D2,D1] when
              is_integer(D4, 0, 16#ff),
              is_integer(D3, 0, 16#ff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            {D1,D2,D3,D4};
        Ds when length(Ds) =< 4 ->      throw(error) % Fields(s) out of bounds
    end.
```

:::

## 前提知識

- **IPv4 アドレス**: 32 ビットの数で、普通は `a.b.c.d` と 10 進数 4 つで書きます。各部分は 0 から 255 までです。
- **フィールド**: `.` で区切られた、1 つ 1 つの数字の部分です。
- **`inet_aton` の書き方**: 古くからある、フィールドの数が少ない形です。たとえば `10.1` は、2 つ目のフィールドが残りの 3 バイトを表します。
- **`throw(error)`**: 途中で失敗したことを、`throw` で伝えます。呼び出し側は `try ... catch` で `{error, einval}` に変えます。
- **`is_integer(D, 0, 16#ffff_ffff)`**: 整数で、範囲内かを一度に確かめるガードです。
- **ビット演算 `band` と `bsr`**: `band 16#ff` は下位 8 ビットを取り出し、`bsr 8` は 8 ビット右にずらします。

## 何をしているか

### 1. フィールドが 1 個のとき

```erlang:line-numbers=493
    case ipv4_addr(Cs, []) of
        [D] when
              is_integer(D, 0, 16#ffff_ffff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            Db = Da bsr 8,
            D2 = Db band 16#ff,
            D1 = Db bsr 8,
            {D1,D2,D3,D4};
```

1 つの数字（`D`）は、32 ビットの整数全体です。下位から 8 ビットずつ取り出して、4 バイトに分けます。`D4` が最も下のバイト、`D1` が最も上のバイトになります。

### 2. フィールドが 2 個のとき

```erlang:line-numbers=503
        [D,D1] when
              is_integer(D,  0, 16#ff_ffff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            Da = D bsr 8,
            D3 = Da band 16#ff,
            D2 = Da bsr 8,
            {D1,D2,D3,D4};
```

最初のフィールド `D1` は 8 ビット、最後のフィールド `D` は残りの 24 ビットを表します。`D` を 8 ビットずつ分けて、`D1` と合わせて 4 バイトにします。

### 3. フィールドが 3 個のとき

```erlang:line-numbers=511
        [D,D2,D1] when
              is_integer(D,  0, 16#ffff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            D4 = D band 16#ff,
            D3 = D bsr 8,
            {D1,D2,D3,D4};
```

最初の 2 つのフィールドはそれぞれ 8 ビットです。最後のフィールド `D` が、残りの 16 ビットを表します。

### 4. フィールドが 4 個のとき

```erlang:line-numbers=518
        [D4,D3,D2,D1] when
              is_integer(D4, 0, 16#ff),
              is_integer(D3, 0, 16#ff),
              is_integer(D2, 0, 16#ff),
              is_integer(D1, 0, 16#ff) ->
            {D1,D2,D3,D4};
```

4 つのフィールドは、それぞれ 8 ビットなので、ずらす必要はありません。そのまま 4 バイトのタプルにします。

### 5. 範囲外や、フィールドが多すぎるとき

```erlang:line-numbers=524
        Ds when length(Ds) =< 4 ->      throw(error) % Fields(s) out of bounds
    end.
```

どの節にも合わなければ、`throw(error)` で失敗を伝えます。コード中のコメントにあるとおり、値が範囲を超えている場合が該当します。

## ここがすごい

### フィールドの数で、必要な式の形を変える

どの場合も、結果は同じ 4 バイトです。違いは、残りのビットをどの単位で割り当てるかだけです。その差を、フィールドの数ごとの節として書き分けています。
ビットの式を一般化して 1 つにまとめるより、節が読みやすくなります。

### 範囲のチェックを、ガードで先に行う

各節のガード `is_integer(D, 0, 16#ffff_ffff)` が、値の範囲を先に確かめます。範囲外の値は、その節に入れないので、ビットのずらしを間違えることがありません。
範囲のチェックと、変換の本体を分けているのが、読みやすさの理由です。

## まとめ

- 文字列の数値を変換するときは、フィールドの数という「形」で場合分けすると、規則を書きやすくなります。
- 残りのビットを最後のフィールドに任せる書き方は、古くからの IPv4 の表記です。
- 範囲のチェックをガードに書くと、変換の式を単純に保てます。

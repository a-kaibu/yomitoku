---
title: "配列の書き込みを、直前にアクセスした葉のキャッシュで速くする"
description: "array:set/3 は、木構造で持つ配列に値を書き込む。直前にアクセスした葉（要素をまとめたタプル）をキャッシュしておき、近くの位置への書き込みは再計算なしで済ませる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2006-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/array.erl
lines: [672, 716]
function: "array:set/3"
difficulty: 3
format: 2
tags: ["データ構造", "最適化", "キャッシュ"]
---
## ひとことで

`array:set/3` は、`array` の位置 `I0` に値 `Value` を書き込みます。`array` は、要素を葉（小さなタプル）にまとめて、木のように繋いだ構造です。
この関数は、直前に触れた葉を `cache` として記録しておきます。近くの位置に書くときは、キャッシュの葉を書き換えるだけで済みます。

## コード

```erlang:line-numbers=672
set(I0, Value, #array{size = N, zero = Z, fix = Fix, cache = C, cache_index = CI,
                     default = D, elements = E, bits = S}=A)
  when is_integer(I0), I0 >= 0, is_integer(N), is_integer(CI), is_integer(S), is_integer(Z) ->
    I = I0 + Z,
    if I0 < N ->
            if I >= CI, I < CI + ?LEAFSIZE ->
                    A#array{cache = setelement(1 + I - CI, C, Value)};
               true ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    E1 = set_leaf(CI, S, E, C),
                    C1 = get_leaf(CI1, S, E1, D),
                    C2 = setelement(1 + R, C1, Value),
                    A#array{elements = E1, cache = C2, cache_index = CI1}
            end;
       Fix ->
	    erlang:error(badarg);
       true ->
            N1 = I0 + 1,
            if I < ?SIZE(?extend(S)) ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    if CI1 =/= CI ->
                            E1 = set_leaf(CI, S, E, C),
                            C1 = get_leaf(CI1, S, E1, D),
                            C2 = setelement(1 + R, C1, Value),
                            A#array{size = N1, elements = E1,
                                    cache = C2, cache_index = CI1};
                       true ->
                            C1 = setelement(1 + R, C, Value),
                            A#array{size = N1, cache = C1, cache_index = CI1}
                    end;
               true ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    {E1,S1} = grow(I, E, S),
                    E2 = set_leaf(CI, S1, E1, C),
                    C1 = get_leaf(CI1, S1, E2, D),
                    C2 = setelement(1 + R, C1, Value),
                    A#array{size = N1, elements = E2,
                            cache = C2, cache_index = CI1, bits = S1}
            end
    end;
set(_I, _V, _A) ->
    erlang:error(badarg).
```

## 前提知識

- **`array`**: 添字で値を読み書きできる、Erlang の配列モジュールです。Erlang の値は書き換えられないので、書き込みは新しい `array` を作って返します。
- **タプル**: 固定長の値の並びです。`setelement/3` は、タプルの一部だけを書き換えた新しいタプルを作ります。
- **レコード `#array{...}`**: `size`、`elements`、`cache` などの項目を持つ値です。
- **`band`**: ビットごとの論理積です。`I band ?MASK` で、下位ビットを取り出します。葉の中の位置が求まります。
- **`cache` と `cache_index`**: 直前にアクセスした葉の中身と、その葉の先頭の添字です。
- **`Fix`**: 配列が固定サイズかどうかを表します。固定のときは、範囲外への書き込みを `badarg` で拒否します。

## 何をしているか

### 1. 範囲の中で、キャッシュに入っている位置

```erlang:line-numbers=676
    if I0 < N ->
            if I >= CI, I < CI + ?LEAFSIZE ->
                    A#array{cache = setelement(1 + I - CI, C, Value)};
```

`I0` が現在のサイズ `N` より小さく、かつ、その位置がキャッシュの葉の範囲に入っているときは、キャッシュのタプルの中の 1 要素だけを書き換えます。書き込みは最も速い経路です。

### 2. 範囲の中で、キャッシュの外の位置

```erlang:line-numbers=679
               true ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    E1 = set_leaf(CI, S, E, C),
                    C1 = get_leaf(CI1, S, E1, D),
                    C2 = setelement(1 + R, C1, Value),
                    A#array{elements = E1, cache = C2, cache_index = CI1}
            end;
```

キャッシュの範囲にないときは、位置 `I` の下位ビットを `R` として、葉の先頭 `CI1 = I - R` を求めます。今のキャッシュを `set_leaf/4` で木に書き戻し、新しい葉を `get_leaf/4` で取り出します。その葉の中で `R` 番目を書き換えて、新しいキャッシュにします。

### 3. 配列の大きさを超えて書くとき

```erlang:line-numbers=687
       Fix ->
	    erlang:error(badarg);
```

`Fix` が真（固定サイズ）のときは、範囲外への書き込みを `badarg` で拒否します。

### 4. 大きさを増やして書くとき

```erlang:line-numbers=689
       true ->
            N1 = I0 + 1,
            if I < ?SIZE(?extend(S)) ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    if CI1 =/= CI ->
                            E1 = set_leaf(CI, S, E, C),
                            C1 = get_leaf(CI1, S, E1, D),
                            C2 = setelement(1 + R, C1, Value),
                            A#array{size = N1, elements = E1,
                                    cache = C2, cache_index = CI1};
                       true ->
                            C1 = setelement(1 + R, C, Value),
                            A#array{size = N1, cache = C1, cache_index = CI1}
                    end;
```

範囲外でも `Fix` が偽なら、配列を伸ばして書き込みます。新しい大きさ `N1` を設定します。既存の葉の範囲の中にとどまるなら、キャッシュの葉を書き換えるだけで済みます。

### 5. 葉の木も伸ばすとき

```erlang:line-numbers=704
               true ->
                    R = I band ?MASK,
                    CI1 = I - R,
                    {E1,S1} = grow(I, E, S),
                    E2 = set_leaf(CI, S1, E1, C),
                    C1 = get_leaf(CI1, S1, E2, D),
                    C2 = setelement(1 + R, C1, Value),
                    A#array{size = N1, elements = E2,
                            cache = C2, cache_index = CI1, bits = S1}
            end
```

今の葉の木の容量を超えるときは、`grow/3` で木を広げてから、葉を書き込みます。

## ここがすごい

### 直前の葉を覚えておく

配列は、よく連続した位置を読み書きします。そのたびに木をたどると、時間がかかります。
この関数は、直前の葉を `cache` に残しておき、同じ葉の中の書き込みは、タプルの 1 要素の更新だけにしています。関数型の値を書き換えるときの、典型的な高速化です。

### 2 のべきの葉で、位置の計算を単純にする

葉の大きさを 2 のべきにしているので、下位ビットを `band` で取り出すだけで、葉の中の位置と先頭の位置が求まります。割り算を使わずに、ビット演算で済ませています。

## まとめ

- 不変データの配列で連続した書き込みを速くするには、直前にアクセスした部分をキャッシュすると効果が出ます。
- 葉の大きさを 2 のべきにすると、位置の計算をビット演算で行えます。
- 範囲内、範囲外、大きさの拡張で場合分けすると、それぞれの経路を素早く選べます。

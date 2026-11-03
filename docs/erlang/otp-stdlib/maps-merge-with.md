---
title: "2 つの map を合わせるとき、小さい方を回す"
description: "maps:merge_with/3 は、2 つの map を合わせて、同じキューの値を combiner で一つにまとめる。大きい方の map を土台にし、小さい方だけを回すことで、走査の量を減らしている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [388, 404]
function: "maps:merge_with/3"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`maps:merge_with/3` は、2 つの map を 1 つにまとめます。同じキーが両方にあるときは、`Combiner` 関数で値を合成します。
Combiner に渡す引数の順番を保つために、比べる大きさによって 2 つの map の役割を入れ替えています。

## コード

::: code-group

```erlang:line-numbers=388 [日本語訳]
merge_with(Combiner, Map1, Map2) when is_map(Map1),
                                 is_map(Map2),
                                 is_function(Combiner, 3) ->
    %% 比較に >= を使うのは、なるべく combiner の引数の順番を入れ替えずに済ませるためです
    case map_size(Map1) >= map_size(Map2) of
        true ->
            Iterator = maps:iterator(Map2),
            merge_with_1(maps:next(Iterator), Map1, Combiner);
        false ->
            Iterator = maps:iterator(Map1),
            merge_with_1(maps:next(Iterator),
                         Map2,
                         fun(K, V1, V2) -> Combiner(K, V2, V1) end)
    end;
merge_with(Combiner, Map1, Map2) ->
    error_with_info(error_type_merge_intersect(Map1, Map2, Combiner),
                    [Combiner, Map1, Map2]).
```

```erlang:line-numbers=388 [原文]
merge_with(Combiner, Map1, Map2) when is_map(Map1),
                                 is_map(Map2),
                                 is_function(Combiner, 3) ->
    %% Use >= because we want to avoid reversing the combiner if we can
    case map_size(Map1) >= map_size(Map2) of
        true ->
            Iterator = maps:iterator(Map2),
            merge_with_1(maps:next(Iterator), Map1, Combiner);
        false ->
            Iterator = maps:iterator(Map1),
            merge_with_1(maps:next(Iterator),
                         Map2,
                         fun(K, V1, V2) -> Combiner(K, V2, V1) end)
    end;
merge_with(Combiner, Map1, Map2) ->
    error_with_info(error_type_merge_intersect(Map1, Map2, Combiner),
                    [Combiner, Map1, Map2]).
```

:::

## 前提知識

- **map**: キーと値の対応を持つ Erlang のデータ構造です。`#{a => 1}` のように書きます。
- **`maps:iterator/1` と `maps:next/1`**: map の要素を 1 つずつ取り出すためのイテレータです。`maps:next` は `{K, V, 次のイテレータ}` を返します。最後まで行くと `none` を返します。
- **`#{ K := V }`**: map の中に、キー `K` があるときだけ一致するパターンです。
- **`Map1#{ K := V }`**: map の一部の値だけを書き換えた新しい map を作ります。
- **`fun(K, V1, V2) -> ... end`**: 無名関数です。`Combiner` に、引数の順番を入れ替えて渡すために使います。
- **ガード `is_function(Combiner, 3)`**: `Combiner` が引数 3 つの関数かどうかを確かめます。

## 何をしているか

### 1. 大きさを比べて、土台を決める

```erlang:line-numbers=391
    %% Use >= because we want to avoid reversing the combiner if we can
    case map_size(Map1) >= map_size(Map2) of
```

`map_size/1` で 2 つの map の大きさを比べます。ここでは `Map1` のほうが小さくないときに、`Map2` を回す方針を取ります。コメントにあるとおり、比較に `>=` を使うのは、なるべく `Combiner` の引数の順番を入れ替えずに済ませるためです。

### 2. 小さい方を回して、大きい方に入れる

```erlang:line-numbers=393
        true ->
            Iterator = maps:iterator(Map2),
            merge_with_1(maps:next(Iterator), Map1, Combiner);
```

`Map1` のほうが大きい（または同じ）ときは、`Map2` の要素だけを回します。`Map2` のキーが `Map1` にあれば合成し、なければ `Map1` に入れます。`Map1` は、ここで土台として使われます。

### 3. 逆のときは、役割を入れ替える

```erlang:line-numbers=396
        false ->
            Iterator = maps:iterator(Map1),
            merge_with_1(maps:next(Iterator),
                         Map2,
                         fun(K, V1, V2) -> Combiner(K, V2, V1) end)
```

`Map2` のほうが大きいときは、`Map1` の要素を回します。ただし、回すときは `Combiner` に渡す順番を入れ替える必要があります。`fun(K, V1, V2) -> Combiner(K, V2, V1) end` は、引数を反転させて、元の `Map1` の値が `Combiner` の 2 番目に来るようにします。結果として、どちらの向きでも `Combiner(K, Map1の値, Map2の値)` の順になります。

### 4. 1 つずつ合わせる

```erlang:line-numbers=406
merge_with_1({K, V2, Iterator}, Map1, Combiner) ->
    case Map1 of
        #{ K := V1 } ->
            NewMap1 = Map1#{ K := Combiner(K, V1, V2) },
            merge_with_1(maps:next(Iterator), NewMap1, Combiner);
        #{ } ->
            merge_with_1(maps:next(Iterator), maps:put(K, V2, Map1), Combiner)
```

`merge_with_1/3` は、イテレータから 1 つずつ要素を取り出します。キーが土台にあれば、`Combiner` で値を作り直して `#{K := 新しい値}` で更新します。なければ `maps:put/3` で追加します。

### 5. 不正な引数のとき

```erlang:line-numbers=402
merge_with(Combiner, Map1, Map2) ->
    error_with_info(error_type_merge_intersect(Map1, Map2, Combiner),
                    [Combiner, Map1, Map2]).
```

どちらの節にも一致しない（map でない、または `Combiner` が 3 引数の関数でない）ときは、エラーを起こします。

## ここがすごい

### 走査するのは小さい方だけ

map を 1 つずつ土台へコピーするより、大きい方を土台にして、小さい方だけを回す方が速く済みます。
大きい方の要素数を読まなくてよいので、大きさに差がある 2 つの map を合わせるときに効果が出ます。

### 引数の順番を、関数で直している

小さい方を回すと、`Combiner` へ渡す引数の順番が逆になってしまいます。その問題を、無名関数で 2 つの値を入れ替えることで解決しています。
呼び出した人の見たい順番（`Map1` の値が先）を、内部の都合にかかわらず守っています。

## まとめ

- 2 つの map を合わせるとき、大きい方を土台にして、小さい方だけを回すと効率が良くなります。
- 処理の都合で引数の順番が変わるときは、無名関数で入れ替えて元の意味を保てます。
- 比較の向きをわざと `>=` にしたのは、順番を入れ替える回数を減らすためです。

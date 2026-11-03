---
title: "配列の読み出しも、直前の葉のキャッシュを先に見る"
description: "array:get/2 は、配列の位置の値を読む。書き込み（set）と同じキャッシュを使い、直前に触れた葉の中にあれば、タプルから 1 要素を取り出すだけで答えられる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2006-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/array.erl
lines: [986, 1002]
function: "array:get/2"
difficulty: 2
format: 2
tags: ["データ構造", "最適化", "キャッシュ"]
---
## ひとことで

`array:get/2` は、配列の `I0` 番目の値を返します。範囲外の位置を読んだときは、既定の値（`default`）を返します。ただし、配列を固定サイズ（`fix`）で作っていた場合は、`badarg` の例外になります。
前の記事の `array:set/3` と同じように、直前に触れた葉（`cache`）を先に見ます。目的の位置が葉の中にあれば、木をたどらずに答えられます。

## コード

```erlang:line-numbers=986
get(I0, #array{size = N, zero = Z, fix = Fix, cache = C, cache_index = CI,
               elements = E, default = D, bits = S})
  when is_integer(I0), I0 >= 0, is_integer(N), is_integer(CI), is_integer(S), is_integer(Z) ->
    if I0 < N ->
            I = I0 + Z,
            if I >= CI, I < CI + ?LEAFSIZE ->
                    element(1 + I - CI, C);
               true ->
                    get_1(I, S, E, D)
            end;
       Fix ->
	    erlang:error(badarg);
       true ->
	    D
    end;
get(_I, _A) ->
    erlang:error(badarg).
```

## 前提知識

- **配列の仕組み**: `array` は、要素を小さな葉（タプル）にまとめ、それを木のように並べて持ちます。詳しくは前の記事で説明しました。
- **既定値 `default`**: まだ書き込んでいない位置を読むときに返す値です。
- **`element/2`**: タプルの n 番目の要素を取り出す関数です。1 から数えます。
- **`get_1/4`**: キャッシュの外にある葉を、木からたどって読む補助関数です。ここでは詳しく説明しません。
- **`fix` フラグ**: 配列が固定サイズかどうかを表します。

## 何をしているか

### 1. 範囲の内側でキャッシュに入っているとき

```erlang:line-numbers=989
    if I0 < N ->
            I = I0 + Z,
            if I >= CI, I < CI + ?LEAFSIZE ->
                    element(1 + I - CI, C);
```

位置 `I0` が現在のサイズ `N` より小さく、補正後の位置 `I` がキャッシュの葉の範囲にあるときは、`element/2` で葉の中の 1 要素を取り出します。これが最も速い経路です。

### 2. 範囲の内側でキャッシュの外のとき

```erlang:line-numbers=993
               true ->
                    get_1(I, S, E, D)
            end;
```

キャッシュの範囲にないときは、`get_1/4` で木からたどって値を読みます。

### 3. 範囲の外で、固定サイズのとき

```erlang:line-numbers=996
       Fix ->
	    erlang:error(badarg);
```

`Fix` が真なら、範囲外の読み出しはエラーです。`badarg` を投げます。

### 4. 範囲の外で、固定サイズでないとき

```erlang:line-numbers=998
       true ->
	    D
```

固定でなければ、範囲外の位置は、まだ書かれていないものとして既定値 `D` を返します。

## ここがすごい

### 読み書きで、キャッシュの仕組みを共有する

`set/3` が葉を覚えておけば、直後の `get/2` は同じ葉を読むだけで済みます。読み書きが近い位置で続く処理では、どちらも木をたどる回数が減ります。
同じキャッシュを、読みと書きで使い回すのが、この配列の設計の要点です。

### 範囲外の扱いを 2 通りに分ける

固定サイズなら、範囲外は誤りです。固定でなければ、範囲外は「まだ何も置かれていない」ので、既定値を返します。
同じ `get/2` で、用途に合った振る舞いを選べるように、フラグで分けています。

## まとめ

- 読み出しも、直前の葉を先に見ると、近い位置へのアクセスが速くなります。
- 範囲外の扱いを、固定サイズかどうかで分けると、用途に合った振る舞いになります。
- 読み書きで同じキャッシュを使うと、設計が一貫し、理解しやすくなります。

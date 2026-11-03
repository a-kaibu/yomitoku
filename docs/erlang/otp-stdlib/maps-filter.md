---
title: "map を条件で絞るとき、イテレータも同じ関数で受け付ける"
description: "maps:filter/2 は、キーと値の条件に合う組だけを残した新しい map を作る。map を直接渡す場合と、イテレータを渡す場合の 2 つの経路があり、後者では途中のエラーを独自の目印で捕まえる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [726, 738]
function: "maps:filter/2"
difficulty: 2
format: 2
tags: ["データ構造", "イディオム", "標準ライブラリ"]
---
## ひとことで

`maps:filter/2` は、条件 `Pred(Key, Value)` が真になる組だけを残して、新しい map を作ります。元の map は変わりません。
引数には、map そのものだけでなく、`maps:iterator/1` で作ったイテレータも渡せます。どちらの場合も、同じ関数で扱えるように書かれています。

## コード

```erlang:line-numbers=726
filter(Pred, Map) when is_map(Map), is_function(Pred, 2) ->
    maps:from_list(filter_1(Pred, next(iterator(Map)), undefined));
filter(Pred, Iter) when is_function(Pred, 2) ->
    ErrorTag = make_ref(),
    try filter_1(Pred, try_next(Iter, ErrorTag), ErrorTag) of
        Result ->
            maps:from_list(Result)
    catch
        error:ErrorTag ->
            error_with_info({badmap, Iter}, [Pred, Iter])
    end;
filter(Pred, Map) ->
    badarg_with_info([Pred, Map]).
```

## 前提知識

- **map**: キーと値の組を持つデータ構造です。`#{a => 1, b => 2}` のように書きます。
- **イテレータ**: map の組を 1 つずつ取り出すための値です。`maps:iterator/1` で作り、`maps:next/1` で次の組を取ります。
- **`is_function(Pred, 2)`**: 引数を 2 つ取る関数かどうかを確かめます。ここでは「キーと値」を受け取る述語です。
- **`try ... of ... catch ... end`**: 例外を捕まえる構文です。`of` の部分は、正常に終わったときの処理を書きます。
- **`make_ref()`**: 一意な参照を作ります。ほかの値と絶対に混ざらない目印として使えます。
- **`maps:from_list/1`**: 組のリストから map を作ります。

## 何をしているか

### 1. map が渡されたとき

```erlang:line-numbers=726
filter(Pred, Map) when is_map(Map), is_function(Pred, 2) ->
    maps:from_list(filter_1(Pred, next(iterator(Map)), undefined));
```

`Map` が本当に map で、`Pred` が 2 引数の関数なら、イテレータを作って `filter_1/3` で絞り込みます。結果の組のリストを、`maps:from_list/1` で新しい map にします。
この経路では、途中でエラーが起きても、そのまま呼び出し元へ伝わります。

### 2. イテレータが渡されたとき

```erlang:line-numbers=728
filter(Pred, Iter) when is_function(Pred, 2) ->
    ErrorTag = make_ref(),
    try filter_1(Pred, try_next(Iter, ErrorTag), ErrorTag) of
        Result ->
            maps:from_list(Result)
    catch
        error:ErrorTag ->
            error_with_info({badmap, Iter}, [Pred, Iter])
    end;
```

第 2 引数がイテレータのときは、`make_ref()` で一意な目印 `ErrorTag` を作ります。`try_next/2` は、次の組を読むときにエラーが起きたら、この目印を使って例外を投げます。`catch` で目印の付いた例外だけを受け取り、不正なイテレータとして報告します。

### 3. どちらにも当てはまらないとき

```erlang:line-numbers=737
filter(Pred, Map) ->
    badarg_with_info([Pred, Map]).
```

map でもイテレータでもなければ、`badarg_with_info/1` で引数の誤りを報告します。

## ここがすごい

### 目印を作って、他の例外と区別する

イテレータの中で起きた例外を、どれも同じに扱うと、利用者の関数が投げた例外まで握りつぶしてしまいます。
`make_ref()` で作った一意な目印だけを捕まえることで、自分たちの仕組みが起こしたエラーだけを正確に処理できます。

### 1 つの関数で 2 種類の入力を受け付ける

map を渡すのが普通ですが、大きな map を少しずつ処理したいときは、イテレータが役に立ちます。
同じ名前の関数の中で、入力の種類によって経路を切り替えるので、利用者は引数の型を変えるだけで済みます。

## まとめ

- 条件による絞り込みは、map とイテレータの両方を受け付けると使い道が広がります。
- 内部で捕まえる例外には、一意な目印を付けると、関係のない例外と混ざりません。
- 入力の型に応じて経路を切り替えると、呼び出し側の書き方を単純に保てます。

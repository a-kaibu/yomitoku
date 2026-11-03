---
title: "map の各項目を変換して、途中で失敗したら throw で抜ける"
description: "uri_string:percent_decode/1 は、URI の各部分のパーセントエンコードを戻す。map の変換の途中で不正な値が見つかったら throw で一気に抜け、呼び出し側へエラーを返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2017-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/uri_string.erl
lines: [813, 832]
function: "uri_string:percent_decode/1"
difficulty: 2
format: 2
tags: ["文字列処理", "エラー処理", "正規表現"]
---
## ひとことで

`uri_string:percent_decode/1` は、URI の中の `%20` のような「パーセントエンコード」を元の文字に戻します。
URI を分けた map が渡されたら、`userinfo`、`host`、`path`、`query`、`fragment` の各項目を順に変換します。文字列が渡されたら、そのまま全体を変換します。

## コード

::: code-group

```erlang:line-numbers=813 [日本語訳]
percent_decode(URIMap) when is_map(URIMap)->
    Fun = fun (K,V) when K =:= userinfo; K =:= host; K =:= path;
                         K =:= query; K =:= fragment ->
                  case raw_decode(V) of
                      {error, Reason, Input} ->
                          throw({error, {invalid, {K, {Reason, Input}}}});
                      Else ->
                          Else
                  end;
              %% ポートやスキームなど、ほかの項目
              (_,V) ->
                  V
          end,
    try maps:map(Fun, URIMap)
    catch throw:Return ->
            Return
    end;
percent_decode(URI) when is_list(URI) orelse
                         is_binary(URI) ->
    raw_decode(URI).
```

```erlang:line-numbers=813 [原文]
percent_decode(URIMap) when is_map(URIMap)->
    Fun = fun (K,V) when K =:= userinfo; K =:= host; K =:= path;
                         K =:= query; K =:= fragment ->
                  case raw_decode(V) of
                      {error, Reason, Input} ->
                          throw({error, {invalid, {K, {Reason, Input}}}});
                      Else ->
                          Else
                  end;
              %% Handle port and scheme
              (_,V) ->
                  V
          end,
    try maps:map(Fun, URIMap)
    catch throw:Return ->
            Return
    end;
percent_decode(URI) when is_list(URI) orelse
                         is_binary(URI) ->
    raw_decode(URI).
```

:::

## 前提知識

- **パーセントエンコード**: URI の中で使えない文字を `%` と 2 桁の 16 進数で表す方式です。たとえば空白は `%20` になります。
- **map の `maps:map/2`**: 各組の値を、関数で変換した新しい map を作ります。関数は `(Key, Value)` を受け取ります。
- **`throw/1`**: 例外の一種を投げます。`catch` で受け取れます。ここでは、途中で処理を打ち切るために使います。
- **`try ... catch throw:Return -> ... end`**: `throw` で投げられた値だけを捕まえて、結果にします。
- **複数のガード `;`**: ガードの条件を並べて、どれか 1 つでも真なら一致します。
- **`K =:= userinfo`**: キーが、その値と完全に一致するかを確かめます。

## 何をしているか

### 1. 変換の関数

```erlang:line-numbers=814
    Fun = fun (K,V) when K =:= userinfo; K =:= host; K =:= path;
                         K =:= query; K =:= fragment ->
                  case raw_decode(V) of
                      {error, Reason, Input} ->
                          throw({error, {invalid, {K, {Reason, Input}}}});
                      Else ->
                          Else
                  end;
```

キーが `userinfo`、`host`、`path`、`query`、`fragment` のいずれかのとき、`raw_decode/1` で値を変換します。もし変換に失敗すると、`throw` で `{error, ...}` を投げます。失敗を見つけたら、残りの項目を調べる必要はないので、ここで打ち切ります。

### 2. 他の項目

```erlang:line-numbers=822
              %% Handle port and scheme
              (_,V) ->
                  V
```

それ以外の項目（ポートや、スキームなど）は、そのまま返します。コメントにあるとおり、パーセントエンコードを解く対象ではないからです。

### 3. map 全体の変換

```erlang:line-numbers=826
    try maps:map(Fun, URIMap)
    catch throw:Return ->
            Return
    end;
```

`maps:map/2` で、map の全項目を変換します。`throw` で投げられた値を `catch` で受け取り、それを結果にします。途中で失敗したときは、失敗の内容が返ります。

### 4. 文字列やバイナリのとき

```erlang:line-numbers=830
percent_decode(URI) when is_list(URI) orelse
                         is_binary(URI) ->
    raw_decode(URI).
```

URI が文字列やバイナリのときは、全体を `raw_decode/1` にかけるだけです。

## ここがすごい

### エラーを戻り値の値ではなく、例外で運ぶ

map の変換を途中で止めるのに、`maps:map/2` の結果を 1 つずつ確かめて戻す方法もあります。しかし、関数の中で `throw` を使うと、残りの処理を省いて、外の `try` まで一気に戻れます。
エラーが出たときに、後続の項目を無駄に処理しないので、コードも短く保てます。

### 対象の項目だけを変換する

URI の全部を一律に解くと、スキームやポートまで誤って変換するおそれがあります。キーで対象を絞ってから変換する書き方で、その危険を避けています。
コメントで意図を書いておくと、後から読む人が迷いません。

## まとめ

- map の変換の途中で失敗したら、`throw` で一気に抜けると、後始末が簡単になります。
- 変換する対象は、キーで明確に絞ると安全です。
- 例外を投げる場所と捕まえる場所を、対で考えると読みやすくなります。

---
title: "文字列を区切るとき、先頭・末尾・すべてを選ぶ"
description: "string:split/3 は、検索パターンの最初だけ、最後だけ、すべてのどれで区切るかを Where で選ぶ。区切りが見つからなければ、元の文字列を一つだけ持つリストを返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [887, 898]
function: "string:split/3"
difficulty: 2
format: 2
tags: ["文字列処理", "標準ライブラリ"]
---
## ひとことで

`string:split/3` は、文字列を検索パターンで区切り、その部分をリストで返します。
どこで区切るかを、三つ目の引数 `Where` で選べます。`leading` は最初の一つだけ、`trailing` は最後の一つだけ、`all` はすべての出現箇所で区切ります。

## コード

```erlang:line-numbers=887
split(String, SearchPattern, Where) ->
    case is_empty(SearchPattern) of
        true -> [String];
        false ->
            SearchPatternCPs = unicode:characters_to_list(SearchPattern),
            case split_1(String, SearchPatternCPs, {undefined, undefined}, 0, Where, [], []) of
                {_Curr, []} -> [String];
                {_Curr, Acc} when Where =:= trailing -> Acc;
                {Curr, Acc} when Where =:= all -> lists:reverse([Curr|Acc]);
                Acc when is_list(Acc) -> Acc
            end
    end.
```

## 前提知識

- **検索パターン**: 区切りの目印になる文字列です。空の文字列のときは、区切らずに元の文字列をそのまま返します。
- **`Where`**: 区切る場所を指定するアトムです。`leading`、`trailing`、`all` の三つがあります。
- **`unicode:characters_to_list/1`**: 文字列を、文字（コードポイント）のリストに直します。検索の比較を、文字単位で行うために使われています。
- **`split_1/7`**: 実際に文字列を走査する補助関数です。この記事では中身には踏み込みません。
- **`lists:reverse/1`**: リストを逆順にします。途中では、先頭に積んだリストを使うので、最後に順番を戻すために使われます。

## 何をしているか

### 1. 空の検索パターンを先に確かめる

```erlang:line-numbers=888
    case is_empty(SearchPattern) of
        true -> [String];
        false ->
```

検索パターンが空なら、区切る場所がありません。そのため、元の文字列を一つだけ持つリストを返します。

### 2. 区切りの結果を、場所の指定で分ける

```erlang:line-numbers=891
            SearchPatternCPs = unicode:characters_to_list(SearchPattern),
            case split_1(String, SearchPatternCPs, {undefined, undefined}, 0, Where, [], []) of
                {_Curr, []} -> [String];
                {_Curr, Acc} when Where =:= trailing -> Acc;
                {Curr, Acc} when Where =:= all -> lists:reverse([Curr|Acc]);
                Acc when is_list(Acc) -> Acc
            end
```

検索パターンを文字のリストに直し、補助関数で区切り位置を見つけます。結果の形は、次の三通りに分けて扱います。
- 区切りが一つも見つからなければ、元の文字列を一つだけ持つリストを返します。
- `trailing` のときは、途中で積んだ `Acc` をそのまま返します。
- `all` のときは、最後の部分 `Curr` を加えてから、順番を戻して返します。

`leading` のときは、三つ目の節の `Acc when is_list(Acc)` で、積んだリストをそのまま返します。

## ここがすごい

### 一つの関数で、三つの区切り方を選ぶ

区切り方を三つの関数に分けることもできます。
しかし、この関数は `Where` を一つ受け取り、補助関数の結果を形で判定します。外から見ると、区切りの違いはすべて引数で決まります。

### 順番の戻し方を、`all` の時だけ行う

`all` のときだけ、`lists:reverse/1` を使います。
補助関数は、区切りの部分を先頭に積んでいくので、そのままでは順番が逆になります。すべての区切りを残すときだけ、戻す手間をかけています。

### 区切りが無いことを、ふつうの値として返す

区切りが見つからないときは、例外や特別な値ではなく、元の文字列を一つだけ持つリストを返します。
リストの要素数が一つなら、呼び出し側は、ふつうに区切りの後処理ができます。

## まとめ

`string:split("a-b-c", "-", all)` は、`["a", "b", "c"]` 相当の値を返します。
`string:split("a-b-c", "-")` は、最初の `-` だけで区切り、`["a", "b-c"]` 相当の値を返します。

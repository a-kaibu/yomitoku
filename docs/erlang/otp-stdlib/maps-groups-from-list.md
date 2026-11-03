---
title: "同じキーの値を、元の順番のまま、リストにまとめる"
description: "maps:groups_from_list/2 は、リストの各要素からキーを作り、同じキーの要素を 1 つのリストにまとめた map を作る。元の順番を保つために、一度反転してから積み上げている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [1207, 1216]
function: "maps:groups_from_list/2"
difficulty: 2
format: 2
tags: ["データ構造", "イディオム", "標準ライブラリ"]
---
## ひとことで

`maps:groups_from_list/2` は、リストの要素を、関数で決めたキーごとにまとめます。たとえば、数を偶数か奇数かで分けると、`#{even => [2, 4], odd => [1, 3]}` のような map ができます。
同じキーの中では、要素の元の順番が保たれます。

## コード

```erlang:line-numbers=1207
groups_from_list(Fun, List0) when is_function(Fun, 1) ->
    try lists:reverse(List0) of
        List ->
            groups_from_list_1(Fun, List, #{})
    catch
        error:_ ->
            badarg_with_info([Fun, List0])
    end;
groups_from_list(Fun, List) ->
    badarg_with_info([Fun, List]).
```

## 前提知識

- **`Fun`**: 要素を 1 つ受け取り、キーを返す関数です。ここでは `Fun(Elem)` の結果がキーになります。
- **map**: キーと値の組を持つデータ構造です。キーごとに 1 つの値を持ちます。ここでは値がリストになります。
- **`lists:reverse/1`**: リストを反転します。
- **`try ... catch error:_`**: 途中で起きたエラーを捕まえて、`badarg` として報告します。
- **`groups_from_list_1/3`**: 反転したリストを先頭から読み、map にリストを積んでいく補助関数です。ここでは詳しく説明しません。

## 何をしているか

### 1. 入力を反転する

```erlang:line-numbers=1208
    try lists:reverse(List0) of
        List ->
            groups_from_list_1(Fun, List, #{})
```

最初に `lists:reverse/1` で、リストを反転します。反転したリストを先頭から処理すると、後から追加されるリストの先頭に、元の順番で要素が積まれていきます。
ここで、反転は `try` の中にあるので、`List0` がリストでなければ、`badarg` として報告されます。

### 2. 補助関数で積み上げる

```erlang:line-numbers=1210
            groups_from_list_1(Fun, List, #{})
```

`groups_from_list_1/3` が、反転した要素を 1 つずつ読み、`Fun` でキーを決めます。そのキーのリストの先頭に、要素を積んでいきます。反転して積んだリストは、最後に元の順番で並んでいます。

### 3. 引数が不正なとき

```erlang:line-numbers=1215
groups_from_list(Fun, List) ->
    badarg_with_info([Fun, List]).
```

`Fun` が 1 引数の関数でない、または `List` がリストでないときは、`badarg` で報告します。

## ここがすごい

### 反転と積み上げで、順番を保つ

リストの後ろに要素を足すと、コピーが増えて遅くなります。この関数は、先に反転して、先頭に積む形で作ります。
その結果、最後の並びは元のリストと同じ順番になります。コピーを減らしながら、順番を守る工夫です。

### 関数 1 つで、分類のしかたを変えられる

キーを決めるのは、利用者が渡す `Fun` だけです。`groups_from_list` は、分類の仕組みを一般化して、どんな基準にも使えるように作られています。
偶数奇数のような単純な分け方から、文字の先頭文字のような分け方まで、同じ関数で扱えます。

## まとめ

- 同じキーでまとめるときは、先頭への積み上げで書くと、コピーを減らせます。
- 元の順番を保つには、反転と積み上げを組み合わせる方法が有効です。
- 分類の基準を関数として渡すと、一つの関数で多くの用途に使えます。

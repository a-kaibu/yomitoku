---
title: "順序付き辞書から、キーを 1 つ取り除く"
description: "orddict:erase/2 は、キーでソートされた辞書から、指定したキーの組を取り除く。キーが見つからなければ、辞書の内容は変えずに、その位置まで同じリストをつなぎ直す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [255, 259]
function: "orddict:erase/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`orddict:erase/2` は、キーを指定して、その組を辞書から取り除きます。`orddict` は、キーの昇順に並んだ `{Key, Value}` のリストです。
見つからないキーを指定したときは、辞書の内容は変わりません。

## コード

::: code-group

```erlang:line-numbers=255 [日本語訳]
erase(Key, [{K,_}=E|Dict]) when Key < K -> [E|Dict];
erase(Key, [{K,_}=E|Dict]) when Key > K ->
    [E|erase(Key, Dict)];
erase(_Key, [{_K,_Val}|Dict]) -> Dict;		%キーが K と等しいとき
erase(_, []) -> [].
```

```erlang:line-numbers=255 [原文]
erase(Key, [{K,_}=E|Dict]) when Key < K -> [E|Dict];
erase(Key, [{K,_}=E|Dict]) when Key > K ->
    [E|erase(Key, Dict)];
erase(_Key, [{_K,_Val}|Dict]) -> Dict;		%Key == K
erase(_, []) -> [].
```

:::

## 前提知識

- **`orddict`**: キーで並べた `{Key, Value}` のリストで、辞書を表します。キーの重複はありません。
- **`[E|erase(Key, Dict)]`**: 先頭の組 `E` を残して、残りの処理結果をつなぎます。
- **`[]`**: 空の辞書です。キーが見つからなかった場合の終わりです。
- **`[{_K,_Val}|Dict]`**: 先頭の組を捨てて、残りを `Dict` として返すパターンです。
- **ガードの順番**: 節は上から順に試されるので、`Key < K` の節が先に使われます。

## 何をしているか

### 1. キーが先頭より小さいとき

```erlang:line-numbers=255
erase(Key, [{K,_}=E|Dict]) when Key < K -> [E|Dict];
```

`Key` が先頭のキー `K` より小さければ、辞書はキーの昇順なので、`Key` はこの先にもありません。先頭の組 `E` をそのまま残した辞書を返します。

### 2. キーが先頭より大きいとき

```erlang:line-numbers=256
erase(Key, [{K,_}=E|Dict]) when Key > K ->
    [E|erase(Key, Dict)];
```

`Key` が `K` より大きければ、先頭の組 `E` は残し、残りの辞書で同じ削除を続けます。

### 3. キーが一致したとき

```erlang:line-numbers=258
erase(_Key, [{_K,_Val}|Dict]) -> Dict;		%Key == K
```

`Key` と `K` が等しければ、その組を捨てて、残りの `Dict` を返します。これで、キーの組が取り除かれます。

### 4. 空の辞書のとき

```erlang:line-numbers=259
erase(_, []) -> [].
```

最後まで見つからなければ、空の辞書を返します。

## ここがすごい

### 昇順なので、途中で探索を打ち切れる

並んでいない辞書では、最後まで見ないと、キーがあるかが分かりません。順序付きの辞書では、先頭のキーより小さいキーは、もう現れません。
この関数は、その性質で、`Key < K` の場合に即座に答えを出します。

### 削除の結果を、前の部分だけ作り直す

不変データでは、途中の組を取り除くには、その前の部分を新しく作り直す必要があります。後ろの部分は、そのまま共有されます。
この関数も、削除位置より前だけを組み直し、後ろは元のリストを使います。

## まとめ

- 昇順の辞書では、キーの大小で、探索を途中で打ち切れます。
- 不変データの削除は、前の部分だけを作り直し、後ろは共有すると効率的です。
- 見つからない場合は、辞書をそのまま返すので、呼び出し側は結果を気にせず使えます。
